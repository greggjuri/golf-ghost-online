/**
 * API client for Golf Ghost Online
 * Connects to Lambda backend via API Gateway
 */

import {
  CourseRecord,
  CourseInput,
  GenerateScoreRequest,
  GenerateScoreResponse,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Handle API response and parse JSON
 * Throws error for non-OK responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Generate a golf round via the Lambda API
 */
export async function generateScore(
  config: GenerateScoreRequest
): Promise<GenerateScoreResponse> {
  const response = await fetch(`${API_URL}/generate-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  return handleResponse<GenerateScoreResponse>(response);
}

/**
 * Get all courses from DynamoDB via API
 */
export async function getCourses(): Promise<CourseRecord[]> {
  const response = await fetch(`${API_URL}/courses`);
  return handleResponse<CourseRecord[]>(response);
}

/**
 * Create a new course in DynamoDB via API
 */
export async function createCourse(course: CourseInput): Promise<CourseRecord> {
  const response = await fetch(`${API_URL}/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(course),
  });
  return handleResponse<CourseRecord>(response);
}

/**
 * Delete a course from DynamoDB via API
 */
export async function deleteCourse(courseId: string): Promise<void> {
  const response = await fetch(`${API_URL}/courses/${courseId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
}
