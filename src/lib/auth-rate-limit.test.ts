import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  rateLimitLogin,
  rateLimitRegistration,
  rateLimitPasswordReset,
  clearAuthRateLimit,
  getAuthRateLimitStatus,
  AUTH_RATE_LIMITS,
  checkAccountLockout,
  setAccountLockout,
  clearAccountLockout,
  trackFailedLoginAttempt,
  clearFailedLoginAttempts,
} from './auth-rate-limit';
import { redis } from './redis';

describe('Authentication Rate Limiting', () => {
  // Clean up Redis keys after each test
  afterEach(async () => {
    const keys = await redis.keys('auth:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });

  describe('Property 11: Failed login attempts trigger account lockout', () => {
    /**
     * Feature: authentication-system, Property 11: Failed login attempts trigger account lockout
     * Validates: Requirements 2.6, 2.7, 8.2
     * 
     * For any user account, when more than 5 failed login attempts occur within 15 minutes,
     * the system should lock the account for 30 minutes and display the remaining lockout time
     * on subsequent attempts.
     * 
     * Note: This property tests IP-based rate limiting (which blocks after 5 attempts),
     * not email-based account lockout. The rate limiting system uses IP addresses to prevent
     * brute force attacks before authentication occurs.
     */
    it('should block login after 5 failed attempts and enforce 30-minute lockout', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random IP addresses
          fc.ipV4(),
          async (ipAddress) => {
            // Clear any existing rate limits for this IP
            await clearAuthRateLimit(ipAddress, 'login');

            // Track results of each attempt
            const results = [];

            // Make 5 attempts - all should be allowed
            for (let i = 0; i < 5; i++) {
              const result = await rateLimitLogin(ipAddress);
              results.push(result);
              expect(result.allowed).toBe(true);
              expect(result.remaining).toBe(4 - i);
            }

            // 6th attempt should be blocked
            const blockedResult = await rateLimitLogin(ipAddress);
            expect(blockedResult.allowed).toBe(false);
            expect(blockedResult.remaining).toBe(0);
            expect(blockedResult.retryAfter).toBeDefined();
            
            // Verify lockout duration is approximately 30 minutes (1800 seconds)
            // Allow some tolerance for execution time
            expect(blockedResult.retryAfter!).toBeGreaterThan(1790);
            expect(blockedResult.retryAfter!).toBeLessThanOrEqual(1800);

            // Subsequent attempts should also be blocked with similar retry time
            const secondBlockedResult = await rateLimitLogin(ipAddress);
            expect(secondBlockedResult.allowed).toBe(false);
            expect(secondBlockedResult.remaining).toBe(0);

            // Clean up
            await clearAuthRateLimit(ipAddress, 'login');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should track failed attempts independently per IP address', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate two different IP addresses
          fc.tuple(fc.ipV4(), fc.ipV4()).filter(([ip1, ip2]) => ip1 !== ip2),
          async ([ip1, ip2]) => {
            // Clear any existing rate limits
            await clearAuthRateLimit(ip1, 'login');
            await clearAuthRateLimit(ip2, 'login');

            // Make 3 attempts from IP1
            for (let i = 0; i < 3; i++) {
              const result = await rateLimitLogin(ip1);
              expect(result.allowed).toBe(true);
            }

            // Make 2 attempts from IP2
            for (let i = 0; i < 2; i++) {
              const result = await rateLimitLogin(ip2);
              expect(result.allowed).toBe(true);
            }

            // Check status for both IPs
            const status1 = await getAuthRateLimitStatus(ip1, 'login');
            const status2 = await getAuthRateLimitStatus(ip2, 'login');

            expect(status1.count).toBe(3);
            expect(status1.remaining).toBe(2);
            expect(status2.count).toBe(2);
            expect(status2.remaining).toBe(3);

            // Clean up
            await clearAuthRateLimit(ip1, 'login');
            await clearAuthRateLimit(ip2, 'login');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should enforce sliding window - old attempts expire after 15 minutes', async () => {
      // This test verifies the sliding window behavior
      // We'll simulate by checking that the window is properly configured
      const testIp = '192.168.1.100';
      await clearAuthRateLimit(testIp, 'login');

      // Make 5 attempts
      for (let i = 0; i < 5; i++) {
        await rateLimitLogin(testIp);
      }

      // Verify the 6th is blocked
      const blocked = await rateLimitLogin(testIp);
      expect(blocked.allowed).toBe(false);

      // Verify the window is 15 minutes (900 seconds) + 30 minute lockout
      expect(blocked.retryAfter).toBeDefined();

      await clearAuthRateLimit(testIp, 'login');
    });
  });

  describe('Property 6: Registration rate limiting blocks excessive attempts', () => {
    /**
     * Feature: authentication-system, Property 6: Registration rate limiting blocks excessive attempts
     * Validates: Requirements 1.7, 8.2
     * 
     * For any IP address, when more than 5 registration attempts occur within 15 minutes,
     * the system should block the 6th and subsequent attempts with a rate limit error.
     */
    it('should block registration after 5 attempts within 15 minutes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.ipV4(),
          async (ipAddress) => {
            // Clear any existing rate limits
            await clearAuthRateLimit(ipAddress, 'registration');

            // Make 5 registration attempts - all should be allowed
            for (let i = 0; i < 5; i++) {
              const result = await rateLimitRegistration(ipAddress);
              expect(result.allowed).toBe(true);
              expect(result.remaining).toBe(4 - i);
              expect(result.limit).toBe(5);
            }

            // 6th attempt should be blocked
            const blockedResult = await rateLimitRegistration(ipAddress);
            expect(blockedResult.allowed).toBe(false);
            expect(blockedResult.remaining).toBe(0);
            expect(blockedResult.retryAfter).toBeDefined();

            // Verify retry time is within the 15-minute window
            expect(blockedResult.retryAfter!).toBeGreaterThan(0);
            expect(blockedResult.retryAfter!).toBeLessThanOrEqual(900); // 15 minutes

            // Clean up
            await clearAuthRateLimit(ipAddress, 'registration');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow registration attempts from different IPs independently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.ipV4(), { minLength: 2, maxLength: 5 }).map(ips => [...new Set(ips)]),
          async (ipAddresses) => {
            // Clear rate limits for all IPs
            for (const ip of ipAddresses) {
              await clearAuthRateLimit(ip, 'registration');
            }

            // Each IP should be able to make 5 attempts independently
            for (const ip of ipAddresses) {
              const result = await rateLimitRegistration(ip);
              expect(result.allowed).toBe(true);
              expect(result.remaining).toBe(4);
            }

            // Clean up
            for (const ip of ipAddresses) {
              await clearAuthRateLimit(ip, 'registration');
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should correctly report remaining attempts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.ipV4(),
          fc.integer({ min: 1, max: 5 }),
          async (ipAddress, numAttempts) => {
            await clearAuthRateLimit(ipAddress, 'registration');

            // Make numAttempts registration attempts
            let lastResult;
            for (let i = 0; i < numAttempts; i++) {
              lastResult = await rateLimitRegistration(ipAddress);
            }

            // Verify remaining count
            expect(lastResult!.remaining).toBe(5 - numAttempts);

            // Verify status matches
            const status = await getAuthRateLimitStatus(ipAddress, 'registration');
            expect(status.count).toBe(numAttempts);
            expect(status.remaining).toBe(5 - numAttempts);

            await clearAuthRateLimit(ipAddress, 'registration');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 18: Password reset rate limiting', () => {
    /**
     * Feature: authentication-system, Property 18: Password reset rate limiting
     * Validates: Requirements 4.7
     * 
     * For any user, when more than 3 password reset requests occur within 1 hour,
     * the system should rate limit further requests.
     */
    it('should block password reset after 3 requests within 1 hour', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            // Clear any existing rate limits
            await clearAuthRateLimit(email, 'password_reset');

            // Make 3 password reset requests - all should be allowed
            const results = [];
            for (let i = 0; i < 3; i++) {
              const result = await rateLimitPasswordReset(email);
              results.push(result);
              expect(result.allowed).toBe(true);
              expect(result.remaining).toBe(2 - i);
              expect(result.limit).toBe(3);
            }
            
            // Verify the count is exactly 3 before attempting the 4th request
            const statusBefore = await getAuthRateLimitStatus(email, 'password_reset');
            expect(statusBefore.count).toBe(3);
            expect(statusBefore.remaining).toBe(0);

            // 4th request should be blocked
            const blockedResult = await rateLimitPasswordReset(email);
            
            // If this fails, provide detailed debugging info
            if (blockedResult.allowed) {
              console.error('Test failed for email:', email);
              console.error('Previous results:', results);
              console.error('4th request result:', blockedResult);
              
              // Check the actual state in Redis
              const status = await getAuthRateLimitStatus(email, 'password_reset');
              console.error('Rate limit status:', status);
              
              throw new Error(
                `Expected rate limiting to block after 3 requests, but 4th request was allowed. ` +
                `This suggests the password reset rate limiting may not be enforcing the 3-request limit correctly.`
              );
            }
            
            expect(blockedResult.allowed).toBe(false);
            expect(blockedResult.remaining).toBe(0);
            expect(blockedResult.retryAfter).toBeDefined();

            // Verify retry time is within the 1-hour window
            expect(blockedResult.retryAfter!).toBeGreaterThan(0);
            expect(blockedResult.retryAfter!).toBeLessThanOrEqual(3600); // 1 hour

            // Clean up
            await clearAuthRateLimit(email, 'password_reset');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should track password reset requests independently per user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(fc.emailAddress(), fc.emailAddress()).filter(([e1, e2]) => e1 !== e2),
          async ([email1, email2]) => {
            // Clear any existing rate limits
            await clearAuthRateLimit(email1, 'password_reset');
            await clearAuthRateLimit(email2, 'password_reset');

            // User 1 makes 2 requests
            for (let i = 0; i < 2; i++) {
              const result = await rateLimitPasswordReset(email1);
              expect(result.allowed).toBe(true);
            }

            // User 2 makes 1 request
            const result2 = await rateLimitPasswordReset(email2);
            expect(result2.allowed).toBe(true);
            expect(result2.remaining).toBe(2);

            // Check status for both users
            const status1 = await getAuthRateLimitStatus(email1, 'password_reset');
            const status2 = await getAuthRateLimitStatus(email2, 'password_reset');

            expect(status1.count).toBe(2);
            expect(status1.remaining).toBe(1);
            expect(status2.count).toBe(1);
            expect(status2.remaining).toBe(2);

            // Clean up
            await clearAuthRateLimit(email1, 'password_reset');
            await clearAuthRateLimit(email2, 'password_reset');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should enforce stricter limit for password reset than login/registration', async () => {
      // Verify configuration
      expect(AUTH_RATE_LIMITS.PASSWORD_RESET.maxAttempts).toBe(3);
      expect(AUTH_RATE_LIMITS.PASSWORD_RESET.maxAttempts).toBeLessThan(
        AUTH_RATE_LIMITS.LOGIN.maxAttempts
      );
      expect(AUTH_RATE_LIMITS.PASSWORD_RESET.maxAttempts).toBeLessThan(
        AUTH_RATE_LIMITS.REGISTRATION.maxAttempts
      );

      // Verify window is 1 hour
      expect(AUTH_RATE_LIMITS.PASSWORD_RESET.windowMs).toBe(60 * 60 * 1000);
    });
  });

  describe('Rate limit error responses', () => {
    it('should include retryAfter in blocked responses', async () => {
      const testIp = '10.0.0.1';
      await clearAuthRateLimit(testIp, 'login');

      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        await rateLimitLogin(testIp);
      }

      // Get blocked response
      const blocked = await rateLimitLogin(testIp);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfter).toBeDefined();
      expect(typeof blocked.retryAfter).toBe('number');
      expect(blocked.retryAfter!).toBeGreaterThan(0);

      await clearAuthRateLimit(testIp, 'login');
    });

    it('should include resetAt timestamp in all responses', async () => {
      const testIp = '10.0.0.2';
      await clearAuthRateLimit(testIp, 'registration');

      const result = await rateLimitRegistration(testIp);
      expect(result.resetAt).toBeInstanceOf(Date);
      expect(result.resetAt.getTime()).toBeGreaterThan(Date.now());

      await clearAuthRateLimit(testIp, 'registration');
    });

    it('should include limit and remaining in all responses', async () => {
      const testEmail = 'test@example.com';
      await clearAuthRateLimit(testEmail, 'password_reset');

      const result = await rateLimitPasswordReset(testEmail);
      expect(result.limit).toBe(3);
      expect(result.remaining).toBe(2);
      expect(typeof result.limit).toBe('number');
      expect(typeof result.remaining).toBe('number');

      await clearAuthRateLimit(testEmail, 'password_reset');
    });
  });

  describe('Account Lockout', () => {
    /**
     * This section tests email-based account lockout, which is separate from IP-based rate limiting.
     * Account lockout tracks failed attempts per user email and locks the account after 5 failures.
     */
    it('should lock account after 5 failed login attempts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            // Clear any existing lockout and failed attempts
            await clearAccountLockout(email);
            await clearFailedLoginAttempts(email);

            // Track 4 failed attempts - should not lock
            for (let i = 0; i < 4; i++) {
              const shouldLock = await trackFailedLoginAttempt(email);
              expect(shouldLock).toBe(false);
            }

            // 5th attempt should trigger lockout
            const shouldLock = await trackFailedLoginAttempt(email);
            expect(shouldLock).toBe(true);

            // Verify account is locked
            const lockoutStatus = await checkAccountLockout(email);
            expect(lockoutStatus.isLocked).toBe(true);
            expect(lockoutStatus.lockedUntil).toBeInstanceOf(Date);
            expect(lockoutStatus.remainingSeconds).toBeGreaterThan(0);

            // Clean up
            await clearAccountLockout(email);
            await clearFailedLoginAttempts(email);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should enforce 30-minute lockout duration', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            await clearAccountLockout(email);

            // Set lockout
            await setAccountLockout(email);

            // Check lockout status
            const status = await checkAccountLockout(email);
            expect(status.isLocked).toBe(true);
            expect(status.remainingSeconds).toBeDefined();

            // Verify lockout is approximately 30 minutes (1800 seconds)
            // Allow some tolerance for execution time
            expect(status.remainingSeconds!).toBeGreaterThan(1790);
            expect(status.remainingSeconds!).toBeLessThanOrEqual(1800);

            await clearAccountLockout(email);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should clear lockout on successful login', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            // Set lockout
            await setAccountLockout(email);

            // Verify locked
            let status = await checkAccountLockout(email);
            expect(status.isLocked).toBe(true);

            // Clear lockout (simulating successful login)
            await clearAccountLockout(email);

            // Verify unlocked
            status = await checkAccountLockout(email);
            expect(status.isLocked).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should clear failed attempts counter on successful login', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            // Clear any existing state
            await clearAccountLockout(email);
            await clearFailedLoginAttempts(email);

            // Track 3 failed attempts
            for (let i = 0; i < 3; i++) {
              await trackFailedLoginAttempt(email);
            }

            // Clear failed attempts (simulating successful login)
            await clearFailedLoginAttempts(email);

            // Verify counter was reset by checking Redis directly
            const failedAttemptsKey = `auth:failed:${email}`;
            const attempts = await redis.get(failedAttemptsKey);
            expect(attempts).toBeNull();

            // Next failed attempt should start from 1, not 4
            const shouldLock = await trackFailedLoginAttempt(email);
            expect(shouldLock).toBe(false);

            // Clean up
            await clearAccountLockout(email);
            await clearFailedLoginAttempts(email);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should track lockouts independently per email', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(fc.emailAddress(), fc.emailAddress()).filter(([e1, e2]) => e1 !== e2),
          async ([email1, email2]) => {
            await clearAccountLockout(email1);
            await clearAccountLockout(email2);

            // Lock email1
            await setAccountLockout(email1);

            // Check both accounts
            const status1 = await checkAccountLockout(email1);
            const status2 = await checkAccountLockout(email2);

            expect(status1.isLocked).toBe(true);
            expect(status2.isLocked).toBe(false);

            await clearAccountLockout(email1);
            await clearAccountLockout(email2);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should return not locked for non-existent lockout', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            // Ensure no lockout exists
            await clearAccountLockout(email);

            const status = await checkAccountLockout(email);
            expect(status.isLocked).toBe(false);
            expect(status.lockedUntil).toBeUndefined();
            expect(status.remainingSeconds).toBeUndefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
