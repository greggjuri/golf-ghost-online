import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'golf-ghost-courses';

// Baytree course data (from src/lib/courses/presets.ts)
// Note: Hole 8 is par 5 (471/424 yards)
const SEED_COURSES = [
  {
    name: 'Baytree National Golf Links',
    teeName: 'Blue',
    courseRating: 69.7,
    slopeRating: 126,
    parValues: [4, 3, 4, 3, 5, 4, 4, 5, 4, 4, 4, 3, 5, 4, 4, 5, 3, 4],
    holeHandicaps: [3, 17, 15, 7, 9, 11, 1, 13, 5, 4, 14, 18, 8, 12, 6, 10, 16, 2],
    yardages: [349, 154, 308, 177, 488, 313, 365, 471, 352, 354, 313, 142, 520, 320, 374, 478, 148, 338],
  },
  {
    name: 'Baytree National Golf Links',
    teeName: 'White',
    courseRating: 66.9,
    slopeRating: 113,
    parValues: [4, 3, 4, 3, 5, 4, 4, 5, 4, 4, 4, 3, 5, 4, 4, 5, 3, 4],
    holeHandicaps: [3, 17, 15, 7, 9, 11, 1, 13, 5, 4, 14, 18, 8, 12, 6, 10, 16, 2],
    yardages: [286, 126, 277, 124, 458, 274, 349, 424, 326, 282, 274, 128, 427, 293, 335, 429, 119, 311],
  },
];

async function checkExistingCourses(): Promise<number> {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    Select: 'COUNT',
  }));
  return result.Count || 0;
}

async function seedCourses() {
  console.log('Golf Ghost - DynamoDB Course Seeder\n');
  console.log(`Table: ${TABLE_NAME}`);
  console.log(`Region: us-east-1\n`);

  // Check for existing courses
  const existingCount = await checkExistingCourses();
  if (existingCount > 0) {
    console.log(`Warning: Table already has ${existingCount} course(s).`);
    console.log('   To re-seed, delete existing courses first.\n');
    console.log('Skipping seed to avoid duplicates.');
    return;
  }

  console.log('Seeding courses...\n');

  for (const course of SEED_COURSES) {
    const now = new Date().toISOString();
    const item = {
      courseId: uuidv4(),
      ...course,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }));

    console.log(`Added: ${course.name} (${course.teeName})`);
    console.log(`  courseId: ${item.courseId}`);
    console.log(`  rating: ${course.courseRating} / slope: ${course.slopeRating}`);
    console.log(`  total par: ${course.parValues.reduce((a, b) => a + b, 0)}\n`);
  }

  console.log('Seeding complete! Added 2 courses.');
}

seedCourses().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
