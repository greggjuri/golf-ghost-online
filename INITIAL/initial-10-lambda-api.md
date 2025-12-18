# INITIAL-10: Lambda API Layer

## Overview
Set up AWS Lambda functions for the Golf Ghost API backend. This covers the complete Lambda layer including project structure, shared code, all handlers, and DynamoDB integration.

**Consolidates TASK.md items:** 13-lambda-setup, 14-generate-lambda, 15-courses-lambda

## Context

### Current State
- Next.js 14 static export app working at `localhost:3000`
- Scoring engine complete in `src/lib/scoring/` with 62 passing tests
- UI complete and functional (client-side only)
- No backend API yet - scoring runs entirely in browser

### Target State
- Lambda functions deployed to AWS
- API endpoints: `POST /generate-score`, `GET /courses`, `POST /courses`, `DELETE /courses/{id}`
- Scoring logic shared between frontend and Lambda
- DynamoDB integration for course persistence

### Key Decision
Per **DEC-011**: Use API Gateway + Lambda (not Next.js API routes) to match existing AWS infrastructure.

## Requirements

### 1. Lambda Directory Structure

```
lambda/
├── package.json              # Shared dependencies (uuid, zod, @aws-sdk/client-dynamodb)
├── tsconfig.json             # TypeScript config for Lambda
├── shared/
│   ├── scoring/              # COPY of src/lib/scoring (not symlink)
│   │   ├── index.ts
│   │   ├── gaussian.ts
│   │   ├── handicap.ts
│   │   ├── generator.ts
│   │   └── validation.ts
│   ├── db.ts                 # DynamoDB client and operations
│   ├── response.ts           # Standard API response helpers
│   └── types.ts              # Shared types (Course, etc.)
├── generate-score/
│   └── index.ts              # POST /generate-score handler
├── get-courses/
│   └── index.ts              # GET /courses handler
├── create-course/
│   └── index.ts              # POST /courses handler
└── delete-course/
    └── index.ts              # DELETE /courses/{id} handler
```

### 2. Shared Code Strategy

**Why copy instead of symlink?**
- Lambda deployment packages must be self-contained
- Symlinks don't work in ZIP uploads
- Keeps Lambda independent of frontend build

**Sync script** (optional, for development):
```bash
# scripts/sync-scoring.sh
cp -r src/lib/scoring/* lambda/shared/scoring/
```

### 3. Package Configuration

**lambda/package.json:**
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
    "@aws-sdk/client-dynamodb": "^3.x",
    "@aws-sdk/lib-dynamodb": "^3.x",
    "uuid": "^9.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.x",
    "@types/node": "^20.x",
    "@types/uuid": "^9.x",
    "typescript": "^5.x"
  }
}
```

**lambda/tsconfig.json:**
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

### 4. DynamoDB Schema

**Table:** `golf-ghost-courses`
**Primary Key:** `courseId` (String)

```typescript
interface CourseRecord {
  courseId: string;           // UUID
  name: string;               // "Baytree National - Blue"
  teeName: string;            // "Blue Tees"
  courseRating: number;       // 69.7
  slopeRating: number;        // 126
  parValues: number[];        // [4, 3, 4, ...] (18 values)
  holeHandicaps: number[];    // [3, 17, 15, ...] (18 values)
  yardages: number[];         // [349, 154, ...] (18 values)
  createdAt: string;          // ISO timestamp
  updatedAt: string;          // ISO timestamp
}
```

### 5. Shared Modules

**lambda/shared/db.ts:**
```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.COURSES_TABLE || 'golf-ghost-courses';

export async function getAllCourses(): Promise<CourseRecord[]> { ... }
export async function getCourseById(courseId: string): Promise<CourseRecord | null> { ... }
export async function createCourse(course: Omit<CourseRecord, 'courseId' | 'createdAt' | 'updatedAt'>): Promise<CourseRecord> { ... }
export async function deleteCourse(courseId: string): Promise<boolean> { ... }
```

**lambda/shared/response.ts:**
```typescript
import { APIGatewayProxyResult } from 'aws-lambda';

export function success(body: unknown): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(body),
  };
}

export function error(statusCode: number, message: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ error: message }),
  };
}
```

### 6. Lambda Handlers

**lambda/generate-score/index.ts:**
```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { GhostGolfer } from '../shared/scoring';
import { validateConfig } from '../shared/scoring/validation';
import { success, error } from '../shared/response';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    
    // Validate input
    const config = validateConfig(body);
    
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

**lambda/get-courses/index.ts:**
```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { getAllCourses } from '../shared/db';
import { success, error } from '../shared/response';

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

**lambda/create-course/index.ts:**
```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { createCourse } from '../shared/db';
import { CourseSchema } from '../shared/types';
import { success, error } from '../shared/response';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    
    // Validate course data
    const courseData = CourseSchema.parse(body);
    
    // Create in DynamoDB
    const course = await createCourse(courseData);
    
    return success(course);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error(400, `Validation error: ${err.message}`);
    }
    console.error('Create course error:', err);
    return error(500, 'Internal server error');
  }
};
```

**lambda/delete-course/index.ts:**
```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { deleteCourse } from '../shared/db';
import { success, error } from '../shared/response';

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

### 7. Validation Schema for Courses

**lambda/shared/types.ts:**
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

## API Endpoints Summary

| Endpoint | Method | Request Body | Response |
|----------|--------|--------------|----------|
| `/generate-score` | POST | `GhostGolferConfig` | `GeneratedRound` |
| `/courses` | GET | - | `CourseRecord[]` |
| `/courses` | POST | `CourseInput` | `CourseRecord` |
| `/courses/{id}` | DELETE | - | `{ deleted: true, courseId }` |

## Environment Variables

Lambda functions will need:
- `COURSES_TABLE` - DynamoDB table name (default: `golf-ghost-courses`)

## Testing Approach

1. **Unit tests** for shared modules (db.ts, response.ts)
2. **Local testing** with AWS SAM CLI or direct invocation
3. **Integration tests** after deployment

## Out of Scope (Future Tasks)

- DynamoDB table creation (task 16)
- Seeding course data (task 17)
- API Gateway configuration (task 20)
- Lambda deployment (task 22)
- Frontend API client (task 23)

## Success Criteria

- [ ] `lambda/` directory structure created
- [ ] Scoring code copied to `lambda/shared/scoring/`
- [ ] All four Lambda handlers implemented
- [ ] DynamoDB client module with CRUD operations
- [ ] Response helpers with CORS headers
- [ ] Zod validation for course input
- [ ] TypeScript compiles without errors (`npm run build` in lambda/)
- [ ] Package.json has all required dependencies

## Notes

- CORS headers included in all responses (required for browser fetch)
- Using `@aws-sdk/lib-dynamodb` for simpler DynamoDB operations (auto-marshalling)
- Error handling returns appropriate HTTP status codes
- Scoring engine is identical to frontend version (same algorithm)
