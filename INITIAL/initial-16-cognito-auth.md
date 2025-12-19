# INITIAL-16: Cognito Authentication for Course Management

## Overview
Add AWS Cognito authentication to protect course management operations (create/edit/delete). This establishes a reusable authentication pattern for future projects while keeping score generation publicly accessible.

## Goals
1. Learn Cognito fundamentals with a simple single-user setup
2. Protect mutating course operations (POST/PUT/DELETE)
3. Keep read operations public (GET /courses, POST /generate-score)
4. Establish reusable auth patterns for future projects

## Current State
- All API endpoints are public
- Anyone can add/edit/delete courses at /manage
- No authentication infrastructure exists

## Target State
- Cognito User Pool with single admin user
- Login required to access /manage page
- Protected API routes validate JWT tokens
- Public routes remain accessible without auth
- Reusable auth patterns documented

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ghost.jurigregg.com                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   /generate (public)              /manage (protected)            │
│         │                               │                        │
│         │                         ┌─────▼─────┐                  │
│         │                         │  Login    │                  │
│         │                         │  Page     │                  │
│         │                         └─────┬─────┘                  │
│         │                               │ JWT Token              │
│         ▼                               ▼                        │
│   ┌──────────────────────────────────────────────────┐          │
│   │                  API Gateway                      │          │
│   ├──────────────────┬───────────────────────────────┤          │
│   │  Public Routes   │     Protected Routes          │          │
│   │  ───────────────│    ────────────────────        │          │
│   │  GET /courses    │    POST /courses              │          │
│   │  POST /generate  │    PUT /courses/{id}          │          │
│   │                  │    DELETE /courses/{id}       │          │
│   │                  │           │                   │          │
│   │                  │    ┌──────▼──────┐            │          │
│   │                  │    │  Cognito    │            │          │
│   │                  │    │  Authorizer │            │          │
│   │                  │    └─────────────┘            │          │
│   └──────────────────┴───────────────────────────────┘          │
│                                                                  │
│   ┌─────────────────┐                                           │
│   │  Cognito User   │  - Single admin user                      │
│   │  Pool           │  - Email/password auth                    │
│   └─────────────────┘                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Requirements

### 1. AWS Cognito Setup

**User Pool Configuration:**
- Pool name: `golf-ghost-users`
- **Pricing tier: Essentials** (default tier, 10,000 MAU free forever - we use 1)
- Sign-in: Email only (no username)
- Password policy: Strong (min 8 chars, mixed case, numbers, symbols)
- MFA: Off (optional for single user)
- Email verification: Disabled (we set password directly via admin command)
- Self-registration: Disabled (admin creates users)

**Cost: $0** - Essentials tier includes 10,000 free MAUs indefinitely (not limited to 12-month free tier)

**App Client Configuration:**
- Client name: `golf-ghost-web`
- Auth flows: `ALLOW_USER_SRP_AUTH`, `ALLOW_REFRESH_TOKEN_AUTH`
- No client secret (public web client)
- Token validity: Access=1hr, Refresh=30days

**Admin User:**
- Create single user with your email
- Set permanent password via admin command

### 2. API Gateway Authorizer

**Cognito Authorizer:**
- Name: `golf-ghost-cognito-auth`
- Type: JWT
- Identity source: `$request.header.Authorization`
- Issuer: Cognito User Pool URL
- Audience: App Client ID

**Route Protection:**
| Route | Method | Auth Required |
|-------|--------|---------------|
| /courses | GET | No |
| /courses | POST | Yes |
| /courses/{id} | PUT | Yes |
| /courses/{id} | DELETE | Yes |
| /generate-score | POST | No |

### 3. Frontend Authentication

**New Components:**
- `src/lib/auth/cognito.ts` - Cognito client configuration
- `src/lib/auth/AuthContext.tsx` - React context for auth state
- `src/lib/auth/useAuth.ts` - Hook for auth operations
- `src/app/login/page.tsx` - Login page
- `src/components/ProtectedRoute.tsx` - Route guard component

**Auth Flow:**
1. User visits `/manage`
2. ProtectedRoute checks for valid token
3. If no token → redirect to `/login`
4. User enters email/password
5. Cognito returns tokens (access, id, refresh)
6. Tokens stored in sessionStorage
7. User redirected to `/manage`
8. API calls include `Authorization: Bearer <accessToken>`

**Token Management:**
- Store tokens in sessionStorage (cleared on browser close)
- Check token expiry before API calls
- Auto-refresh using refresh token when access token expires
- Clear tokens on logout

### 4. API Client Updates

**Modified Functions:**
- `createCourse()` - Add auth header
- `updateCourse()` - Add auth header
- `deleteCourse()` - Add auth header

**Auth Header Helper:**
```typescript
function getAuthHeaders(): HeadersInit {
  const token = sessionStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
```

### 5. UI Updates

**Login Page (`/login`):**
- Email input
- Password input
- Sign in button
- Error message display
- "Forgot password" link (uses Cognito forgot password flow)
- Glass-morphism styling consistent with app

**Manage Page Updates:**
- Show user email in header when logged in
- Add logout button
- Redirect to login if token expired/invalid

**Header Navigation:**
- Show "Login" link when not authenticated
- Show "Logout" when authenticated
- Manage link only visible when authenticated (optional)

---

## Implementation Tasks

### Phase A: AWS Infrastructure

**A1. Create Cognito User Pool**
- AWS CLI command to create user pool
- Configure password policy
- Disable self-registration

**A2. Create App Client**
- Configure auth flows
- Set token validity
- No client secret

**A3. Create Admin User**
- Create user with email
- Set permanent password
- Verify email status

**A4. Add API Gateway Authorizer**
- Create JWT authorizer
- Attach to protected routes
- Test with curl

