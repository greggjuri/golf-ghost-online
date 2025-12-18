# PRP-10: Lambda API Layer

## Overview
Implement AWS Lambda functions for the Golf Ghost API backend. This covers the complete Lambda layer including project structure, shared code (copied scoring engine), all handlers, and DynamoDB integration.

**Source**: `INITIAL/initial-10-lambda-api.md`
**Consolidates TASK.md items**: 13-lambda-setup, 14-generate-lambda, 15-courses-lambda

## Prerequisites
- [x] Scoring engine complete in `src/lib/scoring/` (62 passing tests)
- [x] UI complete and functional (client-side only)
- [x] TypeScript types defined in `src/types/`

## Implementation Steps

### Step 1: Create Lambda Directory Structure
Create the foundational directory structure for Lambda functions.

**Create directories:**
```
lambda/
├── shared/
│   └── scoring/
├── generate-score/
├── get-courses/
├── create-course/
└── delete-course/
```

**Commands:**
```bash
mkdir -p lambda/shared/scoring lambda/generate-score lambda/get-courses lambda/create-course lambda/delete-course
```

### Step 2: Create Lambda package.json
Create `lambda/package.json` with all required dependencies.

**File: `lambda/package.json`**
```json
{
  "name": "golf-ghost-lambda",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.700.0",
    "@aws-sdk/lib-dynamodb": "^3.700.0",
    "uuid": "^11.0.3",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.147",
    "@types/node": "^20.17.10",
    "@types/uuid": "^10.0.0",
    "typescript": "^5.7.2"
  }
}
```

### Step 3: Create Lambda tsconfig.json
Create `lambda/tsconfig.json` for TypeScript compilation.

**File: `lambda/tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "resolveJsonModule": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 4: Copy Scoring Code to Lambda
Copy the scoring engine files from `src/lib/scoring/` to `lambda/shared/scoring/`. Files must be modified to remove path aliases (`@/`) since Lambda doesn't use Next.js path resolution.

**Source files to copy:**
- `src/lib/scoring/gaussian.ts` → `lambda/shared/scoring/gaussian.ts` (no changes needed)
- `src/lib/scoring/handicap.ts` → `lambda/shared/scoring/handicap.ts` (no changes needed)
- `src/lib/scoring/validation.ts` → `lambda/shared/scoring/validation.ts` (no changes needed)
- `src/lib/scoring/generator.ts` → `lambda/shared/scoring/generator.ts` (modify imports)
- `src/lib/scoring/index.ts` → `lambda/shared/scoring/index.ts` (no changes needed)

**Modifications for `lambda/shared/scoring/generator.ts`:**
- Change `import { HoleScore, GeneratedRound } from '@/types';` to use local types
- Add inline type definitions (from `src/types/index.ts`)

**File: `lambda/shared/scoring/generator.ts`** (modified)
```typescript
import { v4 as uuidv4 } from 'uuid';
import { gaussianRandom } from './gaussian.js';
import { calculateCourseHandicap, calculateStrokesReceived } from './handicap.js';
import { GhostGolferConfig, validateConfig } from './validation.js';

// Types (from src/types/index.ts)
export interface HoleScore {
  hole: number;
  par: number;
  grossScore: number;
  strokesReceived: number;
  netScore: number;
}

export interface GeneratedRound {
  id: string;
  scores: HoleScore[];
  courseHandicap: number;
  totalGross: number;
  totalNet: number;
  totalPar: number;
  createdAt: Date;
}

// ... rest of GhostGolfer class unchanged
```

**Note:** Add `.js` extensions to imports for ESM compatibility in Node.js.

### Step 5: Create Shared Types Module
Create `lambda/shared/types.ts` with Zod schema for course validation.

**File: `lambda/shared/types.ts`**
```typescript
import { z } from 'zod';

export const CourseSchema = z.object({
  name: z.string().min(1).max(100),
  teeName: z.string().min(1).max(50),
  courseRating: z.number().min(60).max(80),
  slopeRating: z.number().int().min(55).max(155),
  parValues: z.array(z.number().int().min(3).max(5)).length(18),
  holeHandicaps: z.array(z.number().int().min(1).max(18)).length(18)
    .refine(arr => new Set(arr).size === 18, 'Hole handicaps must be unique 1-18'),
  yardages: z.array(z.number().int().min(50).max(700)).length(18),
});

export type CourseInput = z.infer<typeof CourseSchema>;

export interface CourseRecord extends CourseInput {
  courseId: string;
  createdAt: string;
  updatedAt: string;
}
```

### Step 6: Create Response Helpers
Create `lambda/shared/response.ts` with standardized API response helpers including CORS headers.

**File: `lambda/shared/response.ts`**
```typescript
import { APIGatewayProxyResult } from 'aws-lambda';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

export function success(body: unknown): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

export function created(body: unknown): APIGatewayProxyResult {
  return {
    statusCode: 201,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

export function error(statusCode: number, message: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: message }),
  };
}
```

### Step 7: Create DynamoDB Client Module
Create `lambda/shared/db.ts` with DynamoDB operations for courses.

**File: `lambda/shared/db.ts`**
```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { CourseRecord, CourseInput } from './types.js';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.COURSES_TABLE || 'golf-ghost-courses';

export async function getAllCourses(): Promise<CourseRecord[]> {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
  }));
  return (result.Items || []) as CourseRecord[];
}

