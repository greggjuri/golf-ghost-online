# PRP: Scoring Engine

## Overview
Port the complete scoring algorithm from `/old/ghost_golfer.py` to TypeScript. This is the core functionality of the app - generating realistic golf scores based on handicap index using Gaussian distributions and USGA-style calculations. This is marked as CRITICAL in the project planning.

## Context Files Read
- [x] CLAUDE.md - Project rules and conventions
- [x] docs/PLANNING.md - Architecture overview (scoring in src/lib/scoring/)
- [x] docs/DECISIONS.md - DEC-007: Direct port of Python algorithm exactly
- [x] docs/TASK.md - Current status (Phase 2 tasks 04-08 relate to scoring)
- [x] /old/ghost_golfer.py - Original Python implementation (73 lines)
- [x] src/types/index.ts - Existing TypeScript types (ScoreInput, HoleScore, GeneratedRound)
- [x] package.json - Current dependencies (no Jest yet)

## Requirements
From INITIAL/04-scoring-engine.md:

1. **Gaussian Random Number Generator** - Box-Muller transform for normal distribution
2. **Course Handicap Calculation** - `round((handicapIndex * slopeRating) / 113)`
3. **Stroke Allocation Logic** - 0, 1, or 2 strokes based on course/hole handicap
4. **Score Generation** - Main algorithm with round variance and per-hole randomness
5. **GhostGolfer Class** - Encapsulates the algorithm matching Python structure
6. **Unit Tests** - Comprehensive tests for all components
7. **Input Validation** - Zod schemas for validating inputs

## Technical Approach

