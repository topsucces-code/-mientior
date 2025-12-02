# Implementation Plan - Authentication System

- [x] 1. Database schema and infrastructure setup
  - Add PasswordHistory model to Prisma schema for password reuse prevention
  - Create and run database migration to add new table and indexes
  - Configure Better Auth to enable email verification (requireEmailVerification: true)
  - Set up Redis connection for rate limiting and session caching
  - _Requirements: 1.2, 6.1, 10.5_

- [x] 1.1 Write property test for password history
  - **Property 38: Password history prevents reuse**
  - **Validates: Requirements 10.5**

- [x] 2. Core authentication utilities and middleware
  - Implement enhanced getSession() with Redis caching (5min TTL)
  - Implement requireAuth() with email verification check
  - Implement getAdminSession() with role/permission loading
  - Implement requireAdminAuth() with permission checking
  - _Requirements: 5.2, 5.3, 6.2, 6.3_

- [x] 2.1 Write property test for session caching
  - **Property 22: Sessions are cached in Redis**
  - **Validates: Requirements 6.2, 6.3**

- [x] 3. Rate limiting middleware
  - Create rate limiting utility using Redis with sliding window algorithm
  - Implement login rate limiting (5 attempts per 15 minutes per IP)
  - Implement registration rate limiting (5 attempts per 15 minutes per IP)
  - Implement password reset rate limiting (3 requests per hour per user)
  - Add rate limit error responses with retryAfter header
  - _Requirements: 1.7, 2.6, 4.7, 8.1, 8.2_

- [x] 3.1 Write property test for login rate limiting
  - **Property 11: Failed login attempts trigger account lockout**
  - **Validates: Requirements 2.6, 2.7, 8.2**

- [x] 3.2 Write property test for registration rate limiting
  - **Property 6: Registration rate limiting blocks excessive attempts**
  - **Validates: Requirements 1.7, 8.2**

- [x] 3.3 Write property test for password reset rate limiting
  - **Property 18: Password reset rate limiting**
  - **Validates: Requirements 4.7**

- [x] 4. Password validation and security
  - Create password validation utility with Zod schema (8+ chars, mixed case, numbers, special chars)
  - Implement password strength checker with real-time feedback
  - Integrate Have I Been Pwned API for breach detection
  - Implement bcrypt hashing with cost factor 12
  - Create password history tracking (store last 5 hashes)
  - _Requirements: 1.4, 10.2, 10.3, 10.4, 10.5_

- [x] 4.1 Write property test for password validation
  - **Property 3: Invalid passwords are rejected with specific errors**
  - **Validates: Requirements 1.4, 10.2**

- [x] 4.2 Write property test for password hashing
  - **Property 1: Registration creates valid customer records**
  - **Validates: Requirements 1.2, 10.4**

- [x] 4.3 Write property test for breached password detection
  - **Property 37: Breached passwords are rejected**
  - **Validates: Requirements 10.3**

- [x] 5. Email service and templates
  - Set up Resend email client with error handling and retry logic
  - Create verification email template with branded design
  - Create password reset email template with security information
  - Create welcome email template with onboarding tips
  - Create security alert email template for new device logins
  - Implement async email sending with background queue
  - _Requirements: 1.5, 4.2, 7.2, 7.7, 8.6_

- [x] 5.1 Write unit tests for email templates
  - Test verification email renders correctly with token
  - Test password reset email includes expiry and IP address
  - Test welcome email includes user name
  - Test security alert email includes device details
  - _Requirements: 1.5, 4.2, 7.2, 7.7, 8.6_

- [x] 6. Registration page and flow (UI exists, needs backend integration)
  - Create /register page with form (email, password, passwordConfirm, firstName, lastName, terms)
  - Implement real-time password validation with visual indicators
  - Add form submission with Better Auth signUp API
  - Handle duplicate email error display
  - Implement success state with email verification prompt
  - Generate and store verification token (24-hour expiry)
  - Send verification email via Resend
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 6.1 Enhance registration form with password strength indicator
  - Create PasswordStrengthIndicator component with visual feedback
    - Show progress bar (red/yellow/green) based on password strength
    - Display checkmarks for each requirement met (8+ chars, uppercase, lowercase, number, special char)
    - Show real-time validation as user types
  - Integrate password breach detection using Have I Been Pwned API
    - Call API on password blur or form submission
    - Display warning if password found in breach database
    - Prevent form submission if breached password detected
  - Add password history check (prevent reuse of last 5 passwords)
    - Query PasswordHistory table for user's previous passwords
    - Compare new password hash against stored hashes
    - Display error if password matches any of last 5
  - Update AuthForm component to include PasswordStrengthIndicator
  - Display specific validation errors below password field
  - _Requirements: 1.4, 10.2, 10.3, 10.5_

