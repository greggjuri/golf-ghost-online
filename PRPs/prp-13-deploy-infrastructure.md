# PRP: Infrastructure Deployment Scripts

## Overview
Create deployment scripts and configurations for the remaining AWS infrastructure. Claude Code creates the scripts; user executes them manually. This consolidates tasks 18-22 (S3, CloudFront, API Gateway, Route53, Lambda deployment) into executable shell scripts.

## Context Files Read
- [x] CLAUDE.md
- [x] docs/PLANNING.md
- [x] docs/DECISIONS.md
- [x] docs/TASK.md
- [x] INITIAL/initial-13-deploy-infrastructure.md
- [x] lambda/package.json
- [x] lambda/tsconfig.json
- [x] next.config.mjs (confirms `output: 'export'`)
- [x] package.json (root)

## Requirements
From INITIAL-13, create 7 deployment scripts:
1. `setup-s3-policy.sh` - S3 bucket policy for CloudFront OAC access
2. `setup-cloudfront-errors.sh` - Configure 404 -> index.html for SPA routing
3. `deploy-lambdas.sh` - Build and deploy all 4 Lambda functions
4. `setup-api-gateway.sh` - Create HTTP API with routes and CORS
5. `setup-dns.sh` - Route53 alias record for ghost.jurigregg.com
6. `deploy-site.sh` - Build Next.js and sync to S3
7. `deploy-all.sh` - Master script to run infrastructure setup

## AWS Resource Context (Already Created)
```
Account ID:           490004610151
Region:               us-east-1
S3 Bucket:            golf-ghost-online
CloudFront Dist ID:   E2KBQWTXR4AM7Y
CloudFront Domain:    d3o4hk0lf61t0c.cloudfront.net
DynamoDB Table:       golf-ghost-courses
```

## Technical Approach

### Lambda Build Strategy
The Lambda functions use ESM modules (`"type": "module"` in package.json). The deployment needs to:
1. Run `npm run build` in `lambda/` to compile TypeScript to JavaScript
2. Copy compiled output along with node_modules
3. Ensure ESM compatibility (handler path uses `.mjs` or configure properly)

**Key insight**: The tsconfig outputs to `./dist` with the same structure. The handlers are at:
- `dist/generate-score/index.js`
- `dist/get-courses/index.js`
- `dist/create-course/index.js`
- `dist/delete-course/index.js`

The shared code compiles to `dist/shared/`.

### Handler Configuration
Since Lambda functions use ESM, the handler format should be:
- Runtime: `nodejs20.x`
- Handler: `index.handler` (standard)
- But need to either:
  - Rename `.js` files to `.mjs`, OR
  - Include `package.json` with `"type": "module"` in the zip

Best approach: Include a minimal `package.json` with `"type": "module"` in each deployment package.

### Script Modifications from INITIAL
The INITIAL file provides mostly complete scripts, but needs adjustments:

1. **deploy-lambdas.sh**:
   - Build output is in `lambda/dist/`, not `lambda/dist/{func}/`
   - Need to handle ESM module type
   - The directory structure from tsconfig is flat relative to rootDir

2. **setup-api-gateway.sh**:
   - Statement ID for lambda permissions has invalid characters (`/` in path)
   - Need to sanitize statement IDs

3. **deploy-site.sh**:
   - Correct as specified (uses `out/` from Next.js export)

## Implementation Steps

### Step 1: Create scripts directory structure
**Files**: `scripts/` directory
**Actions**:
1. Verify scripts directory exists (it does, has `sync-scoring.sh`)
2. Create all 7 shell scripts with executable permissions

**Validation**: `ls -la scripts/` shows all scripts with +x

### Step 2: Create S3 Bucket Policy Script
**Files**: `scripts/setup-s3-policy.sh`
**Actions**:
1. Create script with hardcoded bucket/account/distribution values
2. Generate policy JSON allowing CloudFront OAC access
3. Apply with `aws s3api put-bucket-policy`

**Validation**: Script runs without error (user must have AWS CLI configured)

### Step 3: Create CloudFront Error Pages Script
**Files**: `scripts/setup-cloudfront-errors.sh`
**Actions**:
1. Get current distribution config
2. Add custom error response for 404 -> /index.html (200)
3. Update distribution

**Validation**: CloudFront distribution shows custom error responses in console

### Step 4: Create Lambda Deployment Script
**Files**: `scripts/deploy-lambdas.sh`
**Actions**:
1. Check/create IAM role with DynamoDB and CloudWatch permissions
2. Build Lambda code (`cd lambda && npm run build`)
3. For each function:
   - Create deployment directory
   - Copy compiled handler (`dist/{func-name}/index.js`)
   - Copy shared modules (`dist/shared/`)
   - Add `package.json` with `"type": "module"`
   - Copy node_modules (production only)
   - Create zip package
   - Create or update Lambda function
