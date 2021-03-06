'use strict';

const service = require('../../../api/services/DepmuEntryPrebookingValidatorService');
const validation_schema = service.schema;

describe('UNIT DepmuEntryPrebookingValidatorService', function () {
  let originalvalidatorservice;
  before(() => {
    originalvalidatorservice = global.RequestValidatorService;
    global.RequestValidatorService = {
      validate: sinon.stub()
    };
    service.validate({centre: 'bar'});
  });
  after(() => global.RequestValidatorService = originalvalidatorservice);

  it('Should call the RequstValidatorService', () =>
    expect(global.RequestValidatorService.validate).to.be.calledWith({centre: 'bar'}, validation_schema)
  );
});
