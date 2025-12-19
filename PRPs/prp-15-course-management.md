# PRP: Course Management Feature

## Overview
Add full course management capabilities (add/edit/delete) to Golf Ghost Online, matching the functionality of the original Python app's `manage_tab.py`. This includes a new Lambda endpoint for updating courses, a dedicated management page with course list and editor UI, and navigation integration.

## Context Files Read
- [x] CLAUDE.md
- [x] docs/PLANNING.md
- [x] docs/DECISIONS.md
- [x] docs/TASK.md
- [x] old/manage_tab.py - Python UI reference
- [x] old/course_manager.py - Python CRUD logic
- [x] lambda/shared/types.ts - CourseSchema validation
- [x] lambda/shared/db.ts - DynamoDB operations
- [x] lambda/create-course/index.ts - POST handler reference
- [x] src/lib/api/client.ts - existing API client
- [x] src/lib/api/types.ts - existing API types
- [x] src/components/GlassCard.tsx - styling reference
- [x] src/components/GlassButton.tsx - button styling reference
- [x] src/components/CourseSelector.tsx - course fetching pattern
- [x] src/app/page.tsx - current page structure
- [x] src/app/layout.tsx - layout structure
- [x] scripts/deploy-lambdas.sh - Lambda deployment
- [x] scripts/setup-api-gateway.sh - API Gateway setup

## Requirements

### 1. Backend: Add Update Course Lambda
- New endpoint: `PUT /courses/{id}`
- Lambda handler: `lambda/update-course/index.ts`
- Validates courseId exists, validates input via CourseSchema, updates record
- Updates `updatedAt` timestamp

### 2. Frontend: API Client Update
- Add `updateCourse(courseId, course)` function to `src/lib/api/client.ts`

### 3. Frontend: Course Management Page
- New route: `/manage`
- Two-panel layout:
  - **Left panel**: CourseList - displays saved courses, click to select
  - **Right panel**: CourseEditor - form for creating/editing courses

### 4. CourseEditor Component
- Header fields: Course Name, Tee Name, Course Rating, Slope Rating
- 18-hole grid with Par, Yardage, Handicap for each hole
- Action buttons: SAVE (green), DELETE (red), CLEAR (gray)
- Validation matching CourseSchema

### 5. Navigation
- Add link to manage page from header (consistent with existing layout)

## Technical Approach

### Backend Architecture
The existing Lambda pattern uses esbuild bundling with ESM format. The update-course Lambda will:
1. Parse courseId from path parameters
2. Verify course exists via `getCourseById()`
3. Validate request body with Zod CourseSchema
4. Call new `updateCourse()` function in db.ts
5. Return updated CourseRecord

### Frontend Architecture
The manage page will be a client component using:
- `useState` for form state and selected course
- `useEffect` for initial course fetch
- Existing API client functions
- Glass-morphism styling consistent with existing components

### Validation Rules (from CourseSchema)
- Name: 1-100 characters
- Tee name: 1-50 characters
- Course rating: 60-80
- Slope rating: 55-155 (integer)
- Par values: 18 integers, each 3-5
- Hole handicaps: 18 unique integers 1-18
- Yardages: 18 integers, each 50-700

## Implementation Steps

### Step 1: Add Update Course Database Function
**Files**: `lambda/shared/db.ts`
**Actions**:
1. Add `updateCourse(courseId: string, input: CourseInput): Promise<CourseRecord | null>` function
2. Check if course exists first
3. Use DynamoDB `PutCommand` with updated data
4. Preserve `createdAt`, update `updatedAt`
**Validation**: Unit test the function locally

### Step 2: Create Update Course Lambda Handler
**Files**: `lambda/update-course/index.ts` (new)
**Actions**:
1. Create new directory `lambda/update-course/`
2. Implement handler following `create-course/index.ts` pattern
3. Extract courseId from `event.pathParameters.id`
4. Return 404 if course not found
5. Validate body with CourseSchema
6. Call `updateCourse()` from db.ts
7. Return updated course
**Validation**: Test with curl after deployment

