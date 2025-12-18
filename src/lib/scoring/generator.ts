import { v4 as uuidv4 } from 'uuid';
import { HoleScore, GeneratedRound } from '@/types';
import { gaussianRandom } from './gaussian';
import { calculateCourseHandicap, calculateStrokesReceived } from './handicap';
import { GhostGolferConfig, validateConfig } from './validation';

/**
 * GhostGolfer - Generates realistic golf scores for a ghost player based on handicap.
 *
 * Direct port of the Python GhostGolfer class from /old/ghost_golfer.py.
 * Uses Gaussian distributions and USGA-style handicap calculations.
 */
export class GhostGolfer {
  readonly handicapIndex: number;
  readonly courseRating: number;
  readonly slopeRating: number;
  readonly parValues: number[];
  readonly holeHandicaps: number[];
  readonly courseHandicap: number;

  /**
   * Initialize a GhostGolfer with the given configuration.
   *
   * @param config - Configuration including handicap, course data, and hole info
   * @throws ZodError if configuration is invalid
   */
  constructor(config: GhostGolferConfig) {
    const validated = validateConfig(config);

    this.handicapIndex = validated.handicapIndex;
    this.courseRating = validated.courseRating;
    this.slopeRating = validated.slopeRating;
    this.parValues = validated.parValues;
    this.holeHandicaps = validated.holeHandicaps;
    this.courseHandicap = calculateCourseHandicap(
      this.handicapIndex,
      this.slopeRating
    );
  }

  /**
   * Generate a realistic round of golf scores.
   *
   * Algorithm (ported from Python):
   * 1. Calculate strokes per hole based on course handicap
   * 2. Apply round-level variance (Gaussian, std=1.2)
   * 3. For each hole:
   *    - Calculate base score (par + strokes per hole)
   *    - Add per-hole randomness (Gaussian, std=1.1)
   *    - Apply difficulty factor based on hole handicap
   *    - Clamp to valid range (par-1 to par+6)
   *    - Calculate net score (gross - strokes received)
   *
   * @returns Complete round result with 18 hole scores and totals
   */
  generateRound(): GeneratedRound {
    const scores: HoleScore[] = [];
    const strokesPerHole = this.courseHandicap / 18.0;

    // Round-level variance (affects all holes consistently)
    const roundAdjustment = gaussianRandom(0, 1.2);

    for (let i = 0; i < 18; i++) {
      const par = this.parValues[i];
      const holeHcp = this.holeHandicaps[i];

      // Calculate strokes received based on course handicap and hole difficulty
      const strokesReceived = calculateStrokesReceived(
        this.courseHandicap,
        holeHcp
      );

      // Base expected score
      const baseScore = par + strokesPerHole;

      // Per-hole randomness
      const holeRandomness = gaussianRandom(0, 1.1);

      // Difficulty factor based on hole handicap
      // Hard holes (1-6): +0.3 (tend to score higher)
      // Easy holes (13-18): -0.2 (tend to score lower)
      // Medium holes (7-12): 0 (no adjustment)
      let difficultyFactor = 0;
      if (holeHcp <= 6) {
        difficultyFactor = 0.3;
      } else if (holeHcp >= 13) {
        difficultyFactor = -0.2;
      }

      // Calculate raw score
      const rawScore =
        baseScore + roundAdjustment / 18.0 + holeRandomness + difficultyFactor;

      // Clamp to valid range: eagle (par-1) to triple+ (par+6)
      const grossScore = Math.max(
        par - 1,
        Math.min(par + 6, Math.round(rawScore))
      );

      const netScore = grossScore - strokesReceived;

      scores.push({
        hole: i + 1,
        par,
        grossScore,
        strokesReceived,
        netScore,
      });
    }

    // Calculate totals
    const totalGross = scores.reduce((sum, s) => sum + s.grossScore, 0);
    const totalNet = scores.reduce((sum, s) => sum + s.netScore, 0);
    const totalPar = scores.reduce((sum, s) => sum + s.par, 0);

    return {
      id: uuidv4(),
      scores,
      courseHandicap: this.courseHandicap,
      totalGross,
      totalNet,
      totalPar,
      createdAt: new Date(),
    };
  }
}

/**
 * Convenience function for one-off score generation.
 *
 * Creates a GhostGolfer and generates a single round.
 *
 * @param config - Configuration including handicap, course data, and hole info
 * @returns Complete round result with 18 hole scores and totals
 */
export function generateRound(config: GhostGolferConfig): GeneratedRound {
  const golfer = new GhostGolfer(config);
  return golfer.generateRound();
}
