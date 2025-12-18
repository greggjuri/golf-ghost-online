// Gaussian random number generator
export { gaussianRandom } from './gaussian';

// Handicap calculations
export { calculateCourseHandicap, calculateStrokesReceived } from './handicap';

// Validation
export {
  GhostGolferConfigSchema,
  type GhostGolferConfig,
  validateConfig,
} from './validation';

// Score generation
export { GhostGolfer, generateRound } from './generator';
