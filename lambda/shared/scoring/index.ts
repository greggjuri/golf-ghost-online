// Gaussian random number generator
export { gaussianRandom } from './gaussian.js';

// Handicap calculations
export { calculateCourseHandicap, calculateStrokesReceived } from './handicap.js';

// Validation
export {
  GhostGolferConfigSchema,
  type GhostGolferConfig,
  validateConfig,
} from './validation.js';

// Score generation
export { GhostGolfer, generateRound } from './generator.js';
export type { HoleScore, GeneratedRound } from './generator.js';
