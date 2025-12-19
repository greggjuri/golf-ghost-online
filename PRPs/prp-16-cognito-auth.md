# PRP: Cognito Authentication for Course Management

## Overview
Add AWS Cognito authentication to protect course management operations (create/edit/delete). This establishes a reusable authentication pattern while keeping score generation publicly accessible. Single-user setup for admin access only.

## Context Files Read
- [x] CLAUDE.md - Project rules and conventions
- [x] docs/PLANNING.md - Architecture overview (S3/CloudFront + API Gateway + Lambda + DynamoDB)
- [x] docs/DECISIONS.md - Past decisions (DEC-010 pending on user auth - this feature addresses it)
- [x] docs/TASK.md - Current status (Phase 7 complete, ready for Phase 8: Auth)
- [x] INITIAL/initial-16-cognito-auth.md - Full feature specification
- [x] src/lib/api/client.ts - Current API client pattern (no auth headers)
- [x] src/app/manage/page.tsx - Page to protect (190 lines, full CRUD)
- [x] src/app/layout.tsx - Root layout (23 lines, simple)
- [x] src/app/page.tsx - Home page with navigation (103 lines)
- [x] scripts/setup-api-gateway.sh - Current API Gateway setup (HTTP API, no auth)
- [x] src/components/GlassCard.tsx - Styling reference
- [x] src/components/GlassButton.tsx - Button styling (has primary/secondary/danger variants)
- [x] package.json - Current dependencies

## Requirements

### From INITIAL-16:
1. **Cognito User Pool**: `golf-ghost-users` with Essentials tier (free for 10K MAU)
2. **Single Admin User**: Email/password auth, created via admin command
3. **Protected Routes**:
   - POST /courses (create) - Auth required
   - PUT /courses/{id} (update) - Auth required
   - DELETE /courses/{id} (delete) - Auth required
4. **Public Routes** (unchanged):
   - GET /courses
   - POST /generate-score
5. **Frontend Auth**:
   - Login page at `/login`
   - ProtectedRoute component for `/manage`
   - AuthContext for auth state management
   - Token stored in sessionStorage
   - Auto-refresh before token expiry
6. **API Gateway JWT Authorizer**: Validate tokens on protected routes

## Technical Approach

### Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                     ghost.jurigregg.com                          │
├─────────────────────────────────────────────────────────────────┤
│   /generate (public)              /manage (protected)            │
│         │                               │                        │
│         │                         ┌─────▼─────┐                  │
│         │                         │  Check    │                  │
│         │                         │  Auth     │──→ /login        │
│         │                         └─────┬─────┘                  │
│         │                               │ JWT Token              │
│         ▼                               ▼                        │
│   ┌──────────────────────────────────────────────────┐          │
│   │                  API Gateway                      │          │
│   ├──────────────────┬───────────────────────────────┤          │
│   │  Public Routes   │     Protected Routes          │          │
│   │  GET /courses    │    POST /courses → JWT Auth   │          │
│   │  POST /generate  │    PUT /courses/{id} → JWT    │          │
│   │                  │    DELETE /courses/{id} → JWT │          │
│   └──────────────────┴───────────────────────────────┘          │
│                                                                  │
│   ┌─────────────────┐                                           │
│   │  Cognito User   │  - Email/password auth                    │
│   │  Pool           │  - Essentials tier ($0)                   │
│   └─────────────────┘  - Single admin user                      │
└─────────────────────────────────────────────────────────────────┘
```

### Key Decisions
- **amazon-cognito-identity-js**: Official AWS SDK for browser-based auth
- **sessionStorage**: Tokens cleared on browser close (not localStorage)
- **JWT Authorizer**: API Gateway native JWT validation (no Lambda custom auth)
- **No MFA**: Single user, password-only for simplicity
- **No email verification**: User created via admin CLI command

---

## Implementation Steps

### Step 1: Create Cognito Setup Script
**Files**: `scripts/setup-cognito.sh`
**Actions**:
1. Create bash script to create Cognito User Pool with settings:
   - Pool name: `golf-ghost-users`
   - Sign-in: Email only
   - Password policy: Strong (8+ chars, mixed case, numbers, symbols)
   - Self-registration: Disabled
   - Email verification: Disabled
2. Create App Client:
   - Client name: `golf-ghost-web`
   - Auth flows: `ALLOW_USER_SRP_AUTH`, `ALLOW_REFRESH_TOKEN_AUTH`
   - No client secret (public web client)
   - Token validity: Access=1hr, Refresh=30days
3. Output User Pool ID and Client ID for env vars

**Validation**: Run script, verify User Pool created in AWS Console

### Step 2: Create Admin User Script
**Files**: `scripts/create-admin-user.sh`
**Actions**:
1. Create script that takes email as argument
2. Create user with admin-create-user (SUPPRESS message)
3. Set email_verified=true
4. Prompt for password and set with admin-set-user-password --permanent
5. Output confirmation

**Validation**: Login attempt with created credentials in AWS Console

### Step 3: Add API Gateway JWT Authorizer Script
**Files**: `scripts/setup-cognito-authorizer.sh`
**Actions**:
1. Create JWT authorizer on existing API Gateway:
   - Name: `golf-ghost-cognito-auth`
   - Type: JWT
   - Identity source: `$request.header.Authorization`
   - Issuer: `https://cognito-idp.{region}.amazonaws.com/{userPoolId}`
   - Audience: App Client ID
