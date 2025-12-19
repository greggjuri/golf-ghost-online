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
import { getAccessToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Get auth headers for protected API calls
 * Returns empty object if not authenticated
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const token = await getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

/**
 * Handle API response and parse JSON
 * Throws error for non-OK responses
 * Special handling for 401 Unauthorized
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    }
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Generate a golf round via the Lambda API
 * Public endpoint - no auth required
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
 * Public endpoint - no auth required
 */
export async function getCourses(): Promise<CourseRecord[]> {
  const response = await fetch(`${API_URL}/courses`);
  return handleResponse<CourseRecord[]>(response);
}

/**
 * Create a new course in DynamoDB via API
 * Protected endpoint - requires auth
 */
export async function createCourse(course: CourseInput): Promise<CourseRecord> {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API_URL}/courses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(course),
  });
  return handleResponse<CourseRecord>(response);
}

/**
 * Update an existing course in DynamoDB via API
 * Protected endpoint - requires auth
 */
export async function updateCourse(
  courseId: string,
  course: CourseInput
): Promise<CourseRecord> {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API_URL}/courses/${courseId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(course),
  });
  return handleResponse<CourseRecord>(response);
}

/**
 * Delete a course from DynamoDB via API
 * Protected endpoint - requires auth
 */
export async function deleteCourse(courseId: string): Promise<void> {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API_URL}/courses/${courseId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    }
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
}
