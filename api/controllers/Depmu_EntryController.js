/* global Prebooking DepmuEntryPrebookingValidatorService Movement */
'use strict';

const ValidationError = require('../lib/exceptions/ValidationError');
const moment = require('moment-timezone');
const _ = require('lodash');

module.exports = {
  _config: {
    actions: false,
    shortcuts: false,
    rest: false,
    exposedMethods: [
      'prebooking'
    ]
  },

  prebookingOptions: (req, res) => res.ok(DepmuEntryPrebookingValidatorService.schema),

  truncatePrebookings: () =>
    Prebooking.destroy({}),

  formatPrebooking: prebooking => {
    prebooking.cid_id = prebooking.cid_id || null;
    prebooking.location = prebooking.location.trim();
    prebooking.task_force = prebooking.task_force.toLowerCase().trim();
    prebooking.timestamp = new Date(prebooking.timestamp);
    return prebooking;
  },

  populatePrebookingWithContingency: prebooking => {
    prebooking.contingency = prebooking.task_force.startsWith('depmu') || prebooking.task_force.startsWith('htu');
    return prebooking;
  },

  populatePrebookingWithCentreAndGender: prebooking =>
    _.memoize(Centres.getGenderAndCentreByCIDLocation)(prebooking.location)
      .then(result =>
        _.merge(prebooking, result)),

  filterContingencyWithoutCid: prebooking =>
  !prebooking.contingency || prebooking.contingency && _.isNull(prebooking.cid_id),

  filterNonEmptyPrebookings: prebooking =>
  prebooking.centre && prebooking.gender && prebooking.task_force && prebooking.timestamp,

  filterCurrentRangePrebookings: prebooking => {
    var startOfDay = moment().subtract(7, 'hours').set({hour: 7, minute: 0, second: 0, millisecond: 0}); // eslint-disable-line no-magic-numbers
    var endOfDay = moment(startOfDay).add(1, 'day');
    var prebookingTimestamp = moment(prebooking.timestamp);
    return prebookingTimestamp.isSameOrAfter(startOfDay) && prebookingTimestamp.isBefore(endOfDay);
  },

  filterPrebookingsWithNoMovementOrder: prebooking => {
    if (prebooking.cid_id !== null) {
      return Movement.find({active: true, direction: 'in', cid_id: prebooking.cid_id})
        .toPromise()
        .then(movements => movements.length < 1);
    }
    return true;
  },

  emptyCheck: prebookings => {
    if (prebookings.length < 1) {
      throw new RangeError("No prebookings to process in expected time range");
    }
  },

  prebookingProcess: prebooking =>
    Prebooking.create(
      {
        centre: prebooking.centre,
        gender: prebooking.gender,
        task_force: prebooking.task_force,
        contingency: prebooking.contingency,
        cid_id: prebooking.cid_id
      })
      .then(() => prebooking),

  updateReceivedDate: () =>
    Centres.update({}, {prebooking_received: new Date()}),

  prebookingPost: function (req, res) {
    return DepmuEntryPrebookingValidatorService.validate(req.body)
      .then(body => body.cDataSet)
      .map(this.formatPrebooking)
      .map(this.populatePrebookingWithContingency)
      .map(this.populatePrebookingWithCentreAndGender)
      .filter(this.filterContingencyWithoutCid)
      .filter(this.filterNonEmptyPrebookings)
      .filter(this.filterCurrentRangePrebookings)
      .filter(this.filterPrebookingsWithNoMovementOrder)
      .tap(this.emptyCheck)
      .tap(this.truncatePrebookings)
      .map(this.prebookingProcess)
      .tap(this.updateReceivedDate)
      .tap(Centres.publishUpdateAll)
      .then(res.ok)
      .catch(ValidationError, error => res.badRequest(error.result.errors[0].message))
      .catch(RangeError, error => res.unprocessableEntity(error))
      .catch(error => res.serverError(error.message));
  }
};
