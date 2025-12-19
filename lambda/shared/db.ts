import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { CourseRecord, CourseInput } from './types.js';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.COURSES_TABLE || 'golf-ghost-courses';

export async function getAllCourses(): Promise<CourseRecord[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
    })
  );
  return (result.Items || []) as CourseRecord[];
}

export async function getCourseById(courseId: string): Promise<CourseRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { courseId },
    })
  );
  return (result.Item as CourseRecord) || null;
}

export async function createCourse(input: CourseInput): Promise<CourseRecord> {
  const now = new Date().toISOString();
  const course: CourseRecord = {
    ...input,
    courseId: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: course,
    })
  );

  return course;
}

export async function updateCourse(
  courseId: string,
  input: CourseInput
): Promise<CourseRecord | null> {
  // Check if course exists first
  const existing = await getCourseById(courseId);
  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();
  const course: CourseRecord = {
    ...input,
    courseId,
    createdAt: existing.createdAt, // Preserve original creation time
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: course,
    })
  );

  return course;
}

export async function deleteCourse(courseId: string): Promise<boolean> {
  // Check if course exists first
  const existing = await getCourseById(courseId);
  if (!existing) {
    return false;
  }

  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { courseId },
    })
  );

  return true;
}
