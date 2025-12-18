# Handoff Guide: Claude.ai ↔ Claude Code Workflow

This document explains how to coordinate between Claude.ai (planning/architecture) and Claude Code (implementation) for Golf Ghost Online.

## The Split

| Claude.ai (this chat) | Claude Code |
|-----------------------|-------------|
| Architecture decisions | Write code |
| Feature planning | Execute PRPs |
| Generate INITIAL files | Run tests |
| Review PRPs before execution | Deploy infrastructure |
| Troubleshoot blockers | Git operations |
| Update PLANNING.md | Create files and directories |

## Workflow

### 1. Plan Here (Claude.ai)
- Discuss what you want to build
- I'll help define requirements
- We'll create/update INITIAL files together
- Review and refine before implementation

### 2. Generate PRP (Claude Code)
```bash
# In Claude Code, from project root:
/generate-prp INITIAL/feature-name.md
```
Claude Code will:
- Read all context files (CLAUDE.md, PLANNING.md, etc.)
- Research the codebase
- Generate a detailed PRP

### 3. Review PRP (Claude.ai)
- Bring the generated PRP back here if you want review
- We can refine requirements or approach
- Ensure nothing is missing before implementation

### 4. Execute PRP (Claude Code)
```bash
# In Claude Code:
/execute-prp PRPs/feature-name.md
```
Claude Code will:
- Implement step by step
- Validate each step
- Run tests
- Update TASK.md
- Commit and push changes

### 5. Handle Issues (Either)
- Simple bugs → Claude Code can fix
- Architecture questions → Bring back here
- Blockers → Discuss approach here, fix in Claude Code

## Key Files Both Must Read

**Claude Code reads these automatically:**
- `CLAUDE.md` - Project rules and conventions
- `docs/PLANNING.md` - Architecture overview
- `docs/TASK.md` - Current work status
- `docs/DECISIONS.md` - Past decisions

**Important References:**
- `/examples/` - Styling from jurigregg.com (glass buttons, colors)
- `/old/` - Original Python Golf Ghost app

## Keeping Things in Sync

### After Claude Code work:
1. Review what was created/changed
2. If architecture evolved, update PLANNING.md
3. If new decisions were made, add to DECISIONS.md
4. Mark tasks complete in TASK.md
5. **Commit and push**

### Before starting new features:
1. Check TASK.md for current state
2. Review PLANNING.md for context
3. Create INITIAL file with full requirements

## Project-Specific Notes

### Scoring Algorithm
The scoring algorithm is CRITICAL. It must:
- Match USGA handicap formulas exactly
- Be thoroughly tested
- Include statistical validation

When porting from Python (`/old/`), verify:
- Formula accuracy
- Decimal precision
- Edge case handling

### Styling Consistency
All UI must match jurigregg.com aesthetic:
- Reference `/examples/index.html` and `/examples/styles.css`
- Use glass-morphism effects
- Maintain color scheme
- Dark theme

### Git Workflow
Claude Code must:
- Commit after each feature
- Push after each commit
- Use conventional commits (`feat:`, `fix:`, etc.)

## Getting Started

Your first task:

```bash
# In Claude Code, from project root:
/generate-prp INITIAL/01-project-foundation.md
```

This will set up the Next.js foundation. Once complete:
1. Verify the setup works
2. Check styling matches examples
3. Return here to plan the scoring algorithm feature

## Task Progression

### Phase 1: Foundation
1. `01-project-foundation` - Next.js setup (READY TO START)
2. `02-glass-components` - Reusable UI components
3. `03-layout-styling` - Root layout and dark theme

### Phase 2: Scoring Engine (CRITICAL)
4. `04-scoring-types` - TypeScript interfaces
5. `05-gaussian-random` - Random number generator
6. `06-handicap-calc` - Course handicap logic
7. `07-score-generator` - Full GhostGolfer port
8. `08-scoring-tests` - Unit tests

### Phase 3: UI Components
9. `09-score-form` - User input form
10. `10-scorecard-display` - Score table with colors
11. `11-stats-cards` - Summary statistics
12. `12-course-selector` - Course dropdown

### Phase 4: API & Data
13. `13-generate-api` - Score generation endpoint
14. `14-courses-api` - Course CRUD
15. `15-dynamodb-setup` - Database setup
16. `16-seed-courses` - Import Baytree courses

### Phase 5: Integration & Deploy
17. `17-full-flow` - Connect everything
18. `18-mobile-responsive` - Mobile optimization
19. `19-error-handling` - User-friendly errors
20. `20-aws-config` - Subdomain setup
21. `21-deploy` - Go live!
