'use strict';

var ValidationError = require('../lib/exceptions/ValidationError');
var LinkingModels = require('sails-linking-models');

const model = {
  schema: true,
  autoCreatedAt: true,
  autoUpdatedAt: true,
  attributes: {
    heartbeat_recieved: {
      type: 'datetime'
    },
    cid_received_date: {
      type: 'datetime'
    },
    name: {
      type: 'string',
      defaultsTo: 0,
      required: true,
      unique: true
    },
    male_capacity: {
      type: 'integer',
      defaultsTo: 0,
      required: true
    },
    female_capacity: {
      type: 'integer',
      defaultsTo: 0,
      required: true
    },
    male_in_use: {
      type: 'integer',
      defaultsTo: 0,
      required: true
    },
    female_in_use: {
      type: 'integer',
      defaultsTo: 0,
      required: true
    },
    male_out_of_commission: {
      type: 'integer',
      defaultsTo: 0,
      required: true
    },
    female_out_of_commission: {
      type: 'integer',
      defaultsTo: 0,
      required: true
    },
    male_cid_name: {
      type: 'array'
    },
    female_cid_name: {
      type: 'array'
    },
    mo_type: {
      type: 'string',
      required: true,
      defaultsTo: 0
    },
    events: {
      collection: 'event',
      via: 'centre'
    },
    detainees: {
      collection: 'detainee',
      via: 'centre'
    },
    movements: {
      collection: 'movement',
      via: 'centre'
    },
    toJSON: function () {
      const maleCapacity = this.male_capacity - this.male_in_use;
      const femaleCapacity = this.female_capacity - this.female_in_use;
      const response = {
        type: 'centre',
        id: this.id.toString(),
        attributes: {
          cidReceivedDate: this.cid_received_date,
          updated: this.updatedAt,
          heartbeatRecieved: this.heartbeat_recieved ? this.heartbeat_recieved.toString() : null,
          name: this.name,
          maleCapacity: this.male_capacity,
          femaleCapacity: this.female_capacity,
          maleInUse: this.male_in_use,
          femaleInUse: this.female_in_use,
          maleOutOfCommission: this.male_out_of_commission,
          femaleOutOfCommission: this.female_out_of_commission,
          maleAvailability: maleCapacity - this.male_out_of_commission,
          femaleAvailability: femaleCapacity - this.female_out_of_commission,
          maleActiveMovementsIn: this.male_active_movements_in.length,
          maleActiveMovementsOut: this.male_active_movements_out.length,
          femaleActiveMovementsIn: this.female_active_movements_in.length,
          femaleActiveMovementsOut: this.female_active_movements_out.length
        },
        links: this.modelLinks('centres', reverseRouteService)
      };
      return response;
    }
  },

  getGenderAndCentreByCIDLocation: function (location) {
    return this.find().then(centres =>
      _.compact(_.map(centres, centre => {
        if (_.contains(centre.male_cid_name, location)) {
          return {
            centre: centre.id,
            gender: 'male'
          };
        }
        if (_.contains(centre.female_cid_name, location)) {
          return {
            centre: centre.id,
            gender: 'female'
          };
        }
      }))[0]
    );
  },

  removeNonOccupancy: function () {
    return this.destroy({'mo-type': 'non-occupancy'});
  },

  afterCreate: function (record, done) {
    this.publishCreate(record);
    done();
  },

  afterUpdate: function (record, done) {
    this.publishUpdate(record.id, record);
    done();
  },

  afterDestroy: function (records, done) {
    _.map(records, (record) => this.publishDestroy(record.id, record));
    done();
  },

  getByName: function (name) {
    return this.findByName(name)
      .then((centre) => {
        if (centre === undefined || centre.length !== 1) {
          throw new ValidationError('Invalid centre');
        }
        return centre[0];
      });
  }
};

module.exports = LinkingModels.mixin(model);
