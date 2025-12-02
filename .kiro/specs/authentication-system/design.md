# Design Document - Authentication System

## Overview

The Authentication System provides secure user authentication, registration, password management, and session handling for the Mientior e-commerce marketplace. The system leverages Better Auth as the core authentication library, integrating with the existing Prisma database schema and Redis cache infrastructure.

The design addresses the critical security gap where admin authentication is currently bypassed (SKIP_AUTH=true) and no frontend authentication UI exists. The system will support both customer and admin user authentication with role-based access control, email verification, OAuth social login, and comprehensive security features including rate limiting, CSRF protection, and breach detection.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Login Page   │  │ Register Page│  │ Reset Page   │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          │ POST /api/auth/* │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Better Auth API Handler (/api/auth/[...all]/route.ts)  │  │
│  │  - signIn, signUp, signOut, resetPassword, verifyEmail  │  │
│  └──────────────────┬───────────────────────────────────────┘  │
└─────────────────────┼──────────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│  PostgreSQL DB   │    │   Redis Cache    │
│  ┌────────────┐  │    │  ┌────────────┐  │
│  │ User       │  │    │  │ Sessions   │  │
│  │ Session    │  │    │  │ Rate Limit │  │
│  │ Account    │  │    │  │ Tokens     │  │
│  │ Verification│ │    │  └────────────┘  │
│  │ Customer   │  │    └──────────────────┘
│  │ AdminUser  │  │
│  └────────────┘  │
└──────────────────┘
          │
          ▼
┌──────────────────┐
│  Resend Email    │
│  - Verification  │
│  - Password Reset│
│  - Welcome       │
│  - Security Alert│
└──────────────────┘
```

### Component Breakdown

1. **Authentication Pages** (Client Components)
   - `/login` - Customer and admin login
   - `/register` - Customer registration
   - `/forgot-password` - Password reset request
   - `/reset-password` - Password reset form
   - `/verify-email` - Email verification handler
   - `/admin/login` - Dedicated admin login

2. **API Routes** (Server-side)
   - `/api/auth/[...all]` - Better Auth handler (all auth operations)
   - Custom middleware for rate limiting and CSRF

3. **Server Utilities**
   - `getSession()` - Retrieve current session
   - `requireAuth()` - Enforce authentication
   - `getAdminSession()` - Get admin session with role info

4. **Database Models** (Existing Prisma schema)
   - `User` - Better Auth users table
   - `Session` - Active sessions
   - `Account` - OAuth accounts
   - `Verification` - Email verification tokens
   - `Customer` - Customer profile data
   - `AdminUser` - Admin user with roles/permissions

## Components and Interfaces

### Authentication Pages

#### LoginPage Component
```typescript
// src/app/(auth)/login/page.tsx
'use client'

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export default function LoginPage() {
  // Form handling with react-hook-form + zod
  // Submit to Better Auth signIn API
  // Handle errors (invalid credentials, unverified email, locked account)
  // Redirect to intended destination or homepage
}
```

#### RegisterPage Component
```typescript
// src/app/(auth)/register/page.tsx
'use client'

interface RegisterFormData {
  email: string
  password: string
  passwordConfirm: string
  firstName: string
  lastName: string
  acceptTerms: boolean
}

export default function RegisterPage() {
  // Form with real-time password validation
  // Submit to Better Auth signUp API
  // Show success message with email verification prompt
  // Send verification email via Resend
}
```

#### ForgotPasswordPage Component
```typescript
// src/app/(auth)/forgot-password/page.tsx
'use client'

interface ForgotPasswordFormData {
  email: string
}

export default function ForgotPasswordPage() {
  // Simple email input form
  // Submit to password reset API
  // Always show success message (prevent email enumeration)
  // Send reset email with 1-hour token
}
```

#### ResetPasswordPage Component
```typescript
// src/app/(auth)/reset-password/page.tsx
'use client'

interface ResetPasswordFormData {
  token: string
  password: string
  passwordConfirm: string
}

export default function ResetPasswordPage() {
  // Validate token on mount
  // Password form with strength indicator
  // Submit new password
  // Invalidate all other sessions
  // Redirect to login
}
```

### Server-Side Authentication

#### Enhanced Auth Server Utilities
```typescript
// src/lib/auth-server.ts

export async function getSession(): Promise<Session | null> {
  // Check Redis cache first (5min TTL)
  // Fall back to database if cache miss
  // Cache session in Redis
  // Return session or null
}

export async function requireAuth(): Promise<Session> {
  // Get session
  // Throw if not authenticated
  // Check email verification if required
}

export async function getAdminSession(): Promise<AdminSession | null> {
  // Get base session
  // Load AdminUser with role/permissions
  // Verify isActive=true
  // Return admin session with role info
}

export async function requireAdminAuth(
  permission?: Permission
): Promise<AdminSession> {
  // Get admin session
  // Throw if not admin
  // Check specific permission if provided
}
```

#### Rate Limiting Middleware
```typescript
// src/middleware/rate-limit-auth.ts

export async function rateLimitAuth(
  request: NextRequest,
  identifier: string,
  limits: RateLimitConfig
): Promise<RateLimitResult> {
  // Use Redis for distributed rate limiting
  // Track attempts with sliding window
  // Return remaining attempts and reset time
}

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
  blockDurationMs: number
}
```

### Email Templates

#### Verification Email
```typescript
// src/lib/email/templates/verification.tsx

export function VerificationEmail({
  name,
  verificationUrl,
  expiresIn
}: VerificationEmailProps) {
  // Branded email template
  // Clear CTA button
  // Expiry information
  // Support contact
}
```

#### Password Reset Email
```typescript
// src/lib/email/templates/password-reset.tsx

export function PasswordResetEmail({
  name,
  resetUrl,
  expiresIn,
  ipAddress
}: PasswordResetEmailProps) {
  // Security-focused template
  // Reset link with expiry
  // IP address for transparency
  // "Didn't request this?" section
}
```

## Data Models

The system uses existing Prisma models with some enhancements:

### User Model (Better Auth)
```prisma
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  accounts      Account[]
  sessions      Session[]
  adminUser     AdminUser?
}
```

### Session Model
```prisma
model Session {
  id        String   @id @default(cuid())
  userId    String
  expiresAt DateTime
  token     String   @unique
  ipAddress String?
  userAgent String?
  user      User     @relation(fields: [userId])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Customer Model (Extended Profile)
```prisma
model Customer {
  id             String       @id @default(cuid())
  email          String       @unique
  firstName      String?
  lastName       String?
  loyaltyLevel   LoyaltyLevel @default(BRONZE)
  loyaltyPoints  Int          @default(0)
  // ... existing fields
}
```

### AdminUser Model
```prisma
model AdminUser {
  id          String    @id @default(cuid())
  email       String    @unique
  authUserId  String?   @unique
  authUser    User?     @relation(fields: [authUserId])
  firstName   String
  lastName    String
  role        Role      @default(VIEWER)
  permissions Json?
  isActive    Boolean   @default(true)
  lastLoginAt DateTime?
  // ... existing fields
}
```

### Password History (New Model)
```prisma
model PasswordHistory {
  id        String   @id @default(cuid())
  userId    String
  hash      String
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([createdAt])
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Registration creates valid customer records

*For any* valid registration data (email, password, name), when a user registers, the system should create a Customer record with a properly hashed password using bcrypt cost factor 12.

**Validates: Requirements 1.2, 10.4**

### Property 2: Duplicate email registration is rejected

*For any* existing user email, when attempting to register with that email, the system should reject the registration with an appropriate error message.

**Validates: Requirements 1.3**

### Property 3: Invalid passwords are rejected with specific errors

*For any* password that does not meet security requirements (8+ chars, uppercase, lowercase, number, special char), the system should reject it with validation errors specifying which requirements are not met.

**Validates: Requirements 1.4, 10.2**

### Property 4: Registration triggers verification email

*For any* successful registration, the system should send a verification email containing a unique token with 24-hour expiry stored in the Verification table.

**Validates: Requirements 1.5, 7.1, 7.2**

### Property 5: Valid verification tokens mark email as verified

*For any* valid verification token, when a user clicks the verification link, the system should update the User record to emailVerified=true and delete the verification token.

**Validates: Requirements 1.6, 7.3**

### Property 6: Registration rate limiting blocks excessive attempts

*For any* IP address, when more than 5 registration attempts occur within 15 minutes, the system should block the 6th and subsequent attempts with a rate limit error.

**Validates: Requirements 1.7, 8.2**

### Property 7: Valid credentials create authenticated sessions

*For any* valid user credentials, when logging in, the system should create a Session record with a unique token, set an HTTP-only secure cookie, and redirect appropriately.

**Validates: Requirements 2.2, 6.1**

### Property 8: Invalid credentials return generic error

*For any* invalid credential combination (wrong email or wrong password), the system should return the same generic error message "Invalid email or password" without revealing which field is incorrect.

**Validates: Requirements 2.3**

### Property 9: Remember me extends session expiry

*For any* login with "remember me" checked, the session expiry should be 30 days, while unchecked should result in 7 days expiry.

**Validates: Requirements 2.4**

### Property 10: Unverified email login prompts verification

*For any* user with emailVerified=false, when attempting to login, the system should display a verification prompt and offer to resend the verification email.

**Validates: Requirements 2.5**

### Property 11: Failed login attempts trigger account lockout

*For any* user account, when more than 5 failed login attempts occur within 15 minutes, the system should lock the account for 30 minutes and display the remaining lockout time on subsequent attempts.

**Validates: Requirements 2.6, 2.7, 8.2**

### Property 12: Successful login updates user metadata

*For any* successful login, the system should update the Customer record with the current timestamp in lastLoginAt and the request IP address.

**Validates: Requirements 2.8**

### Property 13: OAuth creates or links accounts correctly

*For any* OAuth callback with valid user data, if the email doesn't exist, the system should create a new Customer record; if it exists, the system should link the OAuth account to the existing Customer.

**Validates: Requirements 3.3, 3.4**

### Property 14: OAuth success creates session

*For any* successful OAuth authentication, the system should create a session and redirect to the intended destination.

**Validates: Requirements 3.5**

### Property 15: Password reset sends time-limited token

*For any* password reset request (regardless of email existence), the system should display a success message and send a reset email with a 1-hour token if the email exists.

**Validates: Requirements 4.2, 4.3**

### Property 16: Valid reset token allows password change

*For any* valid password reset token, when a user submits a new password meeting requirements, the system should update the password hash and invalidate all existing sessions except the current one.

**Validates: Requirements 4.5, 6.6**

### Property 17: Expired reset tokens are rejected

*For any* expired or invalid reset token, the system should display an error message and offer to send a new reset email.

**Validates: Requirements 4.6, 7.4**

### Property 18: Password reset rate limiting

*For any* user, when more than 3 password reset requests occur within 1 hour, the system should rate limit further requests.

**Validates: Requirements 4.7**

### Property 19: Unauthenticated admin access redirects to login

*For any* request to /admin/* without a valid admin session, the system should redirect to /admin/login.

**Validates: Requirements 5.1**

### Property 20: Inactive admin accounts cannot login

*For any* AdminUser with isActive=false, when attempting to login, the system should deny access with message "Account is deactivated".

**Validates: Requirements 5.4**

### Property 21: Admin session contains role information

*For any* successful admin authentication, the session should include the AdminUser's role and permissions.

**Validates: Requirements 5.3**

### Property 22: Sessions are cached in Redis

*For any* session retrieval, the system should check Redis cache first (5min TTL), and if not found, retrieve from database and cache it.

**Validates: Requirements 6.2, 6.3**

### Property 23: Sessions near expiry are auto-renewed

*For any* session within 24 hours of expiry, when accessed, the system should automatically extend the expiry by 7 days.

**Validates: Requirements 6.4**

### Property 24: Logout clears session from all stores

*For any* logout action, the system should delete the session from both the database and Redis cache.

**Validates: Requirements 6.5**

### Property 25: Invalid session tokens clear cookies

*For any* request with an invalid or expired session token, the system should clear the session cookie and treat the user as unauthenticated.

**Validates: Requirements 6.7**

### Property 26: Verification token resend invalidates old tokens

*For any* verification email resend request, the system should invalidate any existing verification tokens for that user and generate a new one.

**Validates: Requirements 7.5**

### Property 27: Email verification triggers welcome email

*For any* successful email verification, the system should send a welcome email with account setup tips.

**Validates: Requirements 7.7**

### Property 28: Failed login attempts are tracked in Redis

*For any* failed login attempt, the system should increment a counter in Redis with a 15-minute sliding window keyed by IP address.

**Validates: Requirements 8.1**

### Property 29: Registration from same IP requires CAPTCHA after limit

*For any* IP address that has created more than 3 accounts in 24 hours, subsequent registration attempts should require CAPTCHA verification.

**Validates: Requirements 8.3**

### Property 30: CSRF tokens are validated on form submissions

*For any* authentication form submission, the system should validate the CSRF token and reject requests with invalid or missing tokens.

**Validates: Requirements 8.4**

### Property 31: Session cookies have secure flags

*For any* session cookie set by the system, it should have HttpOnly=true, Secure=true (in production), and SameSite=Lax flags.

**Validates: Requirements 8.5**

### Property 32: New location login triggers security alert

*For any* login from a new IP address or location, the system should send a security alert email to the user with device and location details.

**Validates: Requirements 8.6, 9.5**

### Property 33: Reset tokens use cryptographically secure randomness

*For any* password reset or verification token generated, it should use cryptographically secure random values with at least 32 bytes of entropy.

**Validates: Requirements 8.7**

### Property 34: Selective session invalidation

*For any* user with multiple active sessions, when invalidating a specific session, only that session should be deleted while others remain active.

**Validates: Requirements 9.2**

### Property 35: Logout from all devices preserves current session

*For any* "logout from all devices" action, the system should invalidate all sessions except the current one.

**Validates: Requirements 9.3**

### Property 36: Sessions store device metadata

*For any* session created, the system should store the user agent and IP address for device identification.

**Validates: Requirements 9.4**

### Property 37: Breached passwords are rejected

*For any* password that appears in known data breach databases, the system should reject it with message "This password has been found in data breaches, please choose a different one".

**Validates: Requirements 10.3**

### Property 38: Password history prevents reuse

*For any* password change, the system should reject passwords that match any of the user's last 5 password hashes.

**Validates: Requirements 10.5**

### Property 39: Production SKIP_AUTH logs critical warning

*For any* production environment with SKIP_AUTH=true, the system should log a critical security warning and ignore the bypass.

**Validates: Requirements 5.7**

## Error Handling

### Error Categories

1. **Validation Errors** (400 Bad Request)
   - Invalid email format
   - Password doesn't meet requirements
   - Missing required fields
   - CSRF token invalid

2. **Authentication Errors** (401 Unauthorized)
   - Invalid credentials
   - Session expired
   - Email not verified
   - Account locked

3. **Authorization Errors** (403 Forbidden)
   - Insufficient permissions
   - Account deactivated
   - Admin access required

4. **Rate Limit Errors** (429 Too Many Requests)
   - Too many login attempts
   - Too many registration attempts
   - Too many password reset requests

5. **Server Errors** (500 Internal Server Error)
   - Database connection failed
   - Email service unavailable
   - Redis cache unavailable

### Error Response Format

```typescript
interface AuthError {
  error: string
  message: string
  code: string
  details?: Record<string, string[]>
  retryAfter?: number // For rate limit errors
}
```

### Error Handling Strategy

1. **Client-Side Validation**
   - Real-time form validation with Zod
   - Display field-level errors immediately
   - Prevent submission of invalid data

2. **Server-Side Validation**
   - Always validate on server (never trust client)
   - Return structured error responses
   - Log security-relevant errors

3. **User-Friendly Messages**
   - Generic messages for security (e.g., "Invalid email or password")
   - Specific messages for validation (e.g., "Password must contain...")
   - Helpful guidance for resolution

4. **Error Recovery**
   - Offer to resend verification email
   - Provide password reset link
   - Display remaining lockout time

## Testing Strategy

### Unit Testing

**Framework**: Jest + React Testing Library

**Coverage Areas**:
1. Form validation logic
2. Password strength validation
3. Token generation and validation
4. Session management utilities
5. Rate limiting logic
6. Email template rendering

**Example Unit Tests**:
- Test password validation rejects weak passwords
- Test email format validation
- Test token expiry calculation
- Test session cache hit/miss logic
- Test rate limit counter increment

### Property-Based Testing

**Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Each property test should run a minimum of 100 iterations

**Test Tagging**: Each property-based test must include a comment with the format:
`// Feature: authentication-system, Property {number}: {property_text}`

**Coverage Areas**:
1. Registration with random valid user data
2. Login with various credential combinations
3. Password validation with generated passwords
4. Session token uniqueness
5. Rate limiting with random attempt patterns
6. Token expiry edge cases

**Example Property Tests**:
```typescript
// Feature: authentication-system, Property 1: Registration creates valid customer records
test('registration creates customer with hashed password', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        email: fc.emailAddress(),
        password: fc.string({ minLength: 8 }),
        firstName: fc.string({ minLength: 1 }),
        lastName: fc.string({ minLength: 1 })
      }),
      async (userData) => {
        const result = await registerUser(userData)
        expect(result.customer).toBeDefined()
        expect(result.customer.email).toBe(userData.email)
        expect(await bcrypt.compare(userData.password, result.passwordHash)).toBe(true)
      }
    ),
    { numRuns: 100 }
  )
})
```

### Integration Testing

**Framework**: Playwright

**Coverage Areas**:
1. Complete registration flow (form → email → verification)
2. Login flow with redirect
3. Password reset flow
4. OAuth flow (mocked)
5. Admin login flow
6. Session persistence across page refreshes
7. Rate limiting behavior

**Example Integration Tests**:
- User registers, receives email, verifies, and logs in
- User forgets password, resets it, and logs in with new password
- User attempts 6 logins with wrong password and gets locked out
- Admin logs in and accesses protected admin pages

### Security Testing

**Areas to Test**:
1. CSRF protection
2. SQL injection attempts
3. XSS attempts in form inputs
4. Session fixation attacks
5. Brute force protection
6. Token tampering

## Performance Considerations

### Session Caching Strategy

1. **Redis Cache Layer**
   - Cache sessions with 5-minute TTL
   - Reduce database load for frequent session checks
   - Use Redis for rate limiting counters

2. **Cache Invalidation**
   - Invalidate on logout
   - Invalidate on password change
   - Invalidate on permission changes

### Database Optimization

1. **Indexes**
   - Index on User.email (unique)
   - Index on Session.token (unique)
   - Index on Session.userId
   - Index on Verification.identifier + value
   - Index on PasswordHistory.userId + createdAt

2. **Query Optimization**
   - Use select to limit fields
   - Avoid N+1 queries with includes
   - Batch session lookups where possible

### Email Sending

1. **Async Processing**
   - Send emails asynchronously (don't block response)
   - Use background job queue for reliability
   - Implement retry logic for failures

2. **Rate Limiting**
   - Limit verification email resends (1 per 5 minutes)
   - Limit password reset emails (3 per hour)

## Security Considerations

### Password Security

1. **Hashing**: bcrypt with cost factor 12
2. **Breach Detection**: Check against Have I Been Pwned API
3. **History**: Store last 5 password hashes
4. **Strength Requirements**: 8+ chars, mixed case, numbers, special chars

### Session Security

1. **Token Generation**: Cryptographically secure random (32 bytes)
2. **Cookie Flags**: HttpOnly, Secure (prod), SameSite=Lax
3. **Expiry**: 7 days default, 30 days with "remember me"
4. **Renewal**: Auto-extend when within 24h of expiry

### Rate Limiting

1. **Login**: 5 attempts per 15 minutes per IP
2. **Registration**: 5 attempts per 15 minutes per IP
3. **Password Reset**: 3 requests per hour per user
4. **Verification Email**: 1 resend per 5 minutes per user

### CSRF Protection

1. **Token Generation**: Unique per session
2. **Validation**: Required for all state-changing operations
3. **Expiry**: Tied to session expiry

### Audit Logging

Log the following events:
- Successful login (user, IP, timestamp)
- Failed login (email, IP, timestamp)
- Account lockout (user, IP, timestamp)
- Password change (user, IP, timestamp)
- Email verification (user, timestamp)
- Admin login (admin, IP, timestamp)
- Permission changes (admin, target user, timestamp)

## Deployment Considerations

### Environment Variables

Required:
- `BETTER_AUTH_SECRET` - 32+ character secret
- `BETTER_AUTH_URL` - Full base URL
- `PRISMA_DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `RESEND_API_KEY` - Email service API key

Optional:
- `GOOGLE_CLIENT_ID` - For OAuth
- `GOOGLE_CLIENT_SECRET` - For OAuth
- `SKIP_AUTH` - NEVER set to true in production

### Database Migrations

1. Add PasswordHistory table
2. Add indexes for performance
3. Ensure Better Auth tables exist (User, Session, Account, Verification)

### Redis Setup

1. Configure persistence for rate limit data
2. Set appropriate memory limits
3. Configure eviction policy (allkeys-lru)

### Monitoring

1. **Metrics to Track**
   - Login success/failure rate
   - Registration rate
   - Password reset requests
   - Account lockouts
   - Session creation rate
   - Email delivery rate

2. **Alerts**
   - High failed login rate (potential attack)
   - Email service failures
   - Redis connection failures
   - Database connection failures
   - SKIP_AUTH enabled in production

## Migration from Current State

### Phase 1: Backend Setup
1. Add PasswordHistory model to Prisma schema
2. Run database migration
3. Configure Better Auth with email verification enabled
4. Implement rate limiting middleware
5. Add CSRF protection

### Phase 2: Frontend Pages
1. Create login page
2. Create registration page
3. Create forgot password page
4. Create reset password page
5. Create email verification handler
6. Create admin login page

### Phase 3: Integration
1. Update middleware to use real auth (remove SKIP_AUTH)
2. Connect Refine admin to auth provider
3. Add session management UI to account page
4. Implement email templates

### Phase 4: Testing & Security
1. Write unit tests
2. Write property-based tests
3. Write integration tests
4. Security audit
5. Performance testing

### Phase 5: Deployment
1. Set production environment variables
2. Run database migrations
3. Deploy to staging
4. User acceptance testing
5. Deploy to production
6. Monitor metrics
