# Golf Ghost Online - Claude Code Rules

## Project Overview
Golf Ghost Online is a Next.js web app that generates realistic golf scores based on GHIN handicap index. Ported from a Python/Tkinter desktop app (`/old` folder), it uses USGA handicap formulas with statistical modeling to produce realistic round simulations.

**Live URL**: ghost.jurigregg.com
**Tech Stack**: Next.js 14, TypeScript, Tailwind CSS, DynamoDB
**Original App**: Python/Tkinter in `/old` folder

## Before Starting Any Task
1. Read `docs/PLANNING.md` for architecture context
2. Check `docs/TASK.md` for current work status
3. Review `docs/DECISIONS.md` for past architectural decisions
4. Check `/examples` folder for styling patterns (glass buttons, color scheme from jurigregg.com)
5. Reference `/old` folder for original Python implementation

## Code Standards

### TypeScript
- Strict mode enabled, no `any` types
- Use interfaces for all data structures
- Explicit return types on all functions
- Zod schemas for runtime validation

### Next.js Conventions
- App Router (not Pages Router)
- Server Components by default, 'use client' only when needed
- API routes in `app/api/` directory
- Environment variables prefixed with `NEXT_PUBLIC_` for client access

### File Organization
- Components: `src/components/` (PascalCase.tsx)
- Utilities: `src/lib/` (camelCase.ts)
- Types: `src/types/` (index.ts barrel exports)
- API routes: `src/app/api/[route]/route.ts`
- Scoring logic: `src/lib/scoring/` (CRITICAL - must match `/old/ghost_golfer.py`)

### Component Rules
- Max 200 lines per component file
- Extract hooks to `src/hooks/`
- Use Tailwind CSS only (no inline styles, no CSS modules)
- Follow glass-button styling from `/examples/` for buttons
- Dark theme with colors from `/old/ui_theme.py` and `/examples/`

### Scoring Algorithm (CRITICAL)
Reference `/old/ghost_golfer.py` for the exact algorithm:

**Course Handicap Formula:**
```
course_handicap = round((handicap_index * slope_rating) / 113)
```

**Stroke Allocation:**
- Holes ranked 1-18 by difficulty (hole_handicaps)
- If course_handicap >= hole_handicap: receive 1 stroke
- If course_handicap > 18: holes ranked 1 to (course_handicap - 18) get 2 strokes

**Score Generation:**
```
base_score = par + (course_handicap / 18)
round_adjustment = gaussian(mean=0, std=1.2)  # Round-level variance
hole_randomness = gaussian(mean=0, std=1.1)   # Per-hole variance

difficulty_factor:
  - Hard holes (handicap 1-6): +0.3
  - Easy holes (handicap 13-18): -0.2
  - Medium holes: 0

raw_score = base_score + (round_adjustment/18) + hole_randomness + difficulty_factor
final_score = clamp(raw_score, par-1, par+6)  # Eagle to triple+
net_score = gross_score - strokes_received
```

**All scoring calculations must:**
- Live in `src/lib/scoring/`
- Have comprehensive unit tests
- Match the Python implementation exactly
- Use proper TypeScript types

## Git Workflow
- Commit after each completed feature
- Push after each commit
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- No large commits - break into logical chunks

## Testing
- Unit tests for all scoring calculations
- Test against known handicap scenarios
- Integration tests for API routes
- Test file naming: `*.test.ts` or `*.spec.ts`
- Run `npm test` before committing

## AWS/Infrastructure
Existing AWS infrastructure includes EC2 (landing page), DynamoDB, API Gateway, Lambda, and S3.

**Golf Ghost deployment:**
- **Frontend**: S3 bucket + CloudFront CDN (static Next.js export)
- **API**: API Gateway + Lambda functions
- **Database**: DynamoDB table for courses
- **Domain**: ghost.jurigregg.com (Route53 subdomain)

**Key configurations:**
- Next.js must be configured for static export (`output: 'export'` in next.config.js)
- No `/app/api/` routes - all API via Lambda
- CORS must be configured on API Gateway
- Scoring logic shared between frontend (client-side preview) and Lambda (official generation)

## Custom Commands
- `/generate-prp INITIAL/[feature].md` - Generate implementation blueprint
- `/execute-prp PRPs/[feature].md` - Execute implementation

## Common Gotchas
- Always use `async/await`, never raw promises
- DynamoDB queries need proper error handling
- GHIN handicap index range: 0.0 to 54.0 (decimal precision matters)
- Course rating typically 67-77, slope rating 55-155 (113 is standard)
- Hole handicaps are 1-18 (not 0-17), lower = harder
- Par values are per-hole (typically 3, 4, or 5)
- Gaussian random needs proper seeding for reproducibility in tests

## Color Scheme (from `/old/ui_theme.py`)
```
bg_primary: #0f172a      (dark slate)
bg_secondary: #1e293b    (lighter slate)
accent_blue: #3b82f6     (electric blue)
accent_cyan: #06b6d4     (cyan)
accent_green: #10b981    (neon green)
text_primary: #f8fafc    (almost white)
text_muted: #64748b      (muted gray)

Score colors:
  eagle: #10b981 (green)
  birdie: #22d3ee (cyan)
  par: #64748b (gray)
  bogey: #f59e0b (orange)
  double: #f97316 (deep orange)
  triple+: #ef4444 (red)
```

## Data Structures (from `/old/golf_courses.json`)
```typescript
// Course data structure
interface CourseData {
  tee_name: string;           // "Blue", "White", etc.
  course_rating: number;      // e.g., 69.7
  slope_rating: number;       // e.g., 126
  par_values: number[];       // 18 values, e.g., [4, 3, 4, 3, 5, ...]
  hole_handicaps: number[];   // 18 values (1-18), e.g., [3, 17, 15, 7, ...]
  yardages: number[];         // 18 values, e.g., [349, 154, 308, ...]
}
```
