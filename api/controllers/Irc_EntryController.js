/* global IrcEntryEventValidatorService Event Detainee */

'use strict';

var ValidationError = require('../lib/exceptions/ValidationError');
var BedCountService = require('../services/BedCountService');

const updateDetaineeModel = (detainee, newDetaineeProperties) => {
  detainee.timestamp = newDetaineeProperties.timestamp;

  if (newDetaineeProperties.gender) {
    detainee.gender = newDetaineeProperties.gender;
  }
  if (newDetaineeProperties.nationality) {
    detainee.nationality = newDetaineeProperties.nationality;
  }
  if (newDetaineeProperties.cid_id) {
    detainee.cid_id = newDetaineeProperties.cid_id;
  }
};

let generateStandardEvent = (detainee, request_body) =>
  ({
    centre: detainee.centre,
    detainee: detainee,
    operation: request_body.operation,
    timestamp: request_body.timestamp
  });

let generateDetainee = (centre, request_body) =>
  ({
    centre: centre,
    person_id: request_body.person_id,
    timestamp: request_body.timestamp,
    nationality: request_body.nationality,
    gender: Detainee.normalizeGender(request_body.gender),
    cid_id: request_body.cid_id
  });

let getPopulatedDetainee = (detaineeId) => Detainee.findOne(detaineeId).populate('centre');

let createOrUpdateDetainee = (detaineeProperties) =>
  Detainee.findOne({
    person_id: detaineeProperties.person_id,
    centre: detaineeProperties.centre.id
  }).then((detainee) => {
    if (!detainee) {
      return Detainee.create(detaineeProperties).then((detainee) => getPopulatedDetainee(detainee.id));
    } else if (detainee.timestamp.toISOString() <= detaineeProperties.timestamp) {
      updateDetaineeModel(detainee, detaineeProperties);
      return detainee.save().then((detainee) => getPopulatedDetainee(detainee.id));
    }
    return detainee;
  });

let processEventDetainee = (request_body) =>
  Centres.findOne({ name: request_body.centre })
    .then((centre) => createOrUpdateDetainee(generateDetainee(centre, request_body)));

let publishCentreUpdates = (centre) =>
  Centres.findOne(centre)
    .then(BedCountService.performConfiguredReconciliation)
    .then((centre) => Centres.publishUpdate(centre.id, centre.toJSON()))
    .return(centre);

module.exports = {
  _config: {
    actions: false,
    shortcuts: false,
    rest: false,
    exposedMethods: [
      'heartbeat',
      'event'
    ]
  },

  heartbeatOptions: (req, res) =>
    res.ok(IrcEntryHeartbeatValidatorService.schema),
  eventOptions: (req, res) =>
    res.ok(IrcEntryEventValidatorService.schema),

  index: (req, res) => res.ok,

  process_heartbeat: (request_body) =>
    Centres.update(
      {
        name: request_body.centre
      }, {
        heartbeat_received: new Date(),
        male_in_use: request_body.male_occupied,
        female_in_use: request_body.female_occupied,
        male_out_of_commission: request_body.male_outofcommission,
        female_out_of_commission: request_body.female_outofcommission
      })
      .then(centres => {
        if (centres.length !== 1) {
          throw new ValidationError("Invalid centre");
        }
        return centres[0];
      }),

  heartbeatPost: function (req, res) {
    return IrcEntryHeartbeatValidatorService.validate(req.body)
      .then(this.process_heartbeat)
      .tap((centre) => Centres.publishCentreUpdates(centre.id))
      .then(res.ok)
      .catch(ValidationError, (error) => {
        res.badRequest(error.message);
      })
      .catch((error) => {
        res.serverError(error.message);
      });
  },

  process_event: function (request_body) {
    switch (request_body.operation) {
    case Event.OPERATION_INTER_SITE_TRANSFER:
      return processEventDetainee(request_body)
        .then((detainee) => this.handleInterSiteTransfer(detainee, request_body));
    case Event.OPERATION_UPDATE:
      return processEventDetainee(request_body)
        .tap((detainee) => publishCentreUpdates(detainee.centre.id));
    case Event.OPERATION_CHECK_IN:
    case Event.OPERATION_CHECK_OUT:
    case Event.OPERATION_REINSTATEMENT:
      return processEventDetainee(request_body)
        .then((detainee) => Event.create(generateStandardEvent(detainee, request_body)))
        .tap((event) => publishCentreUpdates(event.centre));
    default:
      throw new ValidationError('Unknown operation');
    }
  },

  handleInterSiteTransfer: function (detainee, request_body) {
    return this.process_event({
      centre: request_body.centre,
      person_id: request_body.person_id,
      timestamp: request_body.timestamp,
      operation: Event.OPERATION_CHECK_OUT
    })
    .then(() => this.process_event({
      centre: request_body.centre_to,
      person_id: request_body.person_id,
      timestamp: request_body.timestamp,
      nationality: detainee.nationality,
      gender: detainee.gender,
      cid_id: detainee.cid_id,
      operation: Event.OPERATION_CHECK_IN
    }));
  },


  eventPost: function (req, res) {
    return IrcEntryEventValidatorService.validate(req.body)
      .then(this.process_event)
      .then(res.ok)
      .catch(ValidationError, error => res.badRequest(error.result.errors[0].message))
      .catch((error) => {
        res.serverError(error.message);
      });
  }
};
