/* global Movement CidEntryMovementValidatorService Detainee Prebooking */
'use strict';

var ValidationError = require('../lib/exceptions/ValidationError');

module.exports = {
  _config: {
    actions: false,
    shortcuts: false,
    rest: false,
    exposedMethods: [
      'movement'
    ]
  },

  movementOptions: (req, res) => res.ok(CidEntryMovementValidatorService.schema),

  movementProcess: movement =>
    Movement.findAndUpdateOrCreate(movement['MO Ref.'],
      {
        centre: movement.centre,
        detainee: movement.detainee,
        id: movement['MO Ref.'],
        direction: movement['MO In/MO Out'],
        active: true
      }
    ),

  removePrebookingWithRelatedMovement: movements =>
    Prebooking.destroy({
      cid_id: movements.map(movement => movement['CID Person ID'])
    }),

  detaineeProcess: movement =>
    Detainee.findAndUpdateOrCreate(
      {cid_id: movement['CID Person ID']},
      {
        cid_id: movement['CID Person ID'],
        gender: movement.gender
      }
      )
      .then(detainee => _.merge(movement, {detainee: detainee.id})),

  formatMovement: movement => {
    movement['MO Ref.'] = parseInt(movement['MO Ref.']);
    movement['CID Person ID'] = parseInt(movement['CID Person ID']);
    movement['MO In/MO Out'] = movement['MO In/MO Out'].toLowerCase().trim();
    return movement;
  },

  filterNonOccupancyMovements: movement => movement['MO Type'] !== "Non-Occupancy",

  populateMovementWithCentreAndGender: movement =>
    _.memoize(Centres.getGenderAndCentreByCIDLocation)(movement.Location)
      .then(result => _.merge(movement, result)),

  filterNonEmptyMovements: movement => movement.centre && movement['MO Ref.'] > 1,

  markNonMatchingMovementsAsInactive: movements =>
    Movement.update(
      {
        id: {
          not: _.map(movements, movement => movement.id)
        }
      },
      {
        active: false
      }
    ),

  updateReceivedDate: (movements) =>
    Centres.update({}, {cid_received_date: new Date()})
      .then(() => movements),

  movementPost: function (req, res) {
    return CidEntryMovementValidatorService.validate(req.body)
      .then(body => body.Output)
      .map(this.formatMovement)

      .filter(this.filterNonOccupancyMovements)

      .map(this.populateMovementWithCentreAndGender)

      .filter(this.filterNonEmptyMovements)

      .tap(this.removePrebookingWithRelatedMovement)
      .map(this.detaineeProcess)
      .map(this.movementProcess)

      .then(this.markNonMatchingMovementsAsInactive)
      .then(this.updateReceivedDate)
      .then(Centres.publishCentreUpdates)

      .then(res.ok)
      .catch(ValidationError, error => {
        res.badRequest(error.result.errors[0].message);
      })
      .catch(error => {
        res.serverError(error.message);
      });
  }
};