### Phase B: Frontend Auth Layer

**B1. Auth Library Setup**
- Install `amazon-cognito-identity-js`
- Create Cognito client config
- Environment variables for Pool ID, Client ID

**B2. Auth Context & Hook**
- AuthProvider component
- useAuth hook (signIn, signOut, isAuthenticated, user)
- Token storage and refresh logic

**B3. Login Page**
- Form with email/password
- Error handling
- Redirect after success

**B4. Protected Route Component**
- Check auth state
- Redirect to login if not authenticated
- Show loading while checking

### Phase C: Integration

**C1. Protect /manage Route**
- Wrap with ProtectedRoute
- Handle token expiry

**C2. Update API Client**
- Add auth headers to protected calls
- Handle 401 responses (redirect to login)

**C3. Update Navigation**
- Login/Logout links
- User indicator when logged in

**C4. Deploy & Test**
- Deploy all changes
- Test full auth flow
- Verify protected routes reject unauthenticated requests

---

## Files to Create

| File | Description |
|------|-------------|
| `scripts/setup-cognito.sh` | Create User Pool, App Client, Admin User |
| `src/lib/auth/config.ts` | Cognito configuration |
| `src/lib/auth/cognito.ts` | Cognito client wrapper |
| `src/lib/auth/AuthContext.tsx` | React auth context provider |
| `src/lib/auth/useAuth.ts` | Auth hook |
| `src/lib/auth/index.ts` | Barrel export |
| `src/app/login/page.tsx` | Login page |
| `src/components/ProtectedRoute.tsx` | Route guard |

## Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add `amazon-cognito-identity-js` |
| `.env.local` | Add COGNITO_POOL_ID, COGNITO_CLIENT_ID |
| `scripts/setup-api-gateway.sh` | Add authorizer, protect routes |
| `src/lib/api/client.ts` | Add auth headers to protected calls |
| `src/app/manage/page.tsx` | Wrap with ProtectedRoute |
| `src/app/layout.tsx` | Wrap with AuthProvider |
| `src/app/page.tsx` | Update nav for auth state |

---

## Environment Variables

```bash
# .env.local (add to existing)
NEXT_PUBLIC_COGNITO_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## AWS CLI Commands Reference

```bash
# Create User Pool
aws cognito-idp create-user-pool \
  --pool-name golf-ghost-users \
  --policies '{"PasswordPolicy":{"MinimumLength":8,"RequireUppercase":true,"RequireLowercase":true,"RequireNumbers":true,"RequireSymbols":true}}' \
  --auto-verified-attributes email \
  --username-attributes email \
  --admin-create-user-config '{"AllowAdminCreateUserOnly":true}' \
  --region us-east-1

# Create App Client
aws cognito-idp create-user-pool-client \
  --user-pool-id USER_POOL_ID \
  --client-name golf-ghost-web \
  --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --generate-secret false \
  --access-token-validity 60 \
  --id-token-validity 60 \
  --refresh-token-validity 43200 \
  --token-validity-units '{"AccessToken":"minutes","IdToken":"minutes","RefreshToken":"minutes"}' \
  --region us-east-1

# Create Admin User
aws cognito-idp admin-create-user \
  --user-pool-id USER_POOL_ID \
  --username YOUR_EMAIL \
  --user-attributes Name=email,Value=YOUR_EMAIL Name=email_verified,Value=true \
  --message-action SUPPRESS \
  --region us-east-1

# Set Permanent Password
aws cognito-idp admin-set-user-password \
  --user-pool-id USER_POOL_ID \
  --username YOUR_EMAIL \
  --password "YOUR_SECURE_PASSWORD" \
  --permanent \
  --region us-east-1
```

---

## Context Files to Read

- [x] CLAUDE.md
- [x] docs/PLANNING.md
- [x] docs/DECISIONS.md
- [x] docs/TASK.md
- [ ] src/lib/api/client.ts - Current API client pattern
- [ ] src/app/manage/page.tsx - Page to protect
- [ ] src/app/layout.tsx - Where to add AuthProvider
- [ ] src/app/page.tsx - Navigation updates
- [ ] src/components/GlassCard.tsx - Styling reference for login
- [ ] src/components/GlassButton.tsx - Button styling
- [ ] scripts/setup-api-gateway.sh - Current API Gateway setup

---

## Success Criteria

- [ ] Cognito User Pool created with app client
- [ ] Admin user can sign in
- [ ] `/login` page works with glass-morphism styling
- [ ] `/manage` redirects to login when not authenticated
- [ ] Protected API routes return 401 without valid token
- [ ] Protected API routes work with valid token
- [ ] Public routes (GET /courses, POST /generate-score) still work without auth
- [ ] Login persists until browser close (sessionStorage)
- [ ] Logout clears tokens and redirects
- [ ] Token auto-refresh works before expiry

---

## Future Enhancements (Out of Scope)

- Multiple users with roles (admin, viewer)
- Social login (Google, GitHub)
- "Remember me" with localStorage
- Password reset UI
- User management UI
- MFA support

---

## Decision to Add

### DEC-014: Cognito for Authentication
**Date**: 2025-XX-XX
**Status**: Decided
**Context**: Need to protect course management from unauthorized access
**Decision**: Use AWS Cognito User Pools for authentication
**Rationale**:
- Consistent with existing AWS infrastructure
- Industry-standard JWT-based auth
- Reusable pattern for future projects
- Free tier covers our usage (50,000 MAU)
- No server-side session management needed
**Alternatives Considered**:
- Simple password in Lambda env var (too basic, not scalable)
- Cloudflare Access (external dependency)
- Auth0 (adds another service, Cognito already in AWS)