- [x] 6.2 Implement registration backend integration
  - Update Better Auth signUp handler to include custom logic
    - After successful Better Auth registration, generate verification token
    - Use crypto.randomBytes(32) for cryptographically secure token
    - Store token in Verification table with identifier=email, expiresAt=now+24h
  - Create email verification token generation utility
    - Function: generateVerificationToken(email: string): Promise<string>
    - Store in Verification table with 24-hour expiry
    - Return token for email link
  - Send verification email via Resend
    - Use VerificationEmail template from src/lib/email/templates
    - Include verification link: {baseURL}/verify-email?token={token}
    - Include user's name and expiry time (24 hours)
  - Handle duplicate email error
    - Catch Prisma unique constraint error
    - Return user-friendly message: "An account with this email already exists"
    - Suggest login or password reset
  - Implement success state in AuthForm
    - Show success message: "Account created! Please check your email to verify your account."
    - Display email address where verification was sent
    - Add "Resend verification email" button
  - _Requirements: 1.2, 1.3, 1.5, 7.1, 7.2_

- [x] 7. Email verification handler
  - Create /verify-email page component
    - Accept token query parameter from URL
    - Show loading state while validating token
    - Display success or error state based on validation result
  - Create API endpoint: POST /api/auth/verify-email
    - Accept token in request body
    - Query Verification table for matching token
    - Check if token exists and is not expired (expiresAt > now)
    - If valid:
      - Update better_auth_users.emailVerified = true
      - Delete verification token from Verification table
      - Send welcome email via Resend using WelcomeEmail template
      - Return success response
    - If expired:
      - Return error with message: "Verification link has expired"
      - Include option to resend verification email
    - If invalid:
      - Return error with message: "Invalid verification link"
  - Implement verification email resend endpoint: POST /api/auth/resend-verification
    - Accept email in request body
    - Check if user exists and email is not already verified
    - Invalidate any existing verification tokens for this email
    - Generate new verification token (24-hour expiry)
    - Send new verification email via Resend
    - Apply rate limiting (1 resend per 5 minutes per email)
    - Return success message (always, to prevent email enumeration)
  - Update /verify-email page to handle all states:
    - Loading: "Verifying your email..."
    - Success: "Email verified! Redirecting to login..." (auto-redirect after 2s)
    - Expired: "Link expired. Click here to resend verification email."
    - Invalid: "Invalid link. Please try registering again."
  - _Requirements: 1.6, 7.3, 7.4, 7.5, 7.7_

- [x] 8. Login page and flow (UI exists, needs backend enhancements)
  - Create /login page with form (email, password, rememberMe checkbox)
  - Implement form submission with Better Auth signIn API
  - Handle invalid credentials with generic error message
  - Check email verification status and show prompt if unverified
  - Implement "remember me" functionality (30-day vs 7-day session)
  - Handle account lockout display with remaining time
  - Update Customer lastLoginAt and IP address on success
  - Redirect to intended destination or homepage
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 2.8_

- [x] 8.1 Add "remember me" checkbox to login form
  - Add checkbox to AuthForm component (login mode only)
    - Label: "Keep me signed in for 30 days"
    - Default: unchecked (7-day session)
  - Update form state to track rememberMe value
  - Pass rememberMe flag to Better Auth signIn API
    - Modify signIn call to include rememberMe option
    - Better Auth should handle session expiry automatically
  - Configure Better Auth session expiry
    - Default: 7 days (604800 seconds)
    - With rememberMe: 30 days (2592000 seconds)
    - Update auth.ts config if needed
  - Test both scenarios:
    - Login without remember me → session expires in 7 days
    - Login with remember me → session expires in 30 days
  - _Requirements: 2.4_

- [x] 8.2 Implement email verification check on login
  - After successful Better Auth signIn, check emailVerified status
    - Query better_auth_users table for user's emailVerified field
    - If false, prevent full login and show verification prompt
  - Create EmailVerificationPrompt component
    - Display message: "Please verify your email to continue"
    - Show email address where verification was sent
    - Add "Resend verification email" button
    - Add "Use a different email" link (back to login)
  - Implement resend verification logic
    - Call POST /api/auth/resend-verification endpoint
    - Show success message: "Verification email sent!"
    - Disable button for 60 seconds after sending
  - Update middleware to check emailVerified for protected routes
    - In requireAuth(), check session.user.emailVerified
    - If false, redirect to /verify-email-prompt page
    - Allow access to /verify-email and /resend-verification
  - Create /verify-email-prompt page
    - Show EmailVerificationPrompt component
    - Allow user to resend verification or logout
  - _Requirements: 2.5_

