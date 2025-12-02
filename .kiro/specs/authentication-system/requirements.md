# Requirements Document - Authentication System

## Introduction

This document specifies the requirements for implementing a complete authentication system for the Mientior e-commerce marketplace. The system will provide secure user authentication, registration, password recovery, and session management for both customers and admin users. Currently, the backend authentication infrastructure (Better Auth) is configured, but no frontend UI exists, and admin authentication is bypassed in development mode (SKIP_AUTH=true), creating a critical security vulnerability.

## Glossary

- **Authentication System**: The complete set of components that verify user identity and manage access to the platform
- **Better Auth**: The authentication library used for backend session management and credential verification
- **Customer**: A regular user who browses products, makes purchases, and manages their account
- **Admin User**: A privileged user with access to the admin panel and specific permissions based on their role
- **Session**: A temporary authenticated state that persists user login across requests
- **Credential**: User identification information (email/password or OAuth tokens)
- **OAuth Provider**: External authentication service (Google, Facebook, etc.)
- **Two-Factor Authentication (2FA)**: Additional security layer requiring a second verification method
- **Password Reset Token**: A time-limited, single-use token sent via email for password recovery
- **Email Verification**: Process of confirming user email ownership through a verification link
- **Rate Limiting**: Security mechanism that restricts the number of authentication attempts
- **CSRF Token**: Cross-Site Request Forgery protection token for form submissions
- **Session Cookie**: HTTP-only cookie storing the encrypted session identifier
- **Redis Cache**: In-memory data store used for session caching and rate limiting

## Requirements

### Requirement 1: User Registration

**User Story:** As a new customer, I want to create an account with my email and password, so that I can make purchases and track my orders.

#### Acceptance Criteria

1. WHEN a user visits the registration page THEN the Authentication System SHALL display a form with email, password, password confirmation, first name, last name, and terms acceptance fields
2. WHEN a user submits the registration form with valid data THEN the Authentication System SHALL create a new Customer record in the database with hashed password
3. WHEN a user submits the registration form with an email that already exists THEN the Authentication System SHALL display an error message indicating the email is already registered
4. WHEN a user submits a password that does not meet security requirements THEN the Authentication System SHALL display validation errors specifying minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character
5. WHEN a user successfully registers THEN the Authentication System SHALL send a verification email with a time-limited token valid for 24 hours
6. WHEN a user clicks the verification link in their email THEN the Authentication System SHALL mark the email as verified and redirect to the login page
7. WHEN a user attempts to register from the same IP address more than 5 times within 15 minutes THEN the Authentication System SHALL block further attempts and display a rate limit error

### Requirement 2: User Login

**User Story:** As a registered customer, I want to log in with my email and password, so that I can access my account and make purchases.

#### Acceptance Criteria

1. WHEN a user visits the login page THEN the Authentication System SHALL display a form with email, password, and "remember me" checkbox fields
2. WHEN a user submits valid credentials THEN the Authentication System SHALL create a session, set a secure HTTP-only cookie, and redirect to the intended destination or homepage
3. WHEN a user submits invalid credentials THEN the Authentication System SHALL display a generic error message "Invalid email or password" without revealing which field is incorrect
4. WHEN a user checks "remember me" THEN the Authentication System SHALL extend the session expiry to 30 days instead of the default 7 days
5. WHEN a user attempts to login with an unverified email THEN the Authentication System SHALL display a message prompting email verification and offer to resend the verification email
6. WHEN a user attempts to login more than 5 times with incorrect credentials within 15 minutes THEN the Authentication System SHALL temporarily lock the account for 30 minutes
7. WHEN a locked user attempts to login THEN the Authentication System SHALL display the remaining lockout time
8. WHEN a user successfully logs in THEN the Authentication System SHALL update the Customer record with last login timestamp and IP address

### Requirement 3: OAuth Social Login

**User Story:** As a new or existing customer, I want to sign in with my Google account, so that I can quickly access the platform without creating a new password.

#### Acceptance Criteria

1. WHEN a user clicks the "Continue with Google" button THEN the Authentication System SHALL redirect to Google OAuth consent screen
2. WHEN a user authorizes the application via Google THEN the Authentication System SHALL receive the OAuth token and user profile information
3. WHEN a user completes Google OAuth for the first time THEN the Authentication System SHALL create a new Customer record with email, name, and profile image from Google
4. WHEN a user completes Google OAuth with an email that already exists THEN the Authentication System SHALL link the Google account to the existing Customer record
5. WHEN a user completes Google OAuth successfully THEN the Authentication System SHALL create a session and redirect to the intended destination
6. WHEN Google OAuth fails or is cancelled THEN the Authentication System SHALL redirect to the login page with an error message

### Requirement 4: Password Recovery

**User Story:** As a customer who forgot my password, I want to reset it via email, so that I can regain access to my account.

#### Acceptance Criteria

1. WHEN a user clicks "Forgot password" on the login page THEN the Authentication System SHALL display a password reset request form with an email field
2. WHEN a user submits a valid email address THEN the Authentication System SHALL send a password reset email with a time-limited token valid for 1 hour
3. WHEN a user submits an email that does not exist in the database THEN the Authentication System SHALL display the same success message as for valid emails to prevent email enumeration
4. WHEN a user clicks the reset link in their email THEN the Authentication System SHALL validate the token and display a password reset form if valid
5. WHEN a user submits a new password that meets security requirements THEN the Authentication System SHALL update the password hash and invalidate all existing sessions for that user
6. WHEN a user attempts to use an expired or invalid reset token THEN the Authentication System SHALL display an error message and offer to send a new reset email
7. WHEN a user requests more than 3 password resets within 1 hour THEN the Authentication System SHALL rate limit further requests