### Step 3: Update Deployment Scripts
**Files**:
- `scripts/deploy-lambdas.sh`
- `scripts/setup-api-gateway.sh`
**Actions**:
1. Add `golf-ghost-update-course:update-course/index.ts` to FUNCTIONS array
2. Add `create_route "golf-ghost-update-course" "PUT" "/courses/{id}"`
3. Update CORS to include PUT method
**Validation**: Run deployment scripts successfully

### Step 4: Update Frontend API Client
**Files**:
- `src/lib/api/client.ts`
- `src/lib/api/types.ts`
- `src/lib/api/index.ts`
**Actions**:
1. Add `updateCourse(courseId: string, course: CourseInput): Promise<CourseRecord>` function
2. Export from index.ts
**Validation**: TypeScript compiles without errors

### Step 5: Create CourseList Component
**Files**: `src/components/manage/CourseList.tsx` (new)
**Actions**:
1. Create `src/components/manage/` directory
2. Props: `courses`, `selectedId`, `onSelect`, `isLoading`
3. Display scrollable list of course names
4. Highlight selected course with accent color
5. Use GlassCard styling
6. Show loading state while fetching
**Validation**: Component renders correctly in isolation

### Step 6: Create CourseEditor Component
**Files**: `src/components/manage/CourseEditor.tsx` (new)
**Actions**:
1. Props: `course` (optional - null for new), `onSave`, `onDelete`, `isSaving`
2. Form state for all course fields
3. Header section: Course Name, Tee Name, Course Rating, Slope Rating
4. 18-hole grid with divider after hole 9
5. Each hole row: Hole #, Par (3-5), Yardage (50-700), Handicap (1-18)
6. Client-side validation with error display
7. Action buttons using GlassButton variants:
   - SAVE: primary (green gradient)
   - DELETE: danger (red gradient) - only shown when editing
   - CLEAR: secondary (blue gradient)
8. Delete confirmation dialog
**Validation**: Form validates correctly, buttons work

### Step 7: Create GlassButton Danger Variant
**Files**: `src/components/GlassButton.tsx`
**Actions**:
1. Add 'danger' to variant type
2. Add red gradient styles for danger variant
**Validation**: Visual inspection of danger button

### Step 8: Create Manage Page
**Files**: `src/app/manage/page.tsx` (new)
**Actions**:
1. Create `src/app/manage/` directory
2. Client component with useEffect for fetching courses
3. Two-column layout (responsive: stack on mobile)
4. Left: CourseList component (1/3 width on desktop)
5. Right: CourseEditor component (2/3 width on desktop)
6. State: `courses`, `selectedCourse`, `isLoading`, `isSaving`, `error`
7. Handlers: `handleSelectCourse`, `handleSave`, `handleDelete`, `handleClear`
8. Refetch courses after save/delete
9. Success/error feedback messages
**Validation**: Full CRUD workflow works

### Step 9: Add Navigation Header
**Files**: `src/app/page.tsx`, `src/app/manage/page.tsx`
**Actions**:
1. Create shared header component or modify existing header in page.tsx
2. Add navigation links: "Generate" (active on home), "Manage" (active on /manage)
3. Use glass styling for nav links
4. Both pages use consistent header
**Validation**: Navigation works between pages

### Step 10: Mobile Responsiveness
**Files**: `src/components/manage/CourseList.tsx`, `src/components/manage/CourseEditor.tsx`, `src/app/manage/page.tsx`
**Actions**:
1. Stack panels vertically on mobile (lg:grid-cols-12)
2. CourseList becomes horizontal scrollable or collapsible on mobile
3. Hole grid scrollable with fixed headers
4. Touch-friendly input sizing
**Validation**: Test on mobile viewport

### Step 11: Deploy and Test
**Files**: Various
**Actions**:
1. Run `npm run build` to verify no TypeScript errors
2. Run `npm run deploy:lambdas` to deploy update-course function
3. Run `scripts/setup-api-gateway.sh` to add PUT route
4. Run `npm run deploy` to deploy frontend
5. Test full flow on live site
**Validation**: All CRUD operations work on ghost.jurigregg.com