- [x] 8.3 Implement account lockout handling
  - Create lockout check in login flow
    - Before calling Better Auth signIn, check Redis for lockout
    - Key: `auth:lockout:${email}`
    - If locked, return error with remaining time
  - Display lockout message in AuthForm
    - Show error: "Account temporarily locked due to too many failed attempts"
    - Display countdown timer: "Try again in X minutes Y seconds"
    - Update timer every second using useEffect
  - Implement lockout logic in rate limiting
    - After 5 failed login attempts within 15 minutes:
      - Set Redis key: `auth:lockout:${email}` with 30-minute TTL
      - Store lockout expiry timestamp
    - On successful login, clear lockout key
  - Create countdown timer component
    - Calculate remaining time from lockout expiry
    - Display in format: "5 minutes 23 seconds"
    - Auto-refresh login form when timer reaches 0
  - _Requirements: 2.6, 2.7_

- [x] 8.4 Update user metadata on successful login
  - Create login metadata update utility
    - Function: updateLoginMetadata(userId: string, request: Request)
    - Extract IP address from request headers:
      - Check x-forwarded-for header (proxy/load balancer)
      - Fallback to x-real-ip header
      - Fallback to request.ip
    - Extract user agent from request headers
  - Update User table on successful login
    - Update better_auth_users.updatedAt to current timestamp
    - Note: Better Auth doesn't have lastLoginAt by default
    - Consider adding custom field or using updatedAt
  - Update Session table with device info
    - Store ipAddress in Session.ipAddress field
    - Store userAgent in Session.userAgent field
    - This data is used for multi-device session management
  - Call updateLoginMetadata after Better Auth signIn
    - Hook into Better Auth's onSuccess callback
    - Or create custom API endpoint wrapper
  - Test metadata storage
    - Verify IP address is stored correctly
    - Verify user agent is stored correctly
    - Check Session table has device info
  - _Requirements: 2.8, 9.4_

- [x] 9. OAuth social login (Google) - Already configured in Better Auth
  - Configure Google OAuth credentials in Better Auth
  - Add "Continue with Google" button to login and register pages
  - Implement OAuth callback handler
  - Create new Customer record for first-time OAuth users
  - Link OAuth account to existing Customer if email matches
  - Create session after successful OAuth
  - Handle OAuth errors and cancellation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 9.1 Add Google OAuth button to login and register pages
  - Uncomment and enable Google OAuth button in auth-form.tsx
  - Add proper styling and branding for Google button
  - Implement OAuth flow using Better Auth client methods
  - Handle OAuth callback and redirect
  - _Requirements: 3.1, 3.2, 3.5_

- [x] 9.2 Implement OAuth account linking logic
  - Check if email from OAuth already exists in User table
  - Link OAuth account to existing user if email matches
  - Create new User and Customer records for first-time OAuth users
  - Handle OAuth errors and display user-friendly messages
  - _Requirements: 3.3, 3.4, 3.6_

- [x] 10. Forgot password page and flow (UI exists, needs backend integration)
  - Create /forgot-password page with email input form
  - Implement form submission to password reset API
  - Always show success message (prevent email enumeration)
  - Generate cryptographically secure reset token (32 bytes, 1-hour expiry)
  - Store token in Verification table
  - Send password reset email with token link
  - _Requirements: 4.1, 4.2, 4.3, 8.7_

- [x] 10.1 Implement password reset request API endpoint
  - Create /api/auth/forgot-password endpoint
  - Generate cryptographically secure reset token (32 bytes)
  - Store token in Verification table with 1-hour expiry
  - Send password reset email via Resend with branded template
  - Always return success message (prevent email enumeration)
  - Apply rate limiting (3 requests per hour per user)
  - _Requirements: 4.1, 4.2, 4.3, 4.7, 8.7_

- [x] 10.2 Connect forgot password form to API
  - Update ForgotPasswordForm to call /api/auth/forgot-password
  - Handle API errors gracefully
  - Display success message after submission
  - _Requirements: 4.1, 4.2_

- [x] 11. Reset password page and flow (UI exists, needs backend integration)
  - Create /reset-password page that accepts token query parameter
  - Validate token on page load
  - Display password reset form with strength indicator
  - Validate new password meets requirements
  - Check password against breach database
  - Check password against last 5 password hashes
  - Update password hash with bcrypt cost 12
  - Store old hash in PasswordHistory
  - Invalidate all sessions except current one
  - Redirect to login page with success message
  - _Requirements: 4.4, 4.5, 4.6, 6.6, 10.2, 10.3, 10.4, 10.5_

