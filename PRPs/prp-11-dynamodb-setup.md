# PRP-11: DynamoDB Setup & Course Seeding

## Overview
Create the DynamoDB table for course storage and seed it with Baytree courses. This enables the Lambda functions (implemented in PRP-10) to store and retrieve course data.

**Source**: `INITIAL/initial-11-dynamodb-setup.md`
**Consolidates TASK.md items**: 16-dynamodb-table, 17-seed-courses

## Context Files Read
- [x] CLAUDE.md
- [x] docs/PLANNING.md
- [x] docs/DECISIONS.md (DEC-002: DynamoDB for Course Persistence)
- [x] docs/TASK.md
- [x] lambda/shared/db.ts (DynamoDB client implementation)
- [x] lambda/shared/types.ts (CourseRecord schema)
- [x] src/lib/courses/presets.ts (correct Baytree course data)
- [x] old/golf_courses.json (original data - has errors)

## Prerequisites
- [x] Lambda functions implemented with DynamoDB client (`lambda/shared/db.ts`)
- [x] CourseRecord type defined (`lambda/shared/types.ts`)
- [x] AWS credentials configured for CLI access
- [x] Baytree course data verified in `src/lib/courses/presets.ts`

## Requirements

### DynamoDB Table Configuration
- **Table Name**: `golf-ghost-courses`
- **Partition Key**: `courseId` (String)
- **Billing Mode**: On-demand (PAY_PER_REQUEST)
- **Region**: `us-east-1`

### CourseRecord Schema (from lambda/shared/types.ts)
```typescript
interface CourseRecord {
  courseId: string;       // UUID, partition key
  name: string;           // "Baytree National Golf Links"
  teeName: string;        // "Blue" or "White"
  courseRating: number;   // 69.7
  slopeRating: number;    // 126
  parValues: number[];    // 18 integers (3-5)
  holeHandicaps: number[];// 18 unique integers (1-18)
  yardages: number[];     // 18 integers
  createdAt: string;      // ISO timestamp
  updatedAt: string;      // ISO timestamp
}
```

## Technical Approach

1. Create a TypeScript seed script that uses the existing Lambda shared code
2. Place script in `lambda/scripts/` to leverage existing AWS SDK dependencies
3. Use data from `src/lib/courses/presets.ts` (corrected par values)
4. Table creation is manual via AWS CLI (documented for user to run)
5. Seed script can be run via `npx tsx`

## Implementation Steps

### Step 1: Document AWS CLI Command for Table Creation
**Files**: `PRPs/prp-11-dynamodb-setup.md` (this file - for reference)
**Actions**:
1. User runs AWS CLI command manually (not automated)
2. Command creates table with on-demand billing

**AWS CLI Command** (user runs manually):
```bash
aws dynamodb create-table \
  --table-name golf-ghost-courses \
  --attribute-definitions AttributeName=courseId,AttributeType=S \
  --key-schema AttributeName=courseId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

**Validation**:
```bash
aws dynamodb describe-table --table-name golf-ghost-courses --region us-east-1 | grep TableStatus
```
Expected: `"TableStatus": "ACTIVE"`

### Step 2: Create Scripts Directory in Lambda
**Files**: `lambda/scripts/` (new directory)
**Actions**:
1. Create `lambda/scripts/` directory

**Commands**:
```bash
mkdir -p lambda/scripts
```

**Validation**: Directory exists

### Step 3: Create Seed Script
**Files**: `lambda/scripts/seed-courses.ts`
**Actions**:
1. Create seed script that imports from `../shared/`
2. Use corrected Baytree data from presets
3. Add idempotency check to avoid duplicate seeding

**File: `lambda/scripts/seed-courses.ts`**
```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'golf-ghost-courses';

