# PRP: Frontend API Client & Integration

## Overview
Create a frontend API client to connect the UI to the Lambda backend, replacing the current client-side-only scoring with API calls. This enables the app to fetch courses from DynamoDB and use server-side score generation.

## Context Files Read
- [x] CLAUDE.md
- [x] docs/PLANNING.md
- [x] docs/DECISIONS.md
- [x] docs/TASK.md
- [x] INITIAL/initial-14-api-client.md
- [x] src/hooks/useScoreGeneration.ts (current implementation)
- [x] src/components/CourseSelector.tsx (current implementation)
- [x] src/types/index.ts (existing types)
- [x] src/lib/courses/presets.ts (fallback data)

## Requirements
From INITIAL-14:
1. Environment configuration (`.env.local`, `.env.example`)
2. API client module (`src/lib/api/client.ts`)
3. API types (`src/lib/api/types.ts`)
4. Update `useScoreGeneration` hook to use API
5. Update `CourseSelector` to fetch courses from API
6. Barrel export for API module
7. Fallback to presets if API fails

## Technical Approach

### API Endpoint
The Lambda API is deployed at:
```
https://ueb9yaco2m.execute-api.us-east-1.amazonaws.com/prod
```

### Key Integration Points
1. **Score Generation**: Replace `GhostGolfer` class usage with API call
2. **Course Loading**: Fetch courses from `/courses` endpoint instead of hardcoded presets
3. **Error Handling**: Graceful fallback to client-side generation and preset courses
4. **Type Alignment**: API types must align with both frontend and Lambda expectations

### Type Mapping
The API returns `CourseRecord` which differs slightly from `PresetCourse`:
- `CourseRecord.courseId` → `PresetCourse.id`
- Additional fields: `createdAt`, `updatedAt`

We need a conversion function to map between these types.

## Implementation Steps

### Step 1: Create Environment Configuration
**Files**: `.env.local`, `.env.example`
**Actions**:
1. Create `.env.local` with actual API URL
2. Create `.env.example` as template
3. Add `.env.local` to `.gitignore` (if not already)

**Validation**: Files exist, `.env.local` not tracked by git

### Step 2: Create API Types
**Files**: `src/lib/api/types.ts`
**Actions**:
1. Define `CourseRecord` interface (from DynamoDB)
2. Define `CourseInput` interface (for create)
3. Define `GenerateScoreRequest` interface
4. Export type for API error responses

**Validation**: Types compile without errors

### Step 3: Create API Client Module
**Files**: `src/lib/api/client.ts`
**Actions**:
1. Create `handleResponse<T>()` utility for error handling
2. Implement `generateScore()` - POST /generate-score
3. Implement `getCourses()` - GET /courses
4. Implement `createCourse()` - POST /courses
5. Implement `deleteCourse()` - DELETE /courses/{id}
6. Use `NEXT_PUBLIC_API_URL` environment variable

**Validation**: No TypeScript errors, functions are exported

### Step 4: Create Barrel Export
**Files**: `src/lib/api/index.ts`
**Actions**:
1. Re-export all from `./client`
2. Re-export all from `./types`

**Validation**: Can import `{ getCourses, CourseRecord }` from `@/lib/api`

### Step 5: Create Type Conversion Utilities
**Files**: `src/lib/api/converters.ts`
**Actions**:
1. Create `courseRecordToPreset()` to convert API response to PresetCourse format
2. Create `presetToCourseInput()` if needed for creating courses
3. Handle the `id` vs `courseId` mapping

**Validation**: Conversion functions work correctly with test data

### Step 6: Update useScoreGeneration Hook
**Files**: `src/hooks/useScoreGeneration.ts`
**Actions**:
1. Import `generateScore` from `@/lib/api`
2. Change `generate()` to be async
3. Replace `GhostGolfer` instantiation with API call
4. Handle API errors gracefully
5. Keep loading state during async call
6. Add error state for UI feedback

**Validation**: Hook works with API, error handling works

### Step 7: Update CourseSelector Component
**Files**: `src/components/CourseSelector.tsx`
**Actions**:
1. Add `useState` for courses from API
2. Add `useEffect` to fetch courses on mount
3. Import `getCourses` from `@/lib/api`
4. Convert `CourseRecord[]` to `PresetCourse[]` format
5. Fall back to `PRESET_COURSES` if API fails
6. Add loading state while fetching

**Validation**: Component loads courses from API, fallback works

### Step 8: Update presets.ts for Compatibility
**Files**: `src/lib/courses/presets.ts`
**Actions**:
1. Ensure `PresetCourse` interface is compatible with API data
2. Add utility to convert `CourseRecord` to `PresetCourse`
3. Keep `PRESET_COURSES` as fallback data

**Validation**: Types are compatible, conversions work

### Step 9: Test End-to-End Flow
**Files**: None (manual testing)
**Actions**:
1. Start dev server (`npm run dev`)
2. Verify courses load from API
3. Select a course
4. Enter handicap
5. Generate score (calls API)
6. Verify scorecard displays correctly

**Validation**: Full flow works without errors

## Testing Requirements
- [ ] API client functions compile without errors
- [ ] Environment variables are properly typed
- [ ] getCourses() fetches from API successfully
- [ ] generateScore() posts to API successfully
- [ ] Error handling works (API down → fallback)
- [ ] Loading states display correctly
- [ ] Scorecard displays generated data correctly
- [ ] Existing unit tests still pass (62 tests)

## Validation Commands
```bash
# Verify environment
cat .env.local

# Run type checking
npm run lint

# Run tests
npm test

# Test API directly
curl https://ueb9yaco2m.execute-api.us-east-1.amazonaws.com/prod/courses

curl -X POST https://ueb9yaco2m.execute-api.us-east-1.amazonaws.com/prod/generate-score \
  -H "Content-Type: application/json" \
  -d '{"handicapIndex":15,"courseRating":69.7,"slopeRating":126,"parValues":[4,3,4,3,5,4,4,5,4,4,4,3,5,4,4,5,3,4],"holeHandicaps":[3,17,15,7,9,11,1,13,5,4,14,18,8,12,6,10,16,2]}'

# Start dev server and test
npm run dev
```

## Success Criteria
- [ ] `.env.local` created with API URL
- [ ] `.env.example` created as template
- [ ] API client module at `src/lib/api/`
- [ ] `generateScore()` calls POST /generate-score
- [ ] `getCourses()` calls GET /courses
- [ ] `useScoreGeneration` hook uses API
- [ ] `CourseSelector` fetches courses from API
- [ ] Fallback to presets if API unavailable
- [ ] Error handling for API failures
- [ ] App works end-to-end (form → API → scorecard)
- [ ] All existing tests pass

## Confidence Score
**9/10** - High confidence because:
- INITIAL file provides complete code examples
- API is already deployed and tested
- Existing types align well with API schema
- Clear integration points identified
- Fallback strategy prevents breaking changes

Small deduction for:
- Type conversion between `CourseRecord` and `PresetCourse` needs careful handling
- Need to ensure async hook updates work correctly with React state

## Notes
- `NEXT_PUBLIC_` prefix required for client-side env vars in Next.js
- API URL includes `/prod` stage path
- CORS is already configured on API Gateway for localhost:3000
- Keep preset courses as fallback for offline/API failure scenarios
- The scoring engine remains in the frontend codebase for potential offline use
- API returns dates as ISO strings, not Date objects