## Testing Requirements

### Unit Tests (Optional but Recommended)
- [ ] updateCourse db function returns updated record
- [ ] updateCourse db function returns null for non-existent course
- [ ] CourseEditor validation rejects invalid data
- [ ] CourseEditor validation accepts valid data

### Manual Testing
- [ ] Can view list of saved courses
- [ ] Clicking course loads data into editor
- [ ] Can create new course with all 18 holes
- [ ] Can edit existing course (name, tee, rating, holes)
- [ ] Can delete course with confirmation
- [ ] Clear button resets form to defaults
- [ ] Validation errors display correctly
- [ ] Changes persist after page refresh
- [ ] Changes reflect in CourseSelector on main page
- [ ] Navigation between Generate and Manage pages works
- [ ] Mobile layout is usable

## Validation Commands
```bash
# Build and check for TypeScript errors
npm run build

# Deploy Lambda functions
npm run deploy:lambdas

# Setup API Gateway (adds PUT route)
./scripts/setup-api-gateway.sh

# Test update endpoint
curl -X PUT https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/courses/COURSE_ID \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Course","teeName":"Blue","courseRating":72.0,"slopeRating":130,"parValues":[4,4,3,5,4,4,3,4,5,4,5,4,3,4,4,3,5,4],"holeHandicaps":[1,3,17,5,7,9,15,11,13,2,4,16,18,6,8,14,10,12],"yardages":[395,405,185,520,380,410,165,390,535,400,545,385,175,395,420,190,510,410]}'

# Deploy frontend
npm run deploy

# Verify live
open https://ghost.jurigregg.com/manage
```

## Success Criteria
- [ ] PUT /courses/{id} endpoint working and deployed
- [ ] Course management page accessible at /manage
- [ ] Can view list of saved courses
- [ ] Can create new course with full 18-hole data
- [ ] Can edit existing course (loads into form, saves changes)
- [ ] Can delete course (with confirmation dialog)
- [ ] Validation errors displayed clearly in UI
- [ ] Navigation between main page and manage page
- [ ] Changes persist and reflect in CourseSelector on main page
- [ ] Glass-morphism styling consistent with rest of app
- [ ] Mobile responsive layout

## File Summary

### New Files
| File | Description |
|------|-------------|
| `lambda/update-course/index.ts` | PUT /courses/{id} Lambda handler |
| `src/app/manage/page.tsx` | Course management page |
| `src/components/manage/CourseList.tsx` | Left panel course list |
| `src/components/manage/CourseEditor.tsx` | Right panel editor form |

### Modified Files
| File | Changes |
|------|---------|
| `lambda/shared/db.ts` | Add updateCourse() function |
| `src/lib/api/client.ts` | Add updateCourse() API call |
| `src/lib/api/index.ts` | Export updateCourse |
| `src/components/GlassButton.tsx` | Add danger variant |
| `src/app/page.tsx` | Add navigation header |
| `scripts/deploy-lambdas.sh` | Add update-course to FUNCTIONS |
| `scripts/setup-api-gateway.sh` | Add PUT route, update CORS |

## Confidence Score
**8/10** - High confidence

**Reasons for high confidence:**
- All patterns already established in codebase
- Create/delete Lambda handlers provide clear template
- Python reference code is comprehensive
- Existing styling components (GlassCard, GlassButton) reduce UI work
- API client pattern is straightforward

**Areas of uncertainty:**
- Mobile responsiveness for 18-hole grid may need iteration
- Form state management could get complex (might benefit from useReducer)
- Delete confirmation modal not yet styled/implemented

## Notes
- The Python manage_tab.py uses a scrollable canvas for the editor - consider if the grid needs virtualization for performance
- Default values when clearing: par 4 for all holes, sequential handicaps 1-18, 400 yard defaults
- Hole handicaps must be unique 1-18 - this validation is in the Zod schema
- Consider debouncing save operations to prevent double-submits
- The existing CourseSelector will automatically pick up new/edited courses via API fetch