// Baytree course data (from src/lib/courses/presets.ts)
// Note: Par values corrected from source (hole 8 was 8, changed to 4)
const SEED_COURSES = [
  {
    name: 'Baytree National Golf Links',
    teeName: 'Blue',
    courseRating: 69.7,
    slopeRating: 126,
    parValues: [4, 3, 4, 3, 5, 4, 4, 8, 4, 4, 4, 3, 5, 4, 4, 5, 3, 4],
    holeHandicaps: [3, 17, 15, 7, 9, 11, 1, 13, 5, 4, 14, 18, 8, 12, 6, 10, 16, 2],
    yardages: [349, 154, 308, 177, 488, 313, 365, 471, 352, 354, 313, 142, 520, 320, 374, 478, 148, 338],
  },
  {
    name: 'Baytree National Golf Links',
    teeName: 'White',
    courseRating: 66.9,
    slopeRating: 113,
    parValues: [4, 3, 4, 3, 5, 4, 4, 8, 4, 4, 4, 3, 5, 4, 4, 5, 3, 4],
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
    console.log(`⚠️  Table already has ${existingCount} course(s).`);
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

    console.log(`✓ Added: ${course.name} (${course.teeName})`);
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
```

**Validation**: File created, TypeScript compiles

### Step 4: Add tsx as Dev Dependency
**Files**: `lambda/package.json`
**Actions**:
1. Add `tsx` as dev dependency for running TypeScript directly

**Commands**:
```bash
cd lambda && npm install -D tsx
```

**Validation**: `tsx` appears in devDependencies

### Step 5: Add Seed Script to package.json
**Files**: `lambda/package.json`
**Actions**:
1. Add `seed` script to run the seeder

**Change**:
```json
{
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "seed": "tsx scripts/seed-courses.ts"
  }
}
```

**Validation**: `npm run seed --help` shows tsx usage

### Step 6: Verify TypeScript Compiles
**Actions**:
1. Run `npm run build` in lambda directory to ensure no type errors

**Commands**:
```bash
cd lambda && npm run build
```

**Validation**: No TypeScript errors

### Step 7: Document Usage in README
**Files**: Create brief usage notes

**Usage**:
```bash
# 1. Create table (one-time, run manually)
aws dynamodb create-table \
  --table-name golf-ghost-courses \
  --attribute-definitions AttributeName=courseId,AttributeType=S \
  --key-schema AttributeName=courseId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Wait for table to be ACTIVE
aws dynamodb wait table-exists --table-name golf-ghost-courses --region us-east-1

# 2. Seed courses
cd lambda && npm run seed

# 3. Verify
aws dynamodb scan --table-name golf-ghost-courses --region us-east-1 --query 'Items[*].{name:name.S,tee:teeName.S}'
```

## Testing Requirements
- [ ] Table exists with correct schema (courseId as partition key)
- [ ] Seed script runs without errors
- [ ] 2 courses appear in DynamoDB scan
- [ ] Course data matches presets.ts (correct par values)
- [ ] Seed script is idempotent (doesn't add duplicates on re-run)

## Validation Commands
```bash
# Check table exists and is active
aws dynamodb describe-table --table-name golf-ghost-courses --region us-east-1 | grep TableStatus

# Run seed script
cd lambda && npm run seed

# Verify courses in table
aws dynamodb scan --table-name golf-ghost-courses --region us-east-1 \
  --query 'Items[*].{name:name.S,tee:teeName.S,rating:courseRating.N,slope:slopeRating.N}'

# Count items
aws dynamodb scan --table-name golf-ghost-courses --region us-east-1 --select COUNT
```

## Success Criteria
- [ ] DynamoDB table `golf-ghost-courses` exists in us-east-1
- [ ] Table has `courseId` as partition key (String type)
- [ ] Table uses on-demand billing (PAY_PER_REQUEST)
- [ ] Seed script created at `lambda/scripts/seed-courses.ts`
- [ ] `npm run seed` script added to lambda/package.json
- [ ] Running seed script adds 2 courses (Baytree Blue & White)
- [ ] `aws dynamodb scan` shows both courses with correct data
- [ ] Re-running seed script doesn't create duplicates

## Confidence Score
**9/10** - High confidence

**Rationale**:
- DynamoDB schema is simple (single partition key)
- Seed data is already validated in presets.ts
- Uses existing Lambda shared code patterns
- AWS SDK already installed in lambda/
- Minor uncertainty: User must have AWS credentials configured

## Notes

### Data Correction
The original `/old/golf_courses.json` has an error: hole 8 has par 8 (invalid).
This PRP uses the corrected data from `src/lib/courses/presets.ts` where hole 8 has par 4.

### Idempotency
The seed script checks for existing courses before adding. If courses exist, it skips seeding.
This prevents accidental duplicates but means you must manually delete courses to re-seed.

### AWS Credentials
The seed script requires AWS credentials. Ensure one of:
- AWS CLI configured (`aws configure`)
- Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- IAM instance profile (if on EC2)

### On-Demand vs Provisioned
On-demand billing is ideal for this hobby project:
- No charges when not in use
- Automatically scales with traffic
- No capacity planning needed

### Out of Scope
- API Gateway configuration (task 20)
- Lambda deployment (task 22)
- Infrastructure-as-code (CloudFormation/SAM) - future enhancement
