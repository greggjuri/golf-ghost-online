# Execute PRP Command

You are executing a PRP (Product Requirements Prompt) to implement a feature.

## Input
The PRP file to execute: $ARGUMENTS

## Process

### Step 1: Load Full Context
Read and internalize:
- The PRP file provided
- All context files listed in the PRP
- Any referenced examples or documentation

### Step 2: Create Implementation Plan
Using your TodoWrite capability:
- Break down each PRP step into atomic tasks
- Include validation tasks after each implementation task
- Include final integration testing tasks

### Step 3: Execute Steps
For each step in the PRP:

1. **Announce**: State which step you're executing
2. **Implement**: Create/modify files as specified
3. **Validate**: Run the validation for that step
4. **Report**: Confirm success or debug issues
5. **Commit**: Stage and commit changes with conventional commit message

### Step 4: Run Tests
After all steps:
- Run `npm test` (or appropriate test command)
- Run `npm run lint` (or appropriate lint command)
- Fix any failures before proceeding

### Step 5: Final Validation
Go through success criteria:
- [ ] Each criterion checked and confirmed
- [ ] All tests passing
- [ ] Code follows project conventions (CLAUDE.md)

### Step 6: Update Task Tracker
Edit `docs/TASK.md`:
- Mark the task as complete
- Add any notes about implementation
- Update current phase if needed

### Step 7: Git Operations
```bash
git add .
git commit -m "feat: [feature description]"
git push
```

## Error Handling

If a step fails:
1. Attempt to debug and fix (max 3 attempts)
2. If still failing, document the issue
3. Continue with other steps if possible
4. Report all issues at the end

If validation fails:
1. Review the error message
2. Check if it's a code issue or test issue
3. Fix and re-run validation
4. Document any test adjustments needed

## Output Format

For each step, report:
```
## Step N: [Step Name]
**Status**: ✅ Complete | ⚠️ Partial | ❌ Failed
**Files Changed**: [list]
**Validation**: [result]
**Notes**: [any relevant notes]
```

## Completion Report

After all steps:
```
## Implementation Complete

### Summary
- Steps completed: X/Y
- Tests passing: Yes/No
- Committed: Yes/No
- Pushed: Yes/No

### Files Created
- [file list]

### Files Modified
- [file list]

### Issues Encountered
- [any issues and resolutions]

### Next Steps
- [recommendations for follow-up]
```