4. Set environment variable `COURSES_TABLE=golf-ghost-courses`

**Key paths** (based on tsconfig with `rootDir: "."`):
- Handler: `dist/generate-score/index.js` -> handler is `index.handler`
- Shared: `dist/shared/` directory
- The compiled files reference `../shared/` relatively

**Validation**: Each Lambda function exists in AWS console

### Step 5: Create API Gateway Setup Script
**Files**: `scripts/setup-api-gateway.sh`
**Actions**:
1. Create HTTP API (or use existing)
2. Configure CORS for ghost.jurigregg.com and localhost:3000
3. Create integrations for each Lambda
4. Create routes:
   - POST /generate-score
   - GET /courses
   - POST /courses
   - DELETE /courses/{id}
5. Create production stage with auto-deploy
6. Add Lambda invoke permissions
7. Output API endpoint URL

**Validation**: API Gateway console shows the API with routes

### Step 6: Create Route53 DNS Script
**Files**: `scripts/setup-dns.sh`
**Actions**:
1. Find hosted zone for jurigregg.com
2. Create/upsert A record alias for ghost.jurigregg.com
3. Point to CloudFront distribution

**Validation**: `dig ghost.jurigregg.com` returns CloudFront IP after propagation

### Step 7: Create Static Site Deployment Script
**Files**: `scripts/deploy-site.sh`
**Actions**:
1. Build Next.js (`npm run build` -> outputs to `out/`)
2. Sync to S3 with delete flag
3. Create CloudFront invalidation

**Validation**: Site accessible at CloudFront URL

### Step 8: Create Master Deployment Script
**Files**: `scripts/deploy-all.sh`
**Actions**:
1. Run scripts in order: S3 policy, CloudFront errors, Lambdas, API Gateway, DNS
2. Output summary with API URL
3. Remind user to update frontend with API URL

**Validation**: Running `bash scripts/deploy-all.sh` completes all steps

### Step 9: Add npm scripts to package.json
**Files**: `package.json` (root)
**Actions**:
1. Add `"deploy": "bash scripts/deploy-site.sh"`
2. Add `"deploy:infra": "bash scripts/deploy-all.sh"`
3. Add `"deploy:lambdas": "bash scripts/deploy-lambdas.sh"`

**Validation**: `npm run deploy:infra` works

## Testing Requirements
- [ ] All scripts are executable (`chmod +x`)
- [ ] Scripts use `set -e` to fail fast on errors
- [ ] Scripts are idempotent (safe to run multiple times)
- [ ] Lambda deployment correctly handles ESM modules
- [ ] API Gateway routes work (manual curl test)
- [ ] CloudFront serves index.html for 404s (SPA routing)
- [ ] DNS resolves ghost.jurigregg.com to CloudFront

## Validation Commands
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Test individual scripts (run in order)
bash scripts/setup-s3-policy.sh
bash scripts/setup-cloudfront-errors.sh
bash scripts/deploy-lambdas.sh
bash scripts/setup-api-gateway.sh
bash scripts/setup-dns.sh

# Test API endpoint (after getting URL from setup-api-gateway.sh output)
curl -X GET https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/courses

# Deploy frontend
npm run deploy

# Full infrastructure deployment
npm run deploy:infra
```

## Success Criteria
- [ ] All 7 scripts created in `scripts/` directory
- [ ] Scripts have executable permissions
- [ ] `deploy-all.sh` runs successfully end-to-end
- [ ] S3 bucket policy allows CloudFront OAC access
- [ ] CloudFront returns index.html for 404 (SPA support)
- [ ] All 4 Lambda functions deployed and working
- [ ] API Gateway HTTP API created with correct routes
- [ ] Route53 DNS points ghost.jurigregg.com to CloudFront
- [ ] `npm run deploy` builds and deploys static site
- [ ] npm scripts added to root package.json

## Confidence Score
**9/10** - High confidence because:
- INITIAL file provides detailed, complete scripts
- AWS resource IDs are already known and hardcoded
- Infrastructure components (S3, CloudFront, DynamoDB) already exist
- Lambda code structure is clear from existing files
- Only minor adjustments needed for ESM module handling

Small deduction for potential issues:
- Lambda ESM configuration may need iteration
- API Gateway permission statement IDs need character sanitization

## Notes
- Scripts use hardcoded values for this specific deployment (not parameterized)
- User must have AWS CLI configured with appropriate permissions
- DNS propagation takes a few minutes after `setup-dns.sh`
- The API endpoint URL will be output by `setup-api-gateway.sh` - user needs to save it for frontend configuration
- Lambda deployment packages include production node_modules only to minimize size
- CloudFront invalidation may take 1-2 minutes to complete
