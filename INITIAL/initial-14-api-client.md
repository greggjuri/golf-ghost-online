# INITIAL-14: Frontend API Client & Integration

## Overview
Create the frontend API client to connect the UI to the Lambda backend, replacing the current client-side-only scoring with API calls.

**Consolidates TASK.md items:** 23-api-client, 24-full-flow

## Context

### Current State
- UI works but uses client-side scoring (`GhostGolfer` imported directly)
- Lambda API deployed and working at `https://ueb9yaco2m.execute-api.us-east-1.amazonaws.com/prod`
- Courses hardcoded in `src/lib/courses/presets.ts`

### Target State
- UI calls Lambda API for score generation
- Courses loaded from DynamoDB via API
- Environment variable for API URL (works in dev and prod)

### API Endpoints
```
POST /generate-score     → Generate a round
GET  /courses           → List all courses
POST /courses           → Create course (future use)
DELETE /courses/{id}    → Delete course (future use)
```

## Requirements

### 1. Environment Configuration

Create `.env.local` for development:
```
NEXT_PUBLIC_API_URL=https://ueb9yaco2m.execute-api.us-east-1.amazonaws.com/prod
```

Add to `.env.example`:
```
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com/prod
```

### 2. API Client Module

Create `src/lib/api/client.ts`:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface ApiError {
  error: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function generateScore(config: {
  handicapIndex: number;
  courseRating: number;
  slopeRating: number;
  parValues: number[];
  holeHandicaps: number[];
}): Promise<GeneratedRound> {
  const response = await fetch(`${API_URL}/generate-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  return handleResponse<GeneratedRound>(response);
}

export async function getCourses(): Promise<CourseRecord[]> {
  const response = await fetch(`${API_URL}/courses`);
  return handleResponse<CourseRecord[]>(response);
}

export async function createCourse(course: CourseInput): Promise<CourseRecord> {
  const response = await fetch(`${API_URL}/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(course),
  });
  return handleResponse<CourseRecord>(response);
}

export async function deleteCourse(courseId: string): Promise<void> {
  const response = await fetch(`${API_URL}/courses/${courseId}`, {
    method: 'DELETE',
  });
  return handleResponse<void>(response);
}
```

### 3. API Types

Create `src/lib/api/types.ts` (or add to existing types):

```typescript
// Course from DynamoDB
export interface CourseRecord {
  courseId: string;
  name: string;
  teeName: string;
  courseRating: number;
  slopeRating: number;
  parValues: number[];
  holeHandicaps: number[];
  yardages: number[];
  createdAt: string;
  updatedAt: string;
}

// For creating new courses
export interface CourseInput {
  name: string;
  teeName: string;
  courseRating: number;
  slopeRating: number;
  parValues: number[];
  holeHandicaps: number[];
  yardages: number[];
}
```

### 4. Update useScoreGeneration Hook

Modify `src/hooks/useScoreGeneration.ts` to use API:

```typescript
import { generateScore as apiGenerateScore } from '@/lib/api/client';

// Change from:
// const golfer = new GhostGolfer(config);
// const round = golfer.generateRound();

// To:
// const round = await apiGenerateScore(config);
```

The hook should:
- Make async API call instead of sync client-side generation
- Handle loading state during API call
- Handle errors from API

### 5. Update CourseSelector Component

Modify `src/components/CourseSelector.tsx` to:
- Fetch courses from API on mount
- Fall back to preset courses if API fails
- Show loading state while fetching

```typescript
const [courses, setCourses] = useState<CourseRecord[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  getCourses()
    .then(setCourses)
    .catch(() => {
      // Fall back to presets if API fails
      setCourses(PRESET_COURSES.map(p => ({
        ...p,
        courseId: p.id,
        createdAt: '',
        updatedAt: '',
      })));
    })
    .finally(() => setLoading(false));
}, []);
```

### 6. Barrel Export

Create `src/lib/api/index.ts`:

```typescript
export * from './client';
export * from './types';
```

## File Structure

```
src/lib/api/
├── index.ts       # Barrel export
├── client.ts      # API functions
└── types.ts       # API-specific types

.env.local         # Local dev environment
.env.example       # Template for env vars
```

## Migration Strategy

1. **Keep presets as fallback** — if API fails, use local presets
2. **Gradual migration** — API client works alongside existing code
3. **No breaking changes** — UI continues to work during transition

## Testing

After implementation:
1. Run `npm run dev`
2. Open http://localhost:3000
3. Select a course (should load from API)
4. Enter handicap
5. Click Generate (should call API)
6. Verify scorecard displays

Test API directly:
```bash
# Get courses
curl https://ueb9yaco2m.execute-api.us-east-1.amazonaws.com/prod/courses

# Generate score
curl -X POST https://ueb9yaco2m.execute-api.us-east-1.amazonaws.com/prod/generate-score \
  -H "Content-Type: application/json" \
  -d '{"handicapIndex":15,"courseRating":69.7,"slopeRating":126,"parValues":[4,3,4,3,5,4,4,5,4,4,4,3,5,4,4,5,3,4],"holeHandicaps":[3,17,15,7,9,11,1,13,5,4,14,18,8,12,6,10,16,2]}'
```

## Success Criteria

- [ ] `.env.local` created with API URL
- [ ] `.env.example` created as template
- [ ] API client module created at `src/lib/api/`
- [ ] `generateScore()` calls POST /generate-score
- [ ] `getCourses()` calls GET /courses
- [ ] `useScoreGeneration` hook uses API instead of direct import
- [ ] `CourseSelector` fetches courses from API
- [ ] Fallback to presets if API unavailable
- [ ] Error handling for API failures
- [ ] App works end-to-end (form → API → scorecard)

## Notes

- `NEXT_PUBLIC_` prefix required for client-side env vars in Next.js
- API URL includes `/prod` stage
- CORS already configured on API Gateway for localhost:3000
- Keep preset courses as fallback for offline/API failure scenarios
