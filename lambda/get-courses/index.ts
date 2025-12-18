import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAllCourses } from '../shared/db.js';
import { success, error } from '../shared/response.js';

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const courses = await getAllCourses();
    return success(courses);
  } catch (err) {
    console.error('Get courses error:', err);
    return error(500, 'Internal server error');
  }
};
