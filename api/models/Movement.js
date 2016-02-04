/* global Detainee */
"use strict";

var LinkingModels = require('sails-linking-models');
var ModelHelpers = require('../lib/ModelHelpers');

var setNormalisedRelationships = (record, done) => {
  // this is a workaround until waterline supports conditional
  // joins see balderdashy/waterline#988 and balderdashy/waterline#645
  delete record.active_male_centre;
  delete record.active_female_centre;
  if (record.active) {
    Detainee.findOne(record.detainee)
      .then(detainee => {
        record[`active_${detainee.gender}_centre`] = record.centre;
      })
      .finally(() => done());
  } else {
    done();
  }
};

const model = {
  schema: true,
  autoCreatedAt: true,
  autoUpdatedAt: true,
  attributes: {
    centre: {
      model: "centres",
      required: true
    },
    detainee: {
      model: "detainee",
      required: true
    },
    active: {
      type: "boolean",
      defaultsTo: true
    },
    active_male_centre: {
      model: "centres"
    },
    active_female_centre: {
      model: "centres"
    }
  },
  beforeUpdate: setNormalisedRelationships,

  beforeCreate: setNormalisedRelationships,

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
  }
};

module.exports = LinkingModels.mixin(ModelHelpers.mixin(model));
