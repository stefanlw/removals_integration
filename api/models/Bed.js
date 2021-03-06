/* global BedEvent*/
'use strict';

const LinkingModels = require('sails-linking-models');
const ModelHelpers = require('../lib/ModelHelpers');
const _ = require('lodash');

const model = {
  autoCreatedAt: true,
  autoUpdatedAt: true,
  schema: true,
  attributes: {
    centre: {
      model: "centres",
      required: true
    },
    bed_ref: {
      type: 'string',
      required: true
    },
    gender: {
      type: 'string',
      enum: ['male', 'female'],
      required: false,
      defaultsTo: null
    }
  },
  afterDestroy: function (records, done) {
    Promise.all(_.map(records, (record) =>
      BedEvent.destroy({bed: record.id})
        .then(() => this.publishDestroy(record.id))
    )).then(() => done());
  }
};

module.exports = LinkingModels.mixin(ModelHelpers.mixin(model));