export async function getCourseById(courseId: string): Promise<CourseRecord | null> {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { courseId },
  }));
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

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: course,
  }));

  return course;
}

export async function deleteCourse(courseId: string): Promise<boolean> {
  // Check if course exists first
  const existing = await getCourseById(courseId);
  if (!existing) {
    return false;
  }

  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { courseId },
  }));

  return true;
}
```

### Step 8: Create Generate Score Lambda Handler
Create `lambda/generate-score/index.ts` for the POST /generate-score endpoint.

**File: `lambda/generate-score/index.ts`**
```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { GhostGolfer } from '../shared/scoring/generator.js';
import { GhostGolferConfigSchema } from '../shared/scoring/validation.js';
import { success, error } from '../shared/response.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');

    // Validate input using the existing config schema
    const config = GhostGolferConfigSchema.parse(body);

    // Generate round
    const golfer = new GhostGolfer(config);
    const round = golfer.generateRound();

    return success(round);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error(400, `Validation error: ${err.message}`);
    }
    console.error('Generate score error:', err);
    return error(500, 'Internal server error');
  }
};
```

### Step 9: Create Get Courses Lambda Handler
Create `lambda/get-courses/index.ts` for the GET /courses endpoint.

**File: `lambda/get-courses/index.ts`**
```typescript
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
```

### Step 10: Create Create Course Lambda Handler
Create `lambda/create-course/index.ts` for the POST /courses endpoint.

**File: `lambda/create-course/index.ts`**
```typescript
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
```

### Step 11: Create Delete Course Lambda Handler
Create `lambda/delete-course/index.ts` for the DELETE /courses/{id} endpoint.

**File: `lambda/delete-course/index.ts`**
```typescript
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
```

### Step 12: Create Sync Script
Create `scripts/sync-scoring.sh` to copy scoring code from frontend to Lambda.

**File: `scripts/sync-scoring.sh`**
```bash
#!/bin/bash
# Sync scoring code from src/lib/scoring to lambda/shared/scoring
# Run this whenever scoring logic changes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

SRC_DIR="$PROJECT_ROOT/src/lib/scoring"
DEST_DIR="$PROJECT_ROOT/lambda/shared/scoring"

echo "Syncing scoring code..."
echo "  From: $SRC_DIR"
echo "  To:   $DEST_DIR"

# Copy files
cp "$SRC_DIR/gaussian.ts" "$DEST_DIR/gaussian.ts"
cp "$SRC_DIR/handicap.ts" "$DEST_DIR/handicap.ts"
cp "$SRC_DIR/validation.ts" "$DEST_DIR/validation.ts"
cp "$SRC_DIR/index.ts" "$DEST_DIR/index.ts"

# generator.ts needs special handling (different imports)
echo "Note: generator.ts has Lambda-specific imports. Update manually if algorithm changes."

echo "Done! Files synced to lambda/shared/scoring/"
echo "Remember to add .js extensions to imports for ESM compatibility."
```

### Step 13: Install Dependencies and Build
Install npm dependencies and verify TypeScript compiles.

**Commands:**
```bash
cd lambda
npm install
npm run build
```

### Step 14: Final Verification
Verify the implementation is complete and compiles.

**Checklist:**
- [ ] `lambda/` directory structure matches specification
- [ ] Scoring code in `lambda/shared/scoring/` with ESM imports
- [ ] All four Lambda handlers implemented
- [ ] DynamoDB client module with CRUD operations
- [ ] Response helpers with CORS headers
- [ ] Zod validation for course input
- [ ] TypeScript compiles without errors (`npm run build` in lambda/)
- [ ] `package.json` has all required dependencies

## API Endpoints Summary

| Endpoint | Method | Request Body | Response |
|----------|--------|--------------|----------|
| `/generate-score` | POST | `GhostGolferConfig` | `GeneratedRound` |
| `/courses` | GET | - | `CourseRecord[]` |
| `/courses` | POST | `CourseInput` | `CourseRecord` |
| `/courses/{id}` | DELETE | - | `{ deleted: true, courseId }` |

## Environment Variables

Lambda functions require:
- `COURSES_TABLE` - DynamoDB table name (default: `golf-ghost-courses`)

## Files Created

```
lambda/
├── package.json
├── tsconfig.json
├── shared/
│   ├── scoring/
│   │   ├── index.ts
│   │   ├── gaussian.ts
│   │   ├── handicap.ts
│   │   ├── generator.ts
│   │   └── validation.ts
│   ├── db.ts
│   ├── response.ts
│   └── types.ts
├── generate-score/
│   └── index.ts
├── get-courses/
│   └── index.ts
├── create-course/
│   └── index.ts
└── delete-course/
    └── index.ts
scripts/
└── sync-scoring.sh
```

## Out of Scope (Future Tasks)

- DynamoDB table creation (task 16)
- Seeding course data (task 17)
- API Gateway configuration (task 20)
- Lambda deployment (task 22)
- Frontend API client (task 23)

## Notes

- CORS headers included in all responses (required for browser fetch)
- Using `@aws-sdk/lib-dynamodb` for simpler DynamoDB operations (auto-marshalling)
- Error handling returns appropriate HTTP status codes
- Scoring engine is identical to frontend version (same algorithm)
- ESM (ES Modules) requires `.js` extensions in imports even for TypeScript files
