# Golf Ghost Online - Task Tracker

## Current Phase
**Phase 1: Foundation**

## Active Task
`01-project-foundation` - Set up Next.js project with TypeScript, Tailwind, and context engineering structure

## Task Status

### Phase 1: Foundation
- [x] **00-context-engineering** - Set up CLAUDE.md, docs/, INITIAL/, PRPs/, commands
- [ ] **01-project-foundation** - Initialize Next.js 14 with TypeScript, Tailwind, project structure
- [ ] **02-glass-components** - Create GlassButton and GlassCard components from `/examples/`
- [ ] **03-layout-styling** - Root layout with dark theme, header like Python app

### Phase 2: Scoring Engine (CRITICAL)
- [ ] **04-scoring-types** - TypeScript interfaces matching Python data structures
- [ ] **05-gaussian-random** - Implement Gaussian random number generator
- [ ] **06-handicap-calc** - Port course handicap and stroke allocation logic
- [ ] **07-score-generator** - Port full GhostGolfer class from Python
- [ ] **08-scoring-tests** - Unit tests validating against Python implementation

### Phase 3: UI Components
- [ ] **09-score-form** - Input form for handicap, course rating, slope, par values
- [ ] **10-scorecard-display** - Scorecard table with color-coded scores (like Python UI)
- [ ] **11-stats-cards** - Gross score, net score, course handicap display cards
- [ ] **12-course-selector** - Dropdown for selecting saved courses

### Phase 4: API & Data
- [ ] **13-generate-api** - POST `/api/generate` endpoint for score generation
- [ ] **14-courses-api** - CRUD endpoints for courses
- [ ] **15-dynamodb-setup** - DynamoDB table and connection
- [ ] **16-seed-courses** - Seed Baytree courses from `golf_courses.json`

### Phase 5: Integration
- [ ] **17-full-flow** - Connect form → API → display
- [ ] **18-mobile-responsive** - Ensure mobile-friendly layout
- [ ] **19-error-handling** - User-friendly error messages

### Phase 6: Deployment
- [ ] **20-aws-config** - Configure AWS for ghost.jurigregg.com subdomain
- [ ] **21-env-setup** - Production environment variables
- [ ] **22-deploy** - Deploy to production
- [ ] **23-verify** - Verify live site works correctly

## Completed Tasks
- [x] **00-context-engineering** - Created foundational docs and commands

## Blockers
None currently

## Notes
- Python app source in `/old` folder - reference for ALL implementations
- Styling examples in `/examples` folder - reference for glass effects
- Scoring algorithm is CRITICAL - must match Python exactly
- Using context engineering workflow: Claude.ai plans, Claude Code implements
- Commit and push after every completed feature

## Quick Reference

### Key Files to Port
| Python File | TypeScript Location | Purpose |
|------------|---------------------|---------|
| `ghost_golfer.py` | `src/lib/scoring/generator.ts` | Core algorithm |
| `ui_theme.py` | `tailwind.config.ts` + `globals.css` | Colors |
| `golf_courses.json` | Seed data for DynamoDB | Sample courses |
| `course_manager.py` | `src/lib/db/courses.ts` | Course CRUD |

### Color Reference (from ui_theme.py)
- Background: `#0f172a` (primary), `#1e293b` (secondary/card)
- Accent: `#3b82f6` (blue), `#06b6d4` (cyan), `#10b981` (green)
- Text: `#f8fafc` (primary), `#64748b` (muted)
- Scores: green→cyan→gray→orange→deep orange→red
