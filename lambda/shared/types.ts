import { z } from 'zod';

export const CourseSchema = z.object({
  name: z.string().min(1).max(100),
  teeName: z.string().min(1).max(50),
  courseRating: z.number().min(60).max(80),
  slopeRating: z.number().int().min(55).max(155),
  parValues: z.array(z.number().int().min(3).max(5)).length(18),
  holeHandicaps: z
    .array(z.number().int().min(1).max(18))
    .length(18)
    .refine((arr) => new Set(arr).size === 18, 'Hole handicaps must be unique 1-18'),
  yardages: z.array(z.number().int().min(50).max(700)).length(18),
});

export type CourseInput = z.infer<typeof CourseSchema>;

export interface CourseRecord extends CourseInput {
  courseId: string;
  createdAt: string;
  updatedAt: string;
}