2. Update protected routes to use authorizer:
   - POST /courses
   - PUT /courses/{id}
   - DELETE /courses/{id}
3. Keep public routes without auth:
   - GET /courses
   - POST /generate-score

**Validation**: `curl -X POST .../courses` returns 401 without token

### Step 4: Install Cognito SDK
**Files**: `package.json`
**Actions**:
1. Add `amazon-cognito-identity-js` to dependencies
2. Run `npm install`

**Validation**: Package appears in node_modules

### Step 5: Create Auth Configuration
**Files**: `src/lib/auth/config.ts`
**Actions**:
1. Create config file with:
   ```typescript
   export const cognitoConfig = {
     region: process.env.NEXT_PUBLIC_COGNITO_REGION || 'us-east-1',
     userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
     clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
   };
   ```
2. Add type for config

**Validation**: TypeScript compiles without errors

### Step 6: Create Cognito Client Wrapper
**Files**: `src/lib/auth/cognito.ts`
**Actions**:
1. Create CognitoUserPool instance with config
2. Export functions:
   - `signIn(email, password)`: Returns tokens or throws error
   - `signOut()`: Clear session
   - `getCurrentUser()`: Get current authenticated user
   - `getAccessToken()`: Get current access token (with refresh if needed)
   - `refreshSession()`: Refresh tokens using refresh token
3. Handle Cognito errors with readable messages

**Validation**: Manual test of signIn in browser console

### Step 7: Create Auth Context
**Files**: `src/lib/auth/AuthContext.tsx`
**Actions**:
1. Create AuthContext with state:
   - `user`: Current user email or null
   - `isAuthenticated`: Boolean
   - `isLoading`: Boolean (for initial check)
2. Create AuthProvider component:
   - Check sessionStorage for existing session on mount
   - Validate token, refresh if needed
   - Provide signIn, signOut, getAccessToken functions
3. Export useAuth hook

**Validation**: Wrap test component, verify context provides values

### Step 8: Create useAuth Hook
**Files**: `src/lib/auth/useAuth.ts`
**Actions**:
1. Create hook that uses AuthContext
2. Throw error if used outside AuthProvider
3. Export typed return value

**Validation**: Use hook in component, verify type safety

### Step 9: Create Auth Barrel Export
**Files**: `src/lib/auth/index.ts`
**Actions**:
1. Export all auth modules:
   ```typescript
   export * from './config';
   export * from './cognito';
   export * from './AuthContext';
   export * from './useAuth';
   ```

**Validation**: Import from '@/lib/auth' works

### Step 10: Create Login Page
**Files**: `src/app/login/page.tsx`
**Actions**:
1. Create login page with:
   - Email input (type="email")
   - Password input (type="password")
   - Sign In button (GlassButton primary)
   - Error message display (red text)
   - Loading state during auth
2. Style with glass-morphism (match app aesthetic):
   - GlassCard container
   - Dark theme colors
   - Centered on page
3. On success: redirect to /manage
4. Handle errors: Display Cognito error messages

**Validation**: Visual inspection, form submits

### Step 11: Create ProtectedRoute Component
**Files**: `src/components/ProtectedRoute.tsx`
**Actions**:
1. Create component that:
   - Uses useAuth hook
   - Shows loading spinner while checking auth
   - Redirects to /login if not authenticated
   - Renders children if authenticated
2. Accept optional `redirectTo` prop

**Validation**: Wrap test page, verify redirect behavior

### Step 12: Wrap Layout with AuthProvider
**Files**: `src/app/layout.tsx`
**Actions**:
1. Import AuthProvider from '@/lib/auth'
2. Wrap {children} with AuthProvider
3. Ensure 'use client' is NOT added to layout (AuthProvider handles it)

