'use strict';

const model = rewire('../../api/models/BedEvent');
const Promise = require('bluebird');

describe('UNIT BedEventModel', () => {
  describe('getCurrentOOCByCentre', () => {
    var populate;
    var input = 1;
    var filterOutput = [{
      bed: {
        gender: 'male'
      },
      id: 2
    }, {
      bed: {
        gender: 'male'
      },
      id: 3
    }, {
      bed: {
        gender: 'male'
      },
      id: 5
    }];

    beforeEach(() => {
      populate = sinon.stub().returnsThis();
      sinon.stub(BedEvent, 'find').returns({
        populate: populate,
        toPromise: sinon.stub().returnsThis(),
        filter: sinon.stub().resolves(filterOutput),
      })
    });

    afterEach(() => BedEvent.find.restore());

    it('should return filtered ooc beds found and populated', () =>
      expect(model.getCurrentOOCByCentre(input)).to.eventually.deep.equal(filterOutput)
    );

    it('should pass the correct mapping to BedEvent.find', () => {
      model.getCurrentOOCByCentre(input);
      return expect(BedEvent.find).to.be.calledWith({
        where: {
          active: true,
          operation: "out commission"
        }
      });
    });

    it('should pass the correct mapping to populate', () => {
      model.getCurrentOOCByCentre(input);
      return expect(populate).to.be.calledWith('bed', {
        where: {
          centre: input
        }, select: ['gender', 'centre']
      });
    });
  });

  describe('getOOCByCentreGroupByGenderAndReason', () => {
    var input = 1;
    var getCurrentOOCByCentreOutput = [
      {
        bed: {
          gender: 'male'
        },
        reason: 'Single Occupancy'
      }, {
        bed: {
          gender: 'male'
        },
        reason: 'Maintenance - Malicious/Accidental Damage'
      }, {
        bed: {
          gender: 'female'
        },
        reason: 'Maintenance - Health and Safety Concern'
      }, {
        bed: {
          gender: 'female'
        },
        reason: 'Maintenance - Planned works'
      }, {
        bed: {
          gender: 'female'
        },
        reason: 'Crime Scene'
      }, {
        bed: {
          gender: 'female'
        },
        reason: 'Medical Isolation'
      }, {
        bed: {
          gender: 'female'
        },
        reason: 'Other'
      }, {
        bed: {
          gender: 'female'
        },
        reason: 'Other'
      }];
    var output = {
      male: {
        "Crime Scene": 0,
        "Maintenance - Health and Safety Concern": 0,
        'Maintenance - Malicious/Accidental Damage': 1,
        'Single Occupancy': 1,
        "Maintenance - Planned works": 0,
        "Medical Isolation": 0,
        "Single Occupancy - Reserved": 0,
        "Other": 0
      },
      female: {
        "Crime Scene": 1,
        "Maintenance - Health and Safety Concern": 1,
        "Maintenance - Malicious/Accidental Damage": 0,
        "Maintenance - Planned works": 1,
        "Medical Isolation": 1,
        "Other": 2,
        "Single Occupancy - Reserved": 0,
        "Single Occupancy": 0
      }
    };

    beforeEach(() => {
      sinon.stub(BedEvent, 'getCurrentOOCByCentre').resolves(getCurrentOOCByCentreOutput);
    });

    afterEach(() => {
      BedEvent.getCurrentOOCByCentre.restore()
    });

    it('should return ooc beds grouped by gender and count by reason', () =>
      expect(model.getOOCByCentreGroupByGenderAndReason(input)).to.eventually.deep.equal(output)
    );
  });

  describe('groupByGender', () => {
    var input = [{
      bed: {
        gender: 'male'
      },
      id: 2
    }, {
      bed: {
        gender: 'male'
      },
      id: 3
    }];
    var output = {
      "male": [
        {
          "bed": {
            "gender": "male"
          },
          "id": 2
        }, {
          "bed": {
            "gender": "male"
          },
          "id": 3
        }]
    };

    it('should return object grouped by gender', () => {
      expect(model.groupByGender(input)).to.deep.equal(output);
    });
  });

  describe('groupAndCountByReason', () => {
    var input = {
      male: [{
        bed: {gender: 'male'},
        reason: 'Single Occupancy'
      }, {
        bed: {gender: 'male'},
        reason: 'Maintenance - Malicious/Accidental Damage'
      }],
      female: [{
        bed: {gender: 'female'},
        reason: 'Maintenance - Health and Safety Concern'
      }, {
        bed: {gender: 'female'},
        reason: 'Maintenance - Planned works'
      }, {
        bed: {gender: 'female'},
        reason: 'Crime Scene'
      }, {
        bed: {gender: 'female'},
        reason: 'Medical Isolation'
      }, {
        bed: {gender: 'female'},
        reason: 'Other'
      }, {
        bed: {gender: 'female'},
        reason: 'Other'
      }
      ]
    };
    var output = {
      male: {
        'Single Occupancy': 1,
        'Maintenance - Malicious/Accidental Damage': 1
      },
      female: {
        'Maintenance - Health and Safety Concern': 1,
        'Maintenance - Planned works': 1,
        'Crime Scene': 1,
        'Medical Isolation': 1,
        Other: 2
      }
    };

    it('should return object, where key = value of reason attribute and value = count per gender per reason', () => {
      expect(model.groupAndCountByReason(input)).to.deep.equal(output);
    });
  });

  describe('deactivatePastBedEvents', () => {
    var bid = '1';
    var ts = 100;

    beforeEach(() => sinon.stub(BedEvent, 'update').resolves(true));

    afterEach(() => BedEvent.update.restore());

    it('should pass the correct mapping to BedEvent.update', () => {
        model.deactivatePastBedEvents(bid, ts);
        return expect(BedEvent.update).to.be.calledWithMatch({
          bed: '1',
          timestamp: {'<=': new Date(100)}
        }, {active: false});
      }
    );
  });
});

describe('INTEGRATION BedEventModel', () => {
  it('should get the fixtures', () =>
    expect(BedEvent.find()).to.eventually.have.length(14)
  );
});