### Requirement 5: Admin Authentication

**User Story:** As an admin user, I want to log in to the admin panel with my credentials, so that I can manage the platform securely.

#### Acceptance Criteria

1. WHEN an admin user visits /admin without a valid session THEN the Authentication System SHALL redirect to the admin login page at /admin/login
2. WHEN an admin user submits valid credentials on the admin login page THEN the Authentication System SHALL verify the AdminUser record exists and is active
3. WHEN an admin user successfully authenticates THEN the Authentication System SHALL create a session with admin role information and redirect to the admin dashboard
4. WHEN an admin user with isActive=false attempts to login THEN the Authentication System SHALL deny access with message "Account is deactivated"
5. WHEN an admin user session expires THEN the Authentication System SHALL redirect to the admin login page with a message "Session expired, please login again"
6. WHEN an admin user logs out THEN the Authentication System SHALL invalidate the session, clear the session cookie, and redirect to the admin login page
7. WHEN the SKIP_AUTH environment variable is set to true in production THEN the Authentication System SHALL log a critical security warning and ignore the bypass

### Requirement 6: Session Management

**User Story:** As a logged-in user, I want my session to persist across page refreshes and browser tabs, so that I don't have to log in repeatedly.

#### Acceptance Criteria

1. WHEN a user successfully authenticates THEN the Authentication System SHALL create a session record in the database with a unique token
2. WHEN a user makes a request with a valid session cookie THEN the Authentication System SHALL retrieve the session from Redis cache if available, otherwise from the database
3. WHEN a session is retrieved from the database THEN the Authentication System SHALL cache it in Redis with a TTL of 5 minutes
4. WHEN a user's session is within 24 hours of expiry THEN the Authentication System SHALL automatically extend the session by 7 days
5. WHEN a user logs out THEN the Authentication System SHALL delete the session from both database and Redis cache
6. WHEN a user changes their password THEN the Authentication System SHALL invalidate all existing sessions except the current one
7. WHEN a session token is invalid or expired THEN the Authentication System SHALL clear the session cookie and treat the user as unauthenticated

### Requirement 7: Email Verification

**User Story:** As a platform administrator, I want to ensure all user emails are verified, so that we can communicate reliably and prevent spam accounts.

#### Acceptance Criteria

1. WHEN a new user registers THEN the Authentication System SHALL generate a unique verification token and store it in the Verification table with 24-hour expiry
2. WHEN a verification email is sent THEN the Authentication System SHALL include a link with the verification token to /auth/verify-email?token={token}
3. WHEN a user clicks a valid verification link THEN the Authentication System SHALL mark the User record as emailVerified=true and delete the verification token
4. WHEN a user clicks an expired verification link THEN the Authentication System SHALL display an error and offer to resend the verification email
5. WHEN a user requests to resend verification email THEN the Authentication System SHALL invalidate any existing tokens and generate a new one
6. WHEN a user attempts to access protected features without email verification THEN the Authentication System SHALL display a banner prompting verification
7. WHEN a user verifies their email THEN the Authentication System SHALL send a welcome email with account setup tips

### Requirement 8: Security and Rate Limiting

**User Story:** As a platform administrator, I want to protect authentication endpoints from brute force attacks, so that user accounts remain secure.

#### Acceptance Criteria

1. WHEN a user attempts to login from a specific IP address THEN the Authentication System SHALL track failed attempts in Redis with a 15-minute sliding window
2. WHEN failed login attempts from an IP exceed 5 within 15 minutes THEN the Authentication System SHALL block further attempts for 30 minutes
3. WHEN a user attempts to register from an IP that has created more than 3 accounts in 24 hours THEN the Authentication System SHALL require CAPTCHA verification
4. WHEN a user submits any authentication form THEN the Authentication System SHALL validate the CSRF token to prevent cross-site request forgery
5. WHEN a session cookie is set THEN the Authentication System SHALL use HttpOnly, Secure, and SameSite=Lax flags
6. WHEN a user's account shows suspicious activity (login from new location) THEN the Authentication System SHALL send a security alert email
7. WHEN password reset tokens are generated THEN the Authentication System SHALL use cryptographically secure random values with at least 32 bytes of entropy

### Requirement 9: Multi-Device Session Management

**User Story:** As a user, I want to see all my active sessions and log out from specific devices, so that I can manage my account security.

#### Acceptance Criteria

1. WHEN a user views their account security settings THEN the Authentication System SHALL display a list of all active sessions with device information, location, and last activity timestamp
2. WHEN a user clicks "Log out from this device" on a specific session THEN the Authentication System SHALL invalidate that session only
3. WHEN a user clicks "Log out from all devices" THEN the Authentication System SHALL invalidate all sessions except the current one
4. WHEN a session is created THEN the Authentication System SHALL store the user agent and IP address for device identification
5. WHEN a user logs in from a new device or location THEN the Authentication System SHALL send an email notification with device details

### Requirement 10: Password Strength and Validation

**User Story:** As a security-conscious user, I want to create a strong password with clear requirements, so that my account is protected.

#### Acceptance Criteria

1. WHEN a user types a password in the registration or reset form THEN the Authentication System SHALL display real-time validation feedback with visual indicators for each requirement
2. WHEN a password is submitted THEN the Authentication System SHALL validate it contains at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character
3. WHEN a user attempts to use a commonly breached password THEN the Authentication System SHALL reject it with message "This password has been found in data breaches, please choose a different one"
4. WHEN a user sets a new password THEN the Authentication System SHALL hash it using bcrypt with a cost factor of 12
5. WHEN a user attempts to reuse one of their last 5 passwords THEN the Authentication System SHALL reject it with message "Please choose a password you haven't used recently"
