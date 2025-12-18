# Generate PRP Command

You are generating a comprehensive PRP (Product Requirements Prompt) for a feature request.

## Input
The feature request file: $ARGUMENTS

## Process

### Step 1: Gather Context
Read these files to understand the project:
- `CLAUDE.md` - Project rules and conventions
- `docs/PLANNING.md` - Architecture overview
- `docs/DECISIONS.md` - Past decisions
- `docs/TASK.md` - Current status

### Step 2: Research Codebase
- Search for similar patterns in the existing code
- Check `/examples` folder for styling references
- Check `/old` folder for original Python implementation
- Identify dependencies and integration points

### Step 3: Analyze Feature Request
- Parse the INITIAL file provided
- Identify all requirements
- Note any referenced documentation or examples
- List potential gotchas or edge cases

### Step 4: Generate PRP
Create a comprehensive PRP in `PRPs/[feature-name].md` with:

```markdown
# PRP: [Feature Name]

## Overview
[What this feature does and why]

## Context Files Read
- [ ] CLAUDE.md
- [ ] docs/PLANNING.md
- [ ] docs/DECISIONS.md
- [ ] docs/TASK.md
- [ ] [Any referenced examples]
- [ ] [Any old Python files referenced]

## Requirements
[From the INITIAL file]

## Technical Approach
[How to implement this]

## Implementation Steps

### Step 1: [Name]
**Files**: [files to create/modify]
**Actions**:
1. [Specific action]
2. [Specific action]
**Validation**: [How to verify this step]

### Step 2: [Name]
...

## Testing Requirements
- [ ] [Specific test]
- [ ] [Specific test]

## Validation Commands
```bash
# Commands to run after implementation
```

## Success Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Confidence Score
[1-10] - [Explanation of confidence level]

## Notes
[Any additional context or warnings]
```

### Step 5: Report
After generating the PRP:
1. State the file location
2. Report confidence score
3. Note any areas needing clarification
4. Suggest if human review is recommended before execution

## Output
Save the PRP to: `PRPs/[feature-name].md`