- [x] 11.1 Implement password reset completion API endpoint
  - Create /api/auth/reset-password endpoint
  - Validate reset token from Verification table
  - Check token expiry (1 hour)
  - Validate new password meets all requirements (8+ chars, mixed case, numbers, special chars)
  - Check password against Have I Been Pwned API
  - Check password against last 5 password hashes in PasswordHistory
  - Update password hash with bcrypt cost 12
  - Store old hash in PasswordHistory table
  - Invalidate all sessions except current one
  - Delete used reset token
  - _Requirements: 4.4, 4.5, 4.6, 6.6, 10.2, 10.3, 10.4, 10.5_

- [x] 11.2 Add password strength indicator to reset form
  - Add real-time password validation feedback
  - Display visual indicators for each requirement
  - Show password strength meter
  - _Requirements: 10.2_

- [x] 11.3 Connect reset password form to API
  - Update ResetPasswordForm to call /api/auth/reset-password
  - Handle token validation errors
  - Display success message and redirect to login
  - _Requirements: 4.5, 4.6_

- [x] 12. Admin login page and authentication
  - Create /admin/login page with admin-specific styling
  - Implement admin login form (email, password)
  - Verify AdminUser record exists and isActive=true
  - Create session with admin role and permissions
  - Redirect to admin dashboard on success
  - Handle inactive admin account error
  - Update AdminUser lastLoginAt on success
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_

- [x] 12.1 Create admin login page
  - Create /admin/login page with admin-specific styling
  - Implement admin login form (email, password)
  - Add Better Auth signIn integration
  - Redirect to /admin dashboard on success
  - _Requirements: 5.1, 5.2_

- [x] 12.2 Implement admin authentication logic
  - Verify AdminUser record exists after Better Auth login
  - Check AdminUser.isActive=true
  - Load admin role and permissions into session
  - Update AdminUser.lastLoginAt timestamp
  - Handle inactive admin account with appropriate error message
  - _Requirements: 5.2, 5.3, 5.4, 5.6_

