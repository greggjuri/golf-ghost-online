# Golf Ghost Online - Architecture Decisions

## Decision Log

### DEC-001: Next.js 14 with App Router
**Date**: 2025-01-XX
**Status**: Decided
**Context**: Need a modern React framework for the web app
**Decision**: Use Next.js 14 with App Router
**Rationale**:
- Server Components reduce client bundle size
- API routes eliminate need for separate backend
- Excellent TypeScript support
- Easy deployment options

### DEC-002: DynamoDB for Course Persistence
**Date**: 2025-01-XX
**Status**: Decided
**Context**: Need database for storing course data (mirroring `/old/course_manager.py`)
**Decision**: Use AWS DynamoDB
**Rationale**:
- Consistent with existing AWS infrastructure on jurigregg.com
- Serverless, no server management needed
- Cost-effective for variable traffic
- Simple key-value patterns fit our course data model
- Can seed with data from `/old/golf_courses.json`

### DEC-003: Glass-morphism Design System
**Date**: 2025-01-XX
**Status**: Decided
**Context**: Need consistent styling that matches main landing page
**Decision**: Use glass-button and glass-card patterns from jurigregg.com, combined with colors from `/old/ui_theme.py`
**Rationale**:
- Visual consistency across domains
- Modern, appealing aesthetic
- Examples already available in `/examples` folder
- Dark theme already defined in Python app

### DEC-004: TypeScript Strict Mode
**Date**: 2025-01-XX
**Status**: Decided
**Context**: Need type safety for scoring calculations
**Decision**: Enable strict TypeScript mode
**Rationale**:
- Scoring formulas require precision; types prevent errors
- Better IDE support and refactoring
- Self-documenting code
- Catch bugs at compile time

### DEC-005: Zod for Runtime Validation
**Date**: 2025-01-XX
**Status**: Decided
**Context**: Need to validate API inputs at runtime
**Decision**: Use Zod for schema validation
**Rationale**:
- TypeScript inference from schemas
- Clear error messages
- Works seamlessly with Next.js API routes
- Popular, well-maintained library

### DEC-006: Context Engineering Workflow
**Date**: 2025-01-XX
**Status**: Decided
**Context**: Need structured approach for AI-assisted development
**Decision**: Use context engineering with INITIAL files and PRPs
**Rationale**:
- Proven effective from previous project
- Clear separation of planning (Claude.ai) and implementation (Claude Code)
- Comprehensive context leads to better code generation
- Built-in validation and testing requirements

### DEC-007: Direct Port of Python Scoring Algorithm
**Date**: 2025-01-XX
**Status**: Decided
**Context**: Need to implement score generation in TypeScript
**Decision**: Port `/old/ghost_golfer.py` algorithm exactly, not create a new one
**Rationale**:
- Algorithm already tested and produces realistic results
- Gaussian distribution parameters (Ïƒ=1.1, Ïƒ=1.2) are tuned
- Difficulty factors (+0.3, -0.2) feel right
- Score bounds (par-1 to par+6) are reasonable
- Avoids introducing bugs by reimplementing from scratch

### DEC-008: Score Color Scheme from Python App
**Date**: 2025-01-XX
**Status**: Decided
**Context**: Need visual feedback for score quality (eagle, birdie, par, etc.)
**Decision**: Use exact colors from `/old/ui_theme.py`
**Rationale**:
- Colors are already chosen and work well together
- Intuitive: green=good, red=bad, gray=neutral
- Consistent with golf conventions
- Already tested in the Tkinter UI

### DEC-009: 18-Hole Data Structure
**Date**: 2025-01-XX
**Status**: Decided
**Context**: How to structure course and score data
**Decision**: Use arrays of 18 values for par, handicaps, yardages, scores
**Rationale**:
- Matches `/old/golf_courses.json` structure
- Simple iteration for generation
- Easy validation (length === 18)
- Direct index mapping: `holes[i]` for hole i+1

### DEC-010: S3 + CloudFront Static Hosting
**Date**: 2025-01-XX
**Status**: Decided
**Context**: How to host the Next.js frontend
**Decision**: Use Next.js static export to S3, served via CloudFront
**Rationale**:
- Matches existing infrastructure (other projects use S3)
- No server management needed
- CloudFront provides SSL and CDN
- Cost-effective (pay per request)
- Easy deployment (sync to S3)
**Alternatives Considered**:
- EC2: More complex, overkill for static site
- Vercel: Would require separate account/billing
- Amplify: More abstraction than needed

### DEC-011: API Gateway + Lambda for Backend
**Date**: 2025-01-XX
**Status**: Decided
**Context**: How to implement API endpoints
**Decision**: Use API Gateway with Lambda functions instead of Next.js API routes
**Rationale**:
- Matches existing infrastructure pattern
- Serverless, scales automatically
- Can share DynamoDB with other projects
- Lambda cold starts acceptable for this use case
- Scoring logic can be shared between frontend and Lambda
**Consequences**:
- Need to configure CORS on API Gateway
- Separate deployment for Lambda vs frontend
- API client needed in frontend code

### DEC-013: INITIAL and PRP File Naming Convention
**Date**: 2025-01-XX
**Status**: Decided
**Context**: Need consistent naming for spec files across INITIAL/ and PRPs/ folders
**Decision**: Use prefixed, sequential numbering for both:
- INITIAL files: `initial-{NN}-{feature-name}.md` (e.g., `initial-10-lambda-api.md`)
- PRP files: `prp-{NN}-{feature-name}.md` (e.g., `prp-10-lambda-api.md`)
**Rationale**:
- Clear file type identification even when referenced outside folders
- Easy to search across project (`initial-*` or `prp-*`)
- Symmetry between the two folders
- Sequential numbering independent of TASK.md task numbers (INITIALs may consolidate multiple tasks)
**Notes**:
- Numbering continues sequentially (last was 09, next is 10)
- Task numbers in TASK.md remain separate (for tracking granular work items)

---

## Pending Decisions

### DEC-010: User Authentication
**Status**: Pending
**Question**: Should users need accounts to use the app?
**Options**:
1. Anonymous usage only - simplest MVP âœ“ (leaning this way)
2. Optional accounts for saving rounds
3. Required accounts

**Notes**: For MVP, anonymous usage. Can add accounts later if needed.

### DEC-011: Course Database Scope
**Status**: Pending
**Question**: What courses to include in MVP?
**Options**:
1. Manual entry only - user provides all course data
2. Seed with Baytree courses from `golf_courses.json` âœ“ (leaning this way)
3. Full searchable database of many courses

**Notes**: Start with Baytree courses as examples, allow custom entry.

### DEC-012: Round History
**Status**: Pending
**Question**: Should generated rounds be saved?
**Options**:
1. No persistence - generate and display only âœ“ (for MVP)
2. Session storage - save during session
3. DynamoDB - persist long-term

**Notes**: MVP doesn't need this. Can add later with user accounts.

---

## Template for New Decisions

```markdown
### DEC-XXX: [Title]
**Date**: YYYY-MM-DD
**Status**: Proposed | Decided | Deprecated
**Context**: [Why is this decision needed?]
**Decision**: [What was decided?]
**Rationale**: [Why this choice?]
**Alternatives Considered**: [What else was evaluated?]
**Consequences**: [What are the implications?]
```
