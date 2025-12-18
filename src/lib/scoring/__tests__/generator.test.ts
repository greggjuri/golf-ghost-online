import { GhostGolfer, generateRound } from '../generator';
import { GhostGolferConfig } from '../validation';

const validConfig: GhostGolferConfig = {
  handicapIndex: 15.0,
  courseRating: 72.0,
  slopeRating: 130,
  parValues: [4, 3, 4, 3, 5, 4, 4, 4, 4, 4, 4, 3, 5, 4, 4, 5, 3, 4],
  holeHandicaps: [3, 17, 15, 7, 9, 11, 1, 13, 5, 4, 14, 18, 8, 12, 6, 10, 16, 2],
};

describe('GhostGolfer', () => {
  describe('constructor', () => {
    it('should calculate correct course handicap', () => {
      const golfer = new GhostGolfer(validConfig);
      // Course handicap = round((15 * 130) / 113) = round(17.26) = 17
      expect(golfer.courseHandicap).toBe(17);
    });

    it('should store config values correctly', () => {
      const golfer = new GhostGolfer(validConfig);
      expect(golfer.handicapIndex).toBe(15.0);
      expect(golfer.courseRating).toBe(72.0);
      expect(golfer.slopeRating).toBe(130);
      expect(golfer.parValues).toEqual(validConfig.parValues);
      expect(golfer.holeHandicaps).toEqual(validConfig.holeHandicaps);
    });

    it('should throw on invalid config', () => {
      expect(
        () => new GhostGolfer({ ...validConfig, handicapIndex: 55 })
      ).toThrow();
    });
  });

  describe('generateRound', () => {
    it('should generate 18 hole scores', () => {
      const golfer = new GhostGolfer(validConfig);
      const round = golfer.generateRound();
      expect(round.scores.length).toBe(18);
    });

    it('should assign correct hole numbers', () => {
      const golfer = new GhostGolfer(validConfig);
      const round = golfer.generateRound();
      round.scores.forEach((score, index) => {
        expect(score.hole).toBe(index + 1);
      });
    });

    it('should assign correct par values', () => {
      const golfer = new GhostGolfer(validConfig);
      const round = golfer.generateRound();
      round.scores.forEach((score, index) => {
        expect(score.par).toBe(validConfig.parValues[index]);
      });
    });

    it('should generate scores within valid range (par-1 to par+6)', () => {
      const golfer = new GhostGolfer(validConfig);
      // Generate multiple rounds to test variance
      for (let i = 0; i < 100; i++) {
        const round = golfer.generateRound();
        round.scores.forEach((score) => {
          expect(score.grossScore).toBeGreaterThanOrEqual(score.par - 1);
          expect(score.grossScore).toBeLessThanOrEqual(score.par + 6);
        });
      }
    });

    it('should calculate net score correctly', () => {
      const golfer = new GhostGolfer(validConfig);
      const round = golfer.generateRound();
      round.scores.forEach((score) => {
        expect(score.netScore).toBe(score.grossScore - score.strokesReceived);
      });
    });

    it('should calculate total gross correctly', () => {
      const golfer = new GhostGolfer(validConfig);
      const round = golfer.generateRound();
      const expectedTotal = round.scores.reduce(
        (sum, s) => sum + s.grossScore,
        0
      );
      expect(round.totalGross).toBe(expectedTotal);
    });

    it('should calculate total net correctly', () => {
      const golfer = new GhostGolfer(validConfig);
      const round = golfer.generateRound();
      const expectedTotal = round.scores.reduce(
        (sum, s) => sum + s.netScore,
        0
      );
      expect(round.totalNet).toBe(expectedTotal);
    });

    it('should calculate total par correctly', () => {
      const golfer = new GhostGolfer(validConfig);
      const round = golfer.generateRound();
      const expectedTotal = round.scores.reduce((sum, s) => sum + s.par, 0);
      expect(round.totalPar).toBe(expectedTotal);
    });

    it('should generate unique IDs for each round', () => {
      const golfer = new GhostGolfer(validConfig);
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const round = golfer.generateRound();
        expect(ids.has(round.id)).toBe(false);
        ids.add(round.id);
      }
    });

    it('should include course handicap in result', () => {
      const golfer = new GhostGolfer(validConfig);
      const round = golfer.generateRound();
      expect(round.courseHandicap).toBe(17);
    });

    it('should include creation timestamp', () => {
      const before = new Date();
      const golfer = new GhostGolfer(validConfig);
      const round = golfer.generateRound();
      const after = new Date();
      expect(round.createdAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(round.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('statistical validation', () => {
    it('should produce average gross score near expected (par + strokes per hole)', () => {
      const golfer = new GhostGolfer(validConfig);
      const numRounds = 1000;
      const totalPar = validConfig.parValues.reduce((a, b) => a + b, 0);

      let totalGrossSum = 0;
      for (let i = 0; i < numRounds; i++) {
        const round = golfer.generateRound();
        totalGrossSum += round.totalGross;
      }

      const averageGross = totalGrossSum / numRounds;
      const expectedGross = totalPar + golfer.courseHandicap;

      // Average should be within 3 strokes of expected
      expect(averageGross).toBeGreaterThan(expectedGross - 3);
      expect(averageGross).toBeLessThan(expectedGross + 3);
    });

    it('should produce variance in scores across rounds', () => {
      const golfer = new GhostGolfer(validConfig);
      const grossScores: number[] = [];

      for (let i = 0; i < 100; i++) {
        grossScores.push(golfer.generateRound().totalGross);
      }

      const uniqueScores = new Set(grossScores);
      // Should have at least 10 different total scores across 100 rounds
      expect(uniqueScores.size).toBeGreaterThan(10);
    });
  });
});

describe('generateRound convenience function', () => {
  it('should generate a complete round', () => {
    const round = generateRound(validConfig);
    expect(round.scores.length).toBe(18);
    expect(round.courseHandicap).toBe(17);
    expect(typeof round.totalGross).toBe('number');
    expect(typeof round.totalNet).toBe('number');
    expect(typeof round.totalPar).toBe('number');
  });

  it('should throw on invalid config', () => {
    expect(() =>
      generateRound({ ...validConfig, slopeRating: 200 })
    ).toThrow();
  });
});
