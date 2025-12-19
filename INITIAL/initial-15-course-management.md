# INITIAL-15: Course Management Feature

## Overview
Add full course management capabilities (add/edit/delete) to Golf Ghost Online, matching the functionality of the original Python app's `manage_tab.py`.

**Consolidates new tasks**: 27-update-lambda, 28-manage-page, 29-course-editor-ui

## Current State
- **Lambda endpoints exist**: GET /courses, POST /courses, DELETE /courses/{id}
- **Missing**: PUT /courses/{id} for editing
- **No UI** for course management - only a CourseSelector dropdown for selecting existing courses
- Site is live at ghost.jurigregg.com

## Target State
- Complete CRUD operations for courses via API
- Dedicated course management page (matching Python app's manage_tab.py)
- Users can add new courses, edit existing ones, and delete courses

---

## Requirements

### 1. Backend: Add Update Course Lambda

**New endpoint**: `PUT /courses/{id}`

**Lambda handler**: `lambda/update-course/index.ts`

```typescript
// Request body: CourseInput (same as create, from lambda/shared/types.ts)
// Response: Updated CourseRecord
// Validates courseId exists, validates input via CourseSchema, updates record
```

**API Gateway**: Add route `PUT /courses/{id}` → update-course Lambda

### 2. Frontend: API Client Update

**File**: `src/lib/api/client.ts`

Add function:
```typescript
export async function updateCourse(courseId: string, course: CourseInput): Promise<CourseRecord>
```

### 3. Frontend: Course Management Page

**New route**: `/manage`

**Components needed**:

#### CourseList (left panel)
- Displays all courses from API (uses existing `getCourses()`)
- Click to load course into editor
- Visual indicator for selected course
- Glass-card styling

#### CourseEditor (right panel)
- **Header fields**:
  - Course Name (text input)
  - Tee Name (text input or dropdown: Blue/White/Red/Gold)
  - Course Rating (number, 60-80)
  - Slope Rating (number, 55-155)
  
- **Hole-by-hole grid** (18 rows):
  | Hole | Par | Yardage | Handicap |
  |------|-----|---------|----------|
  | 1    | [3-5] | [50-700] | [1-18] |
  | ...  | ... | ...     | ...      |
  | 18   | ... | ...     | ...      |

- **Action buttons**:
  - SAVE (green) - creates new or updates existing
  - DELETE (red) - deletes selected course (with confirmation)
  - CLEAR (gray) - resets form to defaults

#### Validation (matching existing CourseSchema in lambda/shared/types.ts)
- Name: 1-100 characters
- Tee name: 1-50 characters  
- Course rating: 60-80
- Slope rating: 55-155 (integer)
- Par values: 18 integers, each 3-5
- Hole handicaps: 18 unique integers 1-18
- Yardages: 18 integers, each 50-700

### 4. Navigation

Add link to manage page from header (consistent with existing layout).

---

## UI Design Reference (from Python old/manage_tab.py)

```
┌─────────────────────────────────────────────────────────────────┐
│  GOLF GHOST ONLINE                              [Generate] [Manage]
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌─────────────────────────────────────┐  │
│  │ 💾 SAVED COURSES │  │ ✏️ COURSE EDITOR                    │  │
│  │                  │  │                                      │  │
│  │ ▸ Baytree Blue   │  │ Course Name: [________________]     │  │
│  │   Baytree White  │  │ Tee Name:    [Blue     ▼]          │  │
│  │                  │  │ Rating:      [69.7]  Slope: [126]   │  │
│  │                  │  │                                      │  │
│  │                  │  │ ───────────────────────────────────  │  │
│  │                  │  │                                      │  │
│  │                  │  │ 🏌️ HOLE DETAILS                     │  │
│  │                  │  │                                      │  │
│  │                  │  │ Hole │ Par │ Yards │ HCP            │  │
│  │                  │  │ ─────┼─────┼───────┼─────           │  │
│  │                  │  │  1   │ [4] │ [395] │ [7]            │  │
│  │                  │  │  2   │ [4] │ [405] │ [3]            │  │
│  │                  │  │  ... │ ... │  ...  │ ...            │  │
│  │                  │  │  18  │ [4] │ [410] │ [12]           │  │
│  │                  │  │                                      │  │
│  │                  │  │ [SAVE]  [DELETE]  [CLEAR]           │  │
│  └──────────────────┘  └─────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

### New Files
- `lambda/update-course/index.ts` - PUT handler
- `src/app/manage/page.tsx` - manage page
- `src/components/CourseList.tsx` - saved courses list
- `src/components/CourseEditor.tsx` - editor form with hole grid

### Modified Files
- `src/lib/api/client.ts` - add updateCourse()
- `src/components/Header.tsx` or `src/app/layout.tsx` - add nav link
- `scripts/deploy-lambdas.sh` - add update-course deployment
- `scripts/setup-api-gateway.sh` - add PUT route

---

## Context Files to Read
- [x] CLAUDE.md
- [x] docs/PLANNING.md
- [x] docs/DECISIONS.md
- [x] docs/TASK.md
- [ ] old/manage_tab.py - Python UI reference
- [ ] old/course_manager.py - Python CRUD logic
- [ ] lambda/shared/types.ts - CourseSchema validation
- [ ] lambda/shared/db.ts - DynamoDB operations
- [ ] lambda/create-course/index.ts - POST handler (reference for PUT)
- [ ] src/lib/api/client.ts - existing API client
- [ ] src/components/GlassCard.tsx - styling reference
- [ ] src/components/GlassButton.tsx - button styling reference

---

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

---

## Out of Scope (Future)
- Bulk import courses from file
- Course search/filter
- Course templates
- Undo/redo in editor