- [x] 13. Admin authentication middleware (Already implemented)
  - Update middleware to check admin session for /admin/* routes
  - Redirect unauthenticated admin requests to /admin/login
  - Implement permission checking for specific admin actions
  - Add SKIP_AUTH production warning (log critical error if enabled)
  - Remove SKIP_AUTH bypass from production builds
  - _Requirements: 5.1, 5.7_

- [x] 13.1 Add admin route protection to middleware
  - Update middleware.ts to protect /admin/* routes
  - Redirect unauthenticated requests to /admin/login
  - Check AdminUser.isActive status
  - _Requirements: 5.1_

- [x] 13.2 Update Refine auth provider
  - Update authProvider in src/providers/auth-provider.ts
  - Implement proper check() method for admin authentication
  - Implement getIdentity() to return admin user info
  - Handle logout and redirect to /admin/login
  - _Requirements: 5.1, 5.2_

- [x] 14. Session management and renewal (Core functionality implemented)
  - Implement session auto-renewal (extend by 7 days when within 24h of expiry)
  - Implement logout functionality (delete from DB and Redis)
  - Implement session invalidation on password change (except current)
  - Handle invalid/expired session tokens (clear cookie, treat as unauthenticated)
  - _Requirements: 6.4, 6.5, 6.6, 6.7_

- [x] 14.1 Implement session auto-renewal logic
  - Check session expiry on each request
  - Extend session by 7 days if within 24 hours of expiry
  - Update both database and Redis cache
  - _Requirements: 6.4_

- [x] 14.2 Implement session invalidation on password change
  - When password is changed, invalidate all sessions except current
  - Clear sessions from both database and Redis
  - _Requirements: 6.6_

- [x] 15. Multi-device session management UI
  - Create account security settings page at /account/security
  - Display list of active sessions with device info, location, last activity
  - Implement "Log out from this device" button (invalidate specific session)
  - Implement "Log out from all devices" button (invalidate all except current)
  - Store user agent and IP address in session records
  - Send email notification on new device login
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 15.1 Create session management API endpoints
  - Create GET /api/user/sessions to list all active sessions
  - Create DELETE /api/user/sessions/:id to invalidate specific session
  - Create DELETE /api/user/sessions/all to invalidate all sessions except current
  - Include device info (user agent, IP, location) in session data
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 15.2 Create account security settings page
  - Create /account/security page component
  - Display list of active sessions with device info
  - Add "Log out from this device" button for each session
  - Add "Log out from all devices" button
  - Show current session indicator
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 15.3 Implement new device login detection
  - Track user's known IP addresses and user agents
  - Detect login from new device or location
  - Send security alert email via Resend
  - Include device details in email
  - _Requirements: 8.6, 9.5_

- [x] 16. CSRF protection (Already configured in Better Auth)
  - Enable CSRF protection in Better Auth for production
  - Generate CSRF tokens for all authentication forms
  - Validate CSRF tokens on all state-changing operations
  - Return 403 error for invalid CSRF tokens
  - _Requirements: 8.4_

- [x] 16.1 Enable CSRF protection for production
  - Update Better Auth config to enable CSRF in production
  - Ensure disableCSRFCheck is only true in development
  - _Requirements: 8.4_

- [x] 17. Security enhancements
  - Implement secure cookie flags (HttpOnly, Secure in prod, SameSite=Lax)
  - Add security alert email for suspicious activity
  - Implement audit logging for auth events (login, logout, password change, etc.)
  - Add CAPTCHA requirement for high-frequency registration IPs
  - _Requirements: 8.3, 8.5, 8.6_

- [x] 17.1 Verify secure cookie configuration
  - Ensure Better Auth uses HttpOnly, Secure (in prod), and SameSite=Lax flags
  - Test cookie security in production environment
  - _Requirements: 8.5_

- [x] 17.2 Implement CAPTCHA for high-frequency registrations
  - Track registration attempts per IP in Redis (24-hour window)
  - Require CAPTCHA after 3 registrations from same IP
  - Integrate CAPTCHA service (e.g., hCaptcha or reCAPTCHA)
  - _Requirements: 8.3_

- [x] 17.3 Implement audit logging for auth events
  - Log successful logins with user, IP, timestamp
  - Log failed login attempts with email, IP, timestamp
  - Log password changes with user, IP, timestamp
  - Log email verifications with user, timestamp
  - Log admin logins with admin, IP, timestamp
  - Use existing audit logging infrastructure
  - _Requirements: 8.1, 8.6_

- [x] 18. Integration with existing middleware (Already implemented)
  - Update src/middleware.ts to use real authentication (remove SKIP_AUTH checks)
  - Protect /account/* routes with requireAuth()
  - Protect /checkout/* routes with requireAuth()
  - Add redirect to login with ?next= parameter for unauthenticated access
  - _Requirements: 2.2, 5.1_

- [x] 19. Refine admin panel authentication
  - Create Better Auth provider for Refine
  - Implement authProvider with login, logout, check, getPermissions methods
  - Connect Refine to admin authentication
  - Remove SKIP_AUTH bypass from admin layout
  - Add permission checks to admin resources
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 19.1 Update Refine auth provider for admin authentication
  - Update authProvider to check for AdminUser record
  - Implement getPermissions() to return admin role and permissions
  - Update check() to verify AdminUser.isActive status
  - Redirect to /admin/login for unauthenticated requests
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 20. Checkpoint - Ensure all tests pass
  - Run all unit tests and property-based tests
  - Fix any failing tests
  - Ensure all core authentication flows work correctly
  - Ask the user if questions arise

- [ ] 21. Integration tests with Playwright
  - Set up Playwright testing framework
  - Test complete registration flow (form → email → verification → login)
  - Test login flow with redirect to intended destination
  - Test password reset flow (request → email → reset → login)
  - Test OAuth flow with mocked Google provider
  - Test admin login and access to protected pages
  - Test session persistence across page refreshes
  - Test rate limiting behavior (lockout after 5 failed attempts)
  - Test multi-device session management
  - _Requirements: All_

- [ ] 22. Security testing
  - Test CSRF protection (reject requests without valid token)
  - Test SQL injection attempts in login/register forms
  - Test XSS attempts in form inputs
  - Test session fixation attack prevention
  - Test brute force protection (rate limiting)
  - Test token tampering (expired, invalid, modified tokens)
  - _Requirements: 8.4, 8.5_

- [ ] 23. Documentation and deployment preparation
  - Update README with authentication setup instructions
  - Document environment variables required
  - Create database migration guide
  - Add monitoring and alerting recommendations
  - Document password reset and email verification flows
  - Create admin user setup guide
  - _Requirements: All_

- [ ] 24. Final checkpoint - Production readiness
  - Run all tests one final time
  - Verify all authentication flows in staging environment
  - Check security configurations
  - Ensure all tests pass, ask the user if questions arise