**Validation**: App still renders, no hydration errors

### Step 13: Protect Manage Page
**Files**: `src/app/manage/page.tsx`
**Actions**:
1. Import ProtectedRoute component
2. Wrap page content with ProtectedRoute
3. Add logout button in header (visible when authenticated)
4. Show user email in header

**Validation**: Visit /manage unauthenticated → redirects to /login

### Step 14: Update API Client with Auth Headers
**Files**: `src/lib/api/client.ts`
**Actions**:
1. Import getAccessToken from '@/lib/auth'
2. Create helper function:
   ```typescript
   async function getAuthHeaders(): Promise<HeadersInit> {
     try {
       const token = await getAccessToken();
       return token ? { Authorization: `Bearer ${token}` } : {};
     } catch {
       return {};
     }
   }
   ```
3. Update protected functions to use auth headers:
   - `createCourse()`: Add auth header
   - `updateCourse()`: Add auth header
   - `deleteCourse()`: Add auth header
4. Handle 401 responses (throw specific error)

**Validation**: API calls work when authenticated

### Step 15: Update Navigation for Auth State
**Files**: `src/app/page.tsx`
**Actions**:
1. Use useAuth hook for auth state
2. Conditional navigation:
   - If authenticated: Show "Logout" button, "Manage" link
   - If not authenticated: Show "Login" link (optional, Manage can redirect)
3. Logout handler that calls signOut and redirects to /

**Validation**: Navigation reflects auth state correctly

### Step 16: Add Environment Variables
**Files**: `.env.local`, `.env.example`
**Actions**:
1. Add to .env.local:
   ```
   NEXT_PUBLIC_COGNITO_REGION=us-east-1
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
   NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
2. Create .env.example with placeholder values
3. Update .gitignore if needed (usually already ignores .env.local)

**Validation**: Env vars accessible in browser

### Step 17: Deploy and Test
**Files**: Various
**Actions**:
1. Run Cognito setup scripts (create pool, app client, admin user)
2. Run API Gateway authorizer script
3. Update .env.local with actual Cognito IDs
4. Build and deploy: `npm run deploy`
5. Test full flow:
   - Visit /manage → redirect to /login
   - Login with admin credentials → redirect to /manage
   - CRUD operations work
   - Logout → redirect to /
   - Protected API returns 401 without token
   - Public API still works

**Validation**: Full end-to-end test on production

### Step 18: Update Documentation
**Files**: `docs/DECISIONS.md`, `docs/TASK.md`
**Actions**:
1. Add DEC-014: Cognito for Authentication to DECISIONS.md
2. Update TASK.md with Phase 8 completion
3. Document env vars and setup steps

**Validation**: Documentation complete and accurate

---

## Testing Requirements

- [ ] Unit test: signIn function handles success/failure
- [ ] Unit test: getAccessToken returns valid token or null
- [ ] Unit test: Auth context provides correct initial state
- [ ] Integration test: Login flow redirects correctly
- [ ] Integration test: Protected route redirects unauthenticated users
- [ ] Integration test: API calls include auth header when authenticated
- [ ] Integration test: API calls work without auth for public routes
- [ ] Manual test: Full login/logout flow on production
- [ ] Manual test: Token refresh works (wait for expiry)
- [ ] Manual test: Protected API rejects unauthenticated requests

---

## Validation Commands

```bash
# After Step 1-2: Verify Cognito setup
aws cognito-idp list-user-pools --max-results 10 --region us-east-1
aws cognito-idp list-users --user-pool-id USER_POOL_ID --region us-east-1

# After Step 3: Test protected API without auth
curl -X POST https://API_URL/prod/courses \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'
# Should return 401 Unauthorized

# After Step 4: Verify package installed
npm ls amazon-cognito-identity-js

# After Step 16: Build check
npm run build

# After Step 17: Test public API still works
curl https://API_URL/prod/courses
# Should return course list

# Test protected API with token
TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id USER_POOL_ID \
  --client-id CLIENT_ID \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=admin@email.com,PASSWORD=password \
  --query 'AuthenticationResult.AccessToken' --output text)

