import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { getCourseById, updateCourse } from '../shared/db.js';
import { CourseSchema } from '../shared/types.js';
import { success, error } from '../shared/response.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Extract courseId from path parameters
    const courseId = event.pathParameters?.id;
    if (!courseId) {
      return error(400, 'Course ID is required');
    }

    // Check if course exists
    const existing = await getCourseById(courseId);
    if (!existing) {
      return error(404, 'Course not found');
    }

    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const courseData = CourseSchema.parse(body);

    // Update in DynamoDB
    const course = await updateCourse(courseId, courseData);
    if (!course) {
      return error(500, 'Failed to update course');
    }

    return success(course);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error(400, `Validation error: ${err.message}`);
    }
    console.error('Update course error:', err);
    return error(500, 'Internal server error');
  }
};
