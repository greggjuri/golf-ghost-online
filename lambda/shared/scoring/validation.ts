import { z } from 'zod';

/**
 * Zod schema for validating GhostGolfer configuration.
 *
 * Validates:
 * - handicapIndex: 0.0 to 54.0
 * - courseRating: 60.0 to 80.0
 * - slopeRating: 55 to 155 (integer)
 * - parValues: exactly 18 integers, each 3-5
 * - holeHandicaps: exactly 18 unique integers, each 1-18
 */
export const GhostGolferConfigSchema = z.object({
  handicapIndex: z
    .number()
    .min(0, 'Handicap index must be at least 0')
    .max(54, 'Handicap index cannot exceed 54'),
  courseRating: z
    .number()
    .min(60, 'Course rating must be at least 60')
    .max(80, 'Course rating cannot exceed 80'),
  slopeRating: z
    .number()
    .int('Slope rating must be an integer')
    .min(55, 'Slope rating must be at least 55')
    .max(155, 'Slope rating cannot exceed 155'),
  parValues: z
    .array(
      z
        .number()
        .int('Par values must be integers')
        .min(3, 'Par must be at least 3')
        .max(5, 'Par cannot exceed 5')
    )
    .length(18, 'Must have exactly 18 par values'),
  holeHandicaps: z
    .array(
      z
        .number()
        .int('Hole handicaps must be integers')
        .min(1, 'Hole handicap must be at least 1')
        .max(18, 'Hole handicap cannot exceed 18')
    )
    .length(18, 'Must have exactly 18 hole handicaps')
    .refine((arr) => new Set(arr).size === 18, {
      message: 'Hole handicaps must be unique values 1-18',
    }),
});

/**
 * Type inferred from the GhostGolferConfigSchema.
 */
export type GhostGolferConfig = z.infer<typeof GhostGolferConfigSchema>;

/**
 * Validate a configuration object against the GhostGolferConfigSchema.
 *
 * @param config - The configuration to validate
 * @returns The validated configuration
 * @throws ZodError if validation fails
 */
export function validateConfig(config: unknown): GhostGolferConfig {
  return GhostGolferConfigSchema.parse(config);
}