### Algorithm Port Strategy
1. Direct 1:1 port of Python logic to TypeScript
2. Preserve all magic numbers (1.2, 1.1, 0.3, -0.2, etc.)
3. Use Box-Muller transform for Gaussian random (equivalent to Python's `random.gauss`)
4. Keep same variable names where possible for easy comparison

### Type Integration
Existing types in `src/types/index.ts` already define:
- `ScoreInput` - matches GhostGolferConfig needs
- `HoleScore` - matches per-hole output
- `GeneratedRound` - matches round output

### Testing Strategy
- Install Jest with TypeScript support
- Statistical tests for Gaussian distribution
- Exact value tests for deterministic calculations
- Boundary tests for score clamping
- Integration test with 1000 rounds for distribution validation

## Implementation Steps

### Step 1: Install and Configure Jest
**Files**: `package.json`, `jest.config.js`, `tsconfig.json`

**Actions**:
1. Install Jest and TypeScript support:
   ```bash
   npm install -D jest @types/jest ts-jest
   ```
2. Create `jest.config.js`:
   ```javascript
   /** @type {import('jest').Config} */
   const config = {
     preset: 'ts-jest',
     testEnvironment: 'node',
     roots: ['<rootDir>/src'],
     testMatch: ['**/__tests__/**/*.test.ts'],
     moduleNameMapper: {
       '^@/(.*)$': '<rootDir>/src/$1',
     },
   };
   module.exports = config;
   ```
3. Add test script to package.json:
   ```json
   "scripts": {
     "test": "jest",
     "test:watch": "jest --watch",
     "test:coverage": "jest --coverage"
   }
   ```

**Validation**: `npm test` runs (even with no tests)

### Step 2: Implement Gaussian Random Generator
**Files**: `src/lib/scoring/gaussian.ts`

**Actions**:
1. Implement Box-Muller transform:
   ```typescript
   /**
    * Generate a random number from a Gaussian (normal) distribution
    * using the Box-Muller transform.
    *
    * Equivalent to Python's random.gauss(mean, std)
    */
   export function gaussianRandom(mean: number = 0, stdDev: number = 1): number {
     // Box-Muller transform
     const u1 = Math.random();
     const u2 = Math.random();

     const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

     return z0 * stdDev + mean;
   }
   ```

**Validation**: Statistical tests pass for mean and stdDev

### Step 3: Implement Course Handicap Calculation
**Files**: `src/lib/scoring/handicap.ts`

**Actions**:
1. Create handicap calculation functions:
   ```typescript
   /**
    * Calculate course handicap from handicap index and slope rating.
    *
    * Formula: round((handicapIndex * slopeRating) / 113)
    *
    * 113 is the standard slope rating.
    */
   export function calculateCourseHandicap(
     handicapIndex: number,
     slopeRating: number
   ): number {
     return Math.round((handicapIndex * slopeRating) / 113);
   }

   /**
    * Calculate strokes received on a hole based on course handicap
    * and the hole's difficulty ranking.
    *
    * - If courseHandicap >= holeHandicap: 1 stroke
    * - If courseHandicap > 18 AND holeHandicap <= (courseHandicap - 18): 2 strokes
    * - Otherwise: 0 strokes
    */
   export function calculateStrokesReceived(
     courseHandicap: number,
     holeHandicap: number
   ): number {
     if (courseHandicap > 18) {
       const extraStrokes = courseHandicap - 18;
       if (holeHandicap <= extraStrokes) {
         return 2;
       }
     }

     if (holeHandicap <= courseHandicap) {
       return 1;
     }

     return 0;
   }
   ```

**Validation**: Exact value tests pass for known inputs

### Step 4: Implement Input Validation
**Files**: `src/lib/scoring/validation.ts`

**Actions**:
1. Install Zod:
   ```bash
   npm install zod
   ```
2. Create validation schemas:
   ```typescript
   import { z } from 'zod';

   export const GhostGolferConfigSchema = z.object({
     handicapIndex: z.number().min(0).max(54),
     courseRating: z.number().min(60).max(80),
     slopeRating: z.number().int().min(55).max(155),
     parValues: z.array(z.number().int().min(3).max(5)).length(18),
     holeHandicaps: z.array(z.number().int().min(1).max(18)).length(18)
       .refine(
         (arr) => new Set(arr).size === 18,
         { message: 'Hole handicaps must be unique values 1-18' }
       ),
   });

   export type GhostGolferConfig = z.infer<typeof GhostGolferConfigSchema>;

   export function validateConfig(config: unknown): GhostGolferConfig {
     return GhostGolferConfigSchema.parse(config);
   }
   ```

**Validation**: Invalid inputs throw Zod errors, valid inputs pass

### Step 5: Implement Score Generator
**Files**: `src/lib/scoring/generator.ts`

**Actions**:
1. Create GhostGolfer class (direct port from Python):
   ```typescript
   import { v4 as uuidv4 } from 'uuid';
   import { HoleScore, GeneratedRound } from '@/types';
   import { gaussianRandom } from './gaussian';
   import { calculateCourseHandicap, calculateStrokesReceived } from './handicap';
   import { GhostGolferConfig, validateConfig } from './validation';

   export class GhostGolfer {
     readonly handicapIndex: number;
     readonly courseRating: number;
     readonly slopeRating: number;
     readonly parValues: number[];
     readonly holeHandicaps: number[];
     readonly courseHandicap: number;

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

     generateRound(): GeneratedRound {
       const scores: HoleScore[] = [];
       const strokesPerHole = this.courseHandicap / 18.0;
       const roundAdjustment = gaussianRandom(0, 1.2);

       for (let i = 0; i < 18; i++) {
         const par = this.parValues[i];
         const holeHcp = this.holeHandicaps[i];

         // Calculate strokes received
         const strokesReceived = calculateStrokesReceived(
           this.courseHandicap,
           holeHcp
         );

         // Base expected score
         const baseScore = par + strokesPerHole;

         // Per-hole randomness
         const holeRandomness = gaussianRandom(0, 1.1);

         // Difficulty factor based on hole handicap
         let difficultyFactor = 0;
         if (holeHcp <= 6) {
           difficultyFactor = 0.3; // Hard holes
         } else if (holeHcp >= 13) {
           difficultyFactor = -0.2; // Easy holes
         }

         // Calculate raw score
         const rawScore =
           baseScore +
           roundAdjustment / 18.0 +
           holeRandomness +
           difficultyFactor;

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

   // Convenience function for one-off generation
   export function generateRound(config: GhostGolferConfig): GeneratedRound {
     const golfer = new GhostGolfer(config);
     return golfer.generateRound();
   }
   ```
2. Install uuid:
   ```bash
   npm install uuid
   npm install -D @types/uuid
   ```

**Validation**: generateRound() returns valid GeneratedRound

### Step 6: Create Barrel Export
**Files**: `src/lib/scoring/index.ts`

**Actions**:
1. Export all scoring functions:
   ```typescript
   export { gaussianRandom } from './gaussian';
   export {
     calculateCourseHandicap,
     calculateStrokesReceived,
   } from './handicap';
   export {
     GhostGolferConfigSchema,
     type GhostGolferConfig,
     validateConfig,
   } from './validation';
   export { GhostGolfer, generateRound } from './generator';
   ```

**Validation**: Imports from `@/lib/scoring` work

### Step 7: Write Unit Tests
**Files**:
- `src/lib/scoring/__tests__/gaussian.test.ts`
- `src/lib/scoring/__tests__/handicap.test.ts`
- `src/lib/scoring/__tests__/validation.test.ts`
- `src/lib/scoring/__tests__/generator.test.ts`

**Actions**:
1. Create `src/lib/scoring/__tests__/gaussian.test.ts`:
   ```typescript
   import { gaussianRandom } from '../gaussian';

   describe('gaussianRandom', () => {
     it('should generate values with correct mean', () => {
       const samples = Array.from({ length: 10000 }, () => gaussianRandom(5, 1));
       const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
       expect(mean).toBeCloseTo(5, 0); // Within 0.5
     });

     it('should generate values with correct standard deviation', () => {
       const samples = Array.from({ length: 10000 }, () => gaussianRandom(0, 2));
       const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
       const variance =
         samples.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) /
         samples.length;
       const stdDev = Math.sqrt(variance);
       expect(stdDev).toBeCloseTo(2, 0); // Within 0.5
     });

     it('should generate different values each call', () => {
       const a = gaussianRandom(0, 1);
       const b = gaussianRandom(0, 1);
       const c = gaussianRandom(0, 1);
       // Extremely unlikely to be equal
       expect(a === b && b === c).toBe(false);
     });
   });
   ```

2. Create `src/lib/scoring/__tests__/handicap.test.ts`:
   ```typescript
   import {
     calculateCourseHandicap,
     calculateStrokesReceived,
   } from '../handicap';

   describe('calculateCourseHandicap', () => {
     it('should return 15 for handicap 15 at standard slope 113', () => {
       expect(calculateCourseHandicap(15.0, 113)).toBe(15);
     });

     it('should return 17 for handicap 15 at slope 130', () => {
       expect(calculateCourseHandicap(15.0, 130)).toBe(17);
     });

     it('should return 13 for handicap 15 at slope 96', () => {
       expect(calculateCourseHandicap(15.0, 96)).toBe(13);
     });

     it('should return 0 for scratch golfer', () => {
       expect(calculateCourseHandicap(0.0, 113)).toBe(0);
     });

     it('should return 36 for high handicap', () => {
       expect(calculateCourseHandicap(36.0, 113)).toBe(36);
     });

     it('should handle decimal handicaps', () => {
       expect(calculateCourseHandicap(15.4, 113)).toBe(15);
       expect(calculateCourseHandicap(15.6, 113)).toBe(16);
     });
   });

   describe('calculateStrokesReceived', () => {
     it('should return 1 stroke when course hcp >= hole hcp', () => {
       expect(calculateStrokesReceived(10, 5)).toBe(1);
       expect(calculateStrokesReceived(10, 10)).toBe(1);
     });

     it('should return 0 strokes when course hcp < hole hcp', () => {
       expect(calculateStrokesReceived(10, 15)).toBe(0);
       expect(calculateStrokesReceived(10, 11)).toBe(0);
     });

     it('should return 2 strokes for high handicap on hard holes', () => {
       // Course hcp 20: extra strokes on holes 1-2
       expect(calculateStrokesReceived(20, 1)).toBe(2);
       expect(calculateStrokesReceived(20, 2)).toBe(2);
       expect(calculateStrokesReceived(20, 3)).toBe(1);
     });

     it('should return 2 strokes on all holes for course hcp 36', () => {
       // Course hcp 36: 18 extra strokes
       expect(calculateStrokesReceived(36, 1)).toBe(2);
       expect(calculateStrokesReceived(36, 18)).toBe(2);
     });

     it('should return 0 for scratch golfer', () => {
       expect(calculateStrokesReceived(0, 1)).toBe(0);
       expect(calculateStrokesReceived(0, 18)).toBe(0);
     });
   });
   ```

3. Create `src/lib/scoring/__tests__/validation.test.ts`:
   ```typescript
   import { validateConfig, GhostGolferConfigSchema } from '../validation';

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

     it('should reject slope rating out of range', () => {
       expect(() =>
         validateConfig({ ...validConfig, slopeRating: 54 })
       ).toThrow();
       expect(() =>
         validateConfig({ ...validConfig, slopeRating: 156 })
       ).toThrow();
     });

     it('should reject wrong number of par values', () => {
       expect(() =>
         validateConfig({ ...validConfig, parValues: [4, 3, 4] })
       ).toThrow();
     });

     it('should reject invalid par values', () => {
       const badPars = [...validConfig.parValues];
       badPars[0] = 2; // Invalid: par must be 3-5
       expect(() =>
         validateConfig({ ...validConfig, parValues: badPars })
       ).toThrow();
     });

     it('should reject duplicate hole handicaps', () => {
       const duplicateHcps = [...validConfig.holeHandicaps];
       duplicateHcps[0] = duplicateHcps[1]; // Create duplicate
       expect(() =>
         validateConfig({ ...validConfig, holeHandicaps: duplicateHcps })
       ).toThrow();
     });
   });
   ```

4. Create `src/lib/scoring/__tests__/generator.test.ts`:
   ```typescript
   import { GhostGolfer, generateRound } from '../generator';

   const testConfig = {
     handicapIndex: 15.0,
     courseRating: 72.3,
     slopeRating: 130,
     parValues: [4, 3, 4, 3, 5, 4, 4, 4, 4, 4, 4, 3, 5, 4, 4, 5, 3, 4],
     holeHandicaps: [3, 17, 15, 7, 9, 11, 1, 13, 5, 4, 14, 18, 8, 12, 6, 10, 16, 2],
   };

   describe('GhostGolfer', () => {
     it('should calculate correct course handicap', () => {
       const golfer = new GhostGolfer(testConfig);
       // 15.0 * 130 / 113 = 17.26 -> rounds to 17
       expect(golfer.courseHandicap).toBe(17);
     });

     it('should generate 18 hole scores', () => {
       const golfer = new GhostGolfer(testConfig);
       const round = golfer.generateRound();
       expect(round.scores).toHaveLength(18);
     });

     it('should have scores in valid range (par-1 to par+6)', () => {
       const golfer = new GhostGolfer(testConfig);
       const round = golfer.generateRound();

       round.scores.forEach((score) => {
         expect(score.grossScore).toBeGreaterThanOrEqual(score.par - 1);
         expect(score.grossScore).toBeLessThanOrEqual(score.par + 6);
       });
     });

     it('should have correct net score calculation', () => {
       const golfer = new GhostGolfer(testConfig);
       const round = golfer.generateRound();

       round.scores.forEach((score) => {
         expect(score.netScore).toBe(score.grossScore - score.strokesReceived);
       });
     });

     it('should have correct total calculations', () => {
       const golfer = new GhostGolfer(testConfig);
       const round = golfer.generateRound();

       const expectedTotalGross = round.scores.reduce(
         (sum, s) => sum + s.grossScore,
         0
       );
       const expectedTotalNet = round.scores.reduce(
         (sum, s) => sum + s.netScore,
         0
       );
       const expectedTotalPar = round.scores.reduce(
         (sum, s) => sum + s.par,
         0
       );

       expect(round.totalGross).toBe(expectedTotalGross);
       expect(round.totalNet).toBe(expectedTotalNet);
       expect(round.totalPar).toBe(expectedTotalPar);
     });

     it('should generate unique IDs', () => {
       const golfer = new GhostGolfer(testConfig);
       const round1 = golfer.generateRound();
       const round2 = golfer.generateRound();
       expect(round1.id).not.toBe(round2.id);
     });
   });

   describe('generateRound convenience function', () => {
     it('should work as standalone function', () => {
       const round = generateRound(testConfig);
       expect(round.scores).toHaveLength(18);
       expect(round.courseHandicap).toBe(17);
     });
   });

   describe('Statistical validation', () => {
     it('should generate realistic score distribution over 1000 rounds', () => {
       const golfer = new GhostGolfer({
         handicapIndex: 15.0,
         courseRating: 72.0,
         slopeRating: 113, // Standard slope
         parValues: [4, 3, 4, 3, 5, 4, 4, 4, 4, 4, 4, 3, 5, 4, 4, 5, 3, 4],
         holeHandicaps: [3, 17, 15, 7, 9, 11, 1, 13, 5, 4, 14, 18, 8, 12, 6, 10, 16, 2],
       });

       const rounds = Array.from({ length: 1000 }, () => golfer.generateRound());
       const totalPar = 72;
       const grossScores = rounds.map((r) => r.totalGross);

       const avgGross =
         grossScores.reduce((a, b) => a + b, 0) / grossScores.length;

       // Average should be approximately par + handicap (72 + 15 = 87)
       // Allow ±3 for variance
       expect(avgGross).toBeGreaterThan(totalPar + 15 - 3);
       expect(avgGross).toBeLessThan(totalPar + 15 + 3);

       // Scores should have variance (not all the same)
       const uniqueScores = new Set(grossScores);
       expect(uniqueScores.size).toBeGreaterThan(10);
     });
   });
   ```

**Validation**: All tests pass with `npm test`

### Step 8: Final Verification and Git Commit
**Files**: `docs/TASK.md`

**Actions**:
1. Run all tests: `npm test`
2. Run lint: `npm run lint`
3. Run build: `npm run build`
4. Verify TypeScript: `npx tsc --noEmit`
5. Update `docs/TASK.md`:
   - Mark Phase 2 tasks as complete
   - Update active task
6. Git commit:
   ```bash
   git add .
   git commit -m "feat: implement scoring engine from Python port

   - Gaussian random number generator (Box-Muller transform)
   - Course handicap calculation (USGA formula)
   - Stroke allocation logic (1 or 2 strokes per hole)
   - GhostGolfer class with generateRound()
   - Zod validation for input config
   - Comprehensive unit tests (statistical and exact)
   - All functions exportable from @/lib/scoring"
   ```
7. Git push: `git push`

**Validation**:
- All tests pass
- Build succeeds
- TypeScript compiles without errors

## Testing Requirements
- [ ] Gaussian mean within 0.1 of specified value (10,000 samples)
- [ ] Gaussian stdDev within 0.1 of specified value (10,000 samples)
- [ ] Course handicap exact values: (15, 113)→15, (15, 130)→17, (15, 96)→13
- [ ] Stroke allocation: (10, 5)→1, (10, 15)→0, (20, 2)→2, (36, 18)→2
- [ ] All generated scores in range [par-1, par+6]
- [ ] Net score = gross score - strokes received
- [ ] Total calculations correct (sum of hole scores)
- [ ] Statistical test: 1000 rounds avg gross ≈ par + handicap (±3)
- [ ] Validation rejects invalid inputs
- [ ] Validation accepts valid inputs

## Validation Commands
```bash
# Install dependencies
npm install zod uuid
npm install -D jest @types/jest ts-jest @types/uuid

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Verify TypeScript
npx tsc --noEmit

# Verify build
npm run build

# Verify lint
npm run lint
```

## Success Criteria
- [ ] All unit tests pass with `npm test`
- [ ] `GhostGolfer` class generates valid 18-hole rounds
- [ ] Course handicap calculation matches Python exactly
- [ ] Stroke allocation matches Python exactly
- [ ] Score distribution is statistically valid (tested with 1000+ rounds)
- [ ] All scores bounded between par-1 and par+6
- [ ] TypeScript strict mode - no errors
- [ ] Exports work from `@/lib/scoring`
- [ ] Git committed with message `feat: implement scoring engine from Python port`
- [ ] Git pushed

## Confidence Score
**9/10** - High confidence

**Rationale**:
- Python algorithm is straightforward to port (73 lines)
- Box-Muller transform is well-documented and simple
- All formulas are explicitly defined in the INITIAL file
- Types already exist in `src/types/index.ts`
- Test cases are comprehensive and specific
- Only uncertainty: Jest configuration with Next.js 14 (should be straightforward)

## Notes

### Magic Numbers Preserved
The following constants from the Python code are preserved exactly:
- `1.2` - Round adjustment standard deviation
- `1.1` - Hole randomness standard deviation
- `0.3` - Difficulty factor for hard holes (handicap 1-6)
- `-0.2` - Difficulty factor for easy holes (handicap 13-18)
- `113` - Standard slope rating (USGA constant)
- `par - 1` to `par + 6` - Score bounds (eagle to triple bogey+)

### Consolidation Note
This PRP consolidates multiple TASK.md items:
- 04-scoring-types (types already exist)
- 05-gaussian-random
- 06-handicap-calc
- 07-score-generator
- 08-scoring-tests

All are implemented together since they're tightly coupled.

### UUID Dependency
Using `uuid` package for generating round IDs. This is a standard, well-maintained package.

### No Seeded Random for Tests
Statistical tests are used instead of seeded random. This is more robust and matches how the algorithm will be used in production. The tests use large sample sizes (10,000 for Gaussian, 1000 for rounds) to ensure statistical validity.

### Jest with Next.js
Jest should work with Next.js 14 using `ts-jest`. The configuration uses `testEnvironment: 'node'` since we're testing pure TypeScript functions, not React components.
