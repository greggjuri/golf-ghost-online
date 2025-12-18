import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { createCourse } from '../shared/db.js';
import { CourseSchema } from '../shared/types.js';
import { created, error } from '../shared/response.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');

    // Validate course data
    const courseData = CourseSchema.parse(body);

    // Create in DynamoDB
    const course = await createCourse(courseData);

    return created(course);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error(400, `Validation error: ${err.message}`);
    }
    console.error('Create course error:', err);
    return error(500, 'Internal server error');
  }
};
