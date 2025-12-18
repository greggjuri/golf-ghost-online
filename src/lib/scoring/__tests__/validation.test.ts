import { validateConfig } from '../validation';

const validConfig = {
  handicapIndex: 15.0,
  courseRating: 72.0,
  slopeRating: 130,
  parValues: [4, 3, 4, 3, 5, 4, 4, 4, 4, 4, 4, 3, 5, 4, 4, 5, 3, 4],
  holeHandicaps: [3, 17, 15, 7, 9, 11, 1, 13, 5, 4, 14, 18, 8, 12, 6, 10, 16, 2],
};

describe('validateConfig', () => {
  it('should accept valid config', () => {
    expect(() => validateConfig(validConfig)).not.toThrow();
  });

  it('should return the validated config', () => {
    const result = validateConfig(validConfig);
    expect(result).toEqual(validConfig);
  });

  describe('handicapIndex validation', () => {
    it('should reject handicap index > 54', () => {
      expect(() =>
        validateConfig({ ...validConfig, handicapIndex: 55 })
      ).toThrow();
    });

    it('should reject handicap index < 0', () => {
      expect(() =>
        validateConfig({ ...validConfig, handicapIndex: -1 })
      ).toThrow();
    });

    it('should accept handicap index of 0', () => {
      expect(() =>
        validateConfig({ ...validConfig, handicapIndex: 0 })
      ).not.toThrow();
    });

    it('should accept handicap index of 54', () => {
      expect(() =>
        validateConfig({ ...validConfig, handicapIndex: 54 })
      ).not.toThrow();
    });

    it('should accept decimal handicap index', () => {
      expect(() =>
        validateConfig({ ...validConfig, handicapIndex: 15.4 })
      ).not.toThrow();
    });
  });

  describe('courseRating validation', () => {
    it('should reject course rating < 60', () => {
      expect(() =>
        validateConfig({ ...validConfig, courseRating: 59 })
      ).toThrow();
    });

    it('should reject course rating > 80', () => {
      expect(() =>
        validateConfig({ ...validConfig, courseRating: 81 })
      ).toThrow();
    });

    it('should accept course rating at boundaries', () => {
      expect(() =>
        validateConfig({ ...validConfig, courseRating: 60 })
      ).not.toThrow();
      expect(() =>
        validateConfig({ ...validConfig, courseRating: 80 })
      ).not.toThrow();
    });
  });

  describe('slopeRating validation', () => {
    it('should reject slope rating < 55', () => {
      expect(() =>
        validateConfig({ ...validConfig, slopeRating: 54 })
      ).toThrow();
    });

    it('should reject slope rating > 155', () => {
      expect(() =>
        validateConfig({ ...validConfig, slopeRating: 156 })
      ).toThrow();
    });

    it('should accept slope rating at boundaries', () => {
      expect(() =>
        validateConfig({ ...validConfig, slopeRating: 55 })
      ).not.toThrow();
      expect(() =>
        validateConfig({ ...validConfig, slopeRating: 155 })
      ).not.toThrow();
    });

    it('should reject non-integer slope rating', () => {
      expect(() =>
        validateConfig({ ...validConfig, slopeRating: 130.5 })
      ).toThrow();
    });
  });

  describe('parValues validation', () => {
    it('should reject wrong number of par values', () => {
      expect(() =>
        validateConfig({ ...validConfig, parValues: [4, 3, 4] })
      ).toThrow();
    });

    it('should reject par values below 3', () => {
      const badPars = [...validConfig.parValues];
      badPars[0] = 2;
      expect(() =>
        validateConfig({ ...validConfig, parValues: badPars })
      ).toThrow();
    });

    it('should reject par values above 5', () => {
      const badPars = [...validConfig.parValues];
      badPars[0] = 6;
      expect(() =>
        validateConfig({ ...validConfig, parValues: badPars })
      ).toThrow();
    });

    it('should reject non-integer par values', () => {
      const badPars = [...validConfig.parValues];
      badPars[0] = 4.5;
      expect(() =>
        validateConfig({ ...validConfig, parValues: badPars })
      ).toThrow();
    });
  });

  describe('holeHandicaps validation', () => {
    it('should reject wrong number of hole handicaps', () => {
      expect(() =>
        validateConfig({ ...validConfig, holeHandicaps: [1, 2, 3] })
      ).toThrow();
    });

    it('should reject duplicate hole handicaps', () => {
      const duplicateHcps = [...validConfig.holeHandicaps];
      duplicateHcps[0] = duplicateHcps[1];
      expect(() =>
        validateConfig({ ...validConfig, holeHandicaps: duplicateHcps })
      ).toThrow();
    });

    it('should reject hole handicaps below 1', () => {
      const badHcps = [...validConfig.holeHandicaps];
      badHcps[0] = 0;
      expect(() =>
        validateConfig({ ...validConfig, holeHandicaps: badHcps })
      ).toThrow();
    });

    it('should reject hole handicaps above 18', () => {
      const badHcps = [...validConfig.holeHandicaps];
      badHcps[0] = 19;
      expect(() =>
        validateConfig({ ...validConfig, holeHandicaps: badHcps })
      ).toThrow();
    });

    it('should reject non-integer hole handicaps', () => {
      const badHcps = [...validConfig.holeHandicaps];
      badHcps[0] = 1.5;
      expect(() =>
        validateConfig({ ...validConfig, holeHandicaps: badHcps })
      ).toThrow();
    });
  });
});
