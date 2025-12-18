/**
 * API types for Golf Ghost Online
 * Types that match the Lambda API responses
 */

import { GeneratedRound } from '@/types';

/**
 * Course record from DynamoDB via API
 */
export interface CourseRecord {
  courseId: string;
  name: string;
  teeName: string;
  courseRating: number;
  slopeRating: number;
  parValues: number[];
  holeHandicaps: number[];
  yardages: number[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating a new course
 */
export interface CourseInput {
  name: string;
  teeName: string;
  courseRating: number;
  slopeRating: number;
  parValues: number[];
  holeHandicaps: number[];
  yardages: number[];
}

/**
 * Request body for score generation
 */
export interface GenerateScoreRequest {
  handicapIndex: number;
  courseRating: number;
  slopeRating: number;
  parValues: number[];
  holeHandicaps: number[];
}

/**
 * API error response
 */
export interface ApiError {
  error: string;
}

/**
 * Response type for score generation (matches GeneratedRound)
 */
export type GenerateScoreResponse = GeneratedRound;
