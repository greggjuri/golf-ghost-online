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

### Phase 4: Lambda Functions
- [ ] **13-lambda-setup** - Lambda project structure with shared scoring code
- [ ] **14-generate-lambda** - `generate-score` Lambda function
- [ ] **15-courses-lambda** - Course CRUD Lambda functions
- [ ] **16-dynamodb-table** - Create/configure DynamoDB table for courses
- [ ] **17-seed-courses** - Seed Baytree courses from `golf_courses.json`

### Phase 5: AWS Infrastructure
- [ ] **18-s3-bucket** - Create S3 bucket for static hosting
- [ ] **19-cloudfront** - CloudFront distribution with SSL certificate
- [ ] **20-api-gateway** - API Gateway configuration with CORS
- [ ] **21-route53** - DNS setup for ghost.jurigregg.com subdomain
- [ ] **22-deploy-lambdas** - Deploy Lambda functions

### Phase 6: Integration & Deploy
- [ ] **23-api-client** - Frontend API client for Lambda endpoints
- [ ] **24-full-flow** - Connect form → Lambda API → display
- [ ] **25-build-deploy** - Build static site and deploy to S3
- [ ] **26-verify-live** - Verify ghost.jurigregg.com works

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