curl -X POST https://API_URL/prod/courses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Course","teeName":"Blue","courseRating":72,"slopeRating":113,"parValues":[4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],"holeHandicaps":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],"yardages":[400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400,400]}'
# Should return 200 with created course
```

---

## Success Criteria

- [ ] Cognito User Pool created with Essentials tier
- [ ] App client configured with SRP auth flow
- [ ] Admin user can sign in with email/password
- [ ] `/login` page renders with glass-morphism styling
- [ ] `/login` handles errors gracefully (wrong password, etc.)
- [ ] `/manage` redirects to `/login` when not authenticated
- [ ] `/manage` loads correctly when authenticated
- [ ] Protected API routes (POST/PUT/DELETE /courses) return 401 without token
- [ ] Protected API routes work with valid JWT token
- [ ] Public routes (GET /courses, POST /generate-score) work without auth
- [ ] Login persists until browser close (sessionStorage)
- [ ] Logout clears tokens and redirects to home
- [ ] Token auto-refresh works before 1-hour expiry
- [ ] User email displayed in header when logged in
- [ ] Logout button visible and functional
- [ ] No TypeScript errors, build succeeds
- [ ] All existing tests pass (66 tests)

---

## Confidence Score
**8/10** - High confidence

**Rationale**:
- Clear, well-documented feature spec in INITIAL-16
- Cognito is mature, well-documented AWS service
- `amazon-cognito-identity-js` is official, widely used
- Existing codebase patterns are clear and consistent
- API Gateway JWT authorizer is straightforward

**Areas of uncertainty**:
- Token refresh timing (may need adjustment based on testing)
- CORS configuration for Authorization header (may need update)
- Exact Cognito error message formatting

---

## Notes

### CORS Update Required
The API Gateway CORS config in `scripts/setup-api-gateway.sh` needs to include the `Authorization` header:
```json
"AllowHeaders": ["Content-Type", "Authorization"]
```

### Token Storage
Using sessionStorage (not localStorage) means:
- Tokens cleared when browser closes
- Tokens NOT shared across tabs (each tab has own session)
- More secure for single-user admin use case

### Password Change Flow
Not implementing password change UI in MVP. Admin can use AWS CLI:
```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id POOL_ID \
  --username EMAIL \
  --password NEW_PASSWORD \
  --permanent
```

### Future Enhancements (Out of Scope)
- Multiple users with roles
- Social login (Google, GitHub)
- "Remember me" with localStorage
- Password reset UI
- User management UI
- MFA support

### Files Summary

**New Files (9)**:
| File | Description |
|------|-------------|
| `scripts/setup-cognito.sh` | Create User Pool and App Client |
| `scripts/create-admin-user.sh` | Create admin user with password |
| `scripts/setup-cognito-authorizer.sh` | Add JWT authorizer to API Gateway |
| `src/lib/auth/config.ts` | Cognito configuration |
| `src/lib/auth/cognito.ts` | Cognito client wrapper |
| `src/lib/auth/AuthContext.tsx` | React auth context provider |
| `src/lib/auth/useAuth.ts` | Auth hook |
| `src/lib/auth/index.ts` | Barrel export |
| `src/app/login/page.tsx` | Login page |
| `src/components/ProtectedRoute.tsx` | Route guard |

**Modified Files (6)**:
| File | Changes |
|------|---------|
| `package.json` | Add `amazon-cognito-identity-js` |
| `.env.local` | Add Cognito env vars |
| `scripts/setup-api-gateway.sh` | Update CORS for Authorization header |
| `src/lib/api/client.ts` | Add auth headers to protected calls |
| `src/app/manage/page.tsx` | Wrap with ProtectedRoute, add logout |
| `src/app/layout.tsx` | Wrap with AuthProvider |
| `src/app/page.tsx` | Update nav for auth state |
| `docs/DECISIONS.md` | Add DEC-014 |
| `docs/TASK.md` | Add Phase 8 tasks |

---

## Decision to Add

### DEC-014: Cognito for Authentication
**Date**: 2025-01-XX
**Status**: Decided
**Context**: Need to protect course management from unauthorized access
**Decision**: Use AWS Cognito User Pools for authentication
**Rationale**:
- Consistent with existing AWS infrastructure (API Gateway, Lambda, DynamoDB)
- Industry-standard JWT-based auth
- Reusable pattern for future projects
- Essentials tier covers our usage (10,000 MAU free forever)
- No server-side session management needed
- Native API Gateway JWT authorizer integration
**Alternatives Considered**:
- Simple password in Lambda env var (too basic, not scalable, not secure)
- Cloudflare Access (external dependency, not in AWS ecosystem)
- Auth0 (adds another service, Cognito already in AWS)
- Custom Lambda authorizer (more work, Cognito handles JWT validation)
**Consequences**:
- Need to manage Cognito resources in AWS
- Frontend needs Cognito SDK dependency (~50KB gzipped)
- Token management adds complexity to API client
