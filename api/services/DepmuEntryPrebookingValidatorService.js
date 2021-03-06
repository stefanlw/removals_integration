'use strict';

const validation_schema = {
  $schema: "http://json-schema.org/draft-04/schema#",
  type: "object",
  definitions: {
    task_force: {
      type: "string",
      description: "Ops team who requested the prebooking"
    },
    timestamp: {
      type: "string",
      description: "ISO8601 formated DateTime that the prebooking occurred",
      format: "date-time"
    },
    location: {
      type: "string",
      description: "IRC location reserved for the subject"
    },
    cid_id: {
      anyOf: [
        {
          type: "integer",
          minimum: 0
        },
        {
          type: "string",
          maxLength: 1
        },
        {
          type: "null"
        }
      ],
      description: "CID ID of the subject"
    }
  },
  properties: {
    additionalProperties: false,
    cDataSet: {
      type: "array",
      additionalItems: true,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "task_force",
          "timestamp",
          "location"
        ],
        properties: {
          task_force: {$ref: "#/definitions/task_force"},
          timestamp: {$ref: "#/definitions/timestamp"},
          location: {$ref: "#/definitions/location"},
          cid_id: {$ref: "#/definitions/cid_id"}
        }
      }
    }
  },
  required: [
    "cDataSet"
  ]
};

module.exports = {
  validate: function (request_body) {
    return RequestValidatorService.validate(request_body, validation_schema);
  },
  schema: validation_schema
};
