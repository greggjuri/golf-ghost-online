# INITIAL-11: DynamoDB Setup & Course Seeding

## Overview
Create the DynamoDB table for course storage and seed it with the Baytree courses. This enables the Lambda functions to store and retrieve course data.

**Consolidates TASK.md items:** 16-dynamodb-table, 17-seed-courses

## Context

### Current State
- Lambda functions implemented with DynamoDB client (`lambda/shared/db.ts`)
- Code expects table named `golf-ghost-courses` with `courseId` partition key
- Baytree course data exists in `src/lib/courses/presets.ts`
- No DynamoDB table exists yet

### Target State
- DynamoDB table `golf-ghost-courses` created and configured
- Table seeded with Baytree Blue and Baytree White courses
- Ready for Lambda functions to perform CRUD operations

## Requirements

### 1. DynamoDB Table Configuration

**Table Name:** `golf-ghost-courses`

**Schema:**
| Attribute | Type | Key |
|-----------|------|-----|
| `courseId` | String | Partition Key (PK) |

**Settings (for low-traffic hobby project):**
- Billing mode: On-demand (pay-per-request)
- No secondary indexes needed for MVP
- Default encryption at rest

### 2. Create Table via AWS CLI

```bash
aws dynamodb create-table \
  --table-name golf-ghost-courses \
  --attribute-definitions AttributeName=courseId,AttributeType=S \
  --key-schema AttributeName=courseId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

**Verify table creation:**
```bash
aws dynamodb describe-table --table-name golf-ghost-courses --region us-east-1
```

### 3. Seed Script

Create `scripts/seed-courses.ts` to populate the table with Baytree courses.

**File: `scripts/seed-courses.ts`**
```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'golf-ghost-courses';

// Baytree course data (from src/lib/courses/presets.ts)
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

async function seedCourses() {
  console.log('Seeding courses to DynamoDB...\n');

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

    console.log(`✓ Added: ${course.name} (${course.teeName})`);
    console.log(`  courseId: ${item.courseId}`);
  }

  console.log('\nSeeding complete!');
}

seedCourses().catch(console.error);
```

### 4. Package.json Script

Add a seed script to **root** `package.json`:

```json
{
  "scripts": {
    "seed": "npx tsx scripts/seed-courses.ts"
  }
}
```

Or use the lambda directory's setup:

```bash
cd lambda && npx tsx ../scripts/seed-courses.ts
```

### 5. Alternative: Seed Script Using Lambda Dependencies

Since `lambda/` already has AWS SDK installed, create the seed script there:

**File: `lambda/scripts/seed-courses.ts`**
```typescript
// Same content as above, but can run with:
// cd lambda && npx tsx scripts/seed-courses.ts
```

### 6. Verify Seeding

```bash
aws dynamodb scan --table-name golf-ghost-courses --region us-east-1
```

Expected output shows 2 items (Baytree Blue and White).

## Directory Structure After Implementation

```
scripts/
├── sync-scoring.sh      # (existing)
└── seed-courses.ts      # NEW - seeds DynamoDB
```

Or alternatively:

```
lambda/
├── scripts/
│   └── seed-courses.ts  # NEW - seeds DynamoDB
└── ... (existing files)
```

## Dependencies

The seed script needs:
- `@aws-sdk/client-dynamodb` (already in lambda/package.json)
- `@aws-sdk/lib-dynamodb` (already in lambda/package.json)
- `uuid` (already in lambda/package.json)
- `tsx` for running TypeScript directly (install globally or use npx)

**Install tsx if needed:**
```bash
npm install -D tsx
```

## AWS Credentials

The seed script requires AWS credentials configured. Options:
1. AWS CLI configured (`aws configure`)
2. Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
3. IAM role (if running on EC2/Lambda)

## Success Criteria

- [ ] DynamoDB table `golf-ghost-courses` exists
- [ ] Table has `courseId` as partition key
- [ ] Table uses on-demand billing
- [ ] Seed script created at `scripts/seed-courses.ts`
- [ ] Running seed script adds 2 courses (Baytree Blue & White)
- [ ] `aws dynamodb scan` shows both courses

## Manual Alternative

If you prefer AWS Console:

1. Go to DynamoDB → Create table
2. Table name: `golf-ghost-courses`
3. Partition key: `courseId` (String)
4. Settings: Default (on-demand)
5. Create table
6. Go to "Explore items" → Create item
7. Manually add each course (tedious but works)

## Notes

- On-demand billing means $0 for very low usage
- No need for provisioned capacity for a hobby project
- Table can be created in any region, but keep Lambda in same region
- Seed script is idempotent-ish (creates new UUIDs each run, so running twice = 4 courses)

## Out of Scope

- API Gateway configuration (task 20)
- Lambda deployment (task 22)
- CloudFormation/SAM template for infrastructure-as-code (future enhancement)
