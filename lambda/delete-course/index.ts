import { APIGatewayProxyHandler } from 'aws-lambda';
import { deleteCourse } from '../shared/db.js';
import { success, error } from '../shared/response.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const courseId = event.pathParameters?.id;

    if (!courseId) {
      return error(400, 'Course ID required');
    }

    const deleted = await deleteCourse(courseId);

    if (!deleted) {
      return error(404, 'Course not found');
    }

    return success({ deleted: true, courseId });
  } catch (err) {
    console.error('Delete course error:', err);
    return error(500, 'Internal server error');
  }
};
