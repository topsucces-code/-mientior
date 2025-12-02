import { redis } from '@/lib/redis';

export interface AuthRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
  retryAfter?: number; // seconds until retry is allowed
}

export interface AuthRateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number; // Optional additional block duration after limit exceeded
}

/**
 * Rate limit configurations for authentication operations
 */
export const AUTH_RATE_LIMITS = {
  LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes lockout after exceeding
  },
  REGISTRATION: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  PASSWORD_RESET: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
} as const;

/**
 * Rate limit authentication operations using Redis with sliding window algorithm
 * Uses Lua script for atomic operations to prevent race conditions
 * 
 * @param identifier - Unique identifier (IP address for login/registration, user ID for password reset)
 * @param operation - Type of operation (login, registration, password_reset)
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and metadata
 */
export async function rateLimitAuth(
  identifier: string,
  operation: 'login' | 'registration' | 'password_reset',
  config: AuthRateLimitConfig
): Promise<AuthRateLimitResult> {
  const redisKey = `auth:ratelimit:${operation}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Use Lua script for atomic rate limiting operations
    // This prevents race conditions between check and increment
    const luaScript = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local windowStart = tonumber(ARGV[2])
      local maxAttempts = tonumber(ARGV[3])
      local requestId = ARGV[4]
      local expirySeconds = tonumber(ARGV[5])
      
      -- Remove old entries outside the window
      redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
      
      -- Count current requests in window
      local currentCount = redis.call('ZCARD', key)
      
      -- Check if limit exceeded
      if currentCount >= maxAttempts then
        -- Get the oldest request timestamp for reset calculation
        local oldestRequests = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
        local oldestTimestamp = now
        if #oldestRequests > 1 then
          oldestTimestamp = tonumber(oldestRequests[2])
        end
        
        return {0, currentCount, oldestTimestamp}
      end
      
      -- Add current request to sorted set
      redis.call('ZADD', key, now, requestId)
      
      -- Set expiry on the key (cleanup)
      redis.call('EXPIRE', key, expirySeconds)
      
      -- Return success with new count
      return {1, currentCount + 1, now}
    `;

    const requestId = `${now}:${Math.random()}`;
    const expirySeconds = Math.ceil((config.windowMs + (config.blockDurationMs || 0)) / 1000);

    // Execute Lua script atomically
    const result = await redis.eval(
      luaScript,
      1, // number of keys
      redisKey,
      now.toString(),
      windowStart.toString(),
      config.maxAttempts.toString(),
      requestId,
      expirySeconds.toString()
    ) as [number, number, number];

    const [allowed, count, timestamp] = result;

    if (allowed === 0) {
      // Request blocked - limit exceeded
      const oldestTimestamp = timestamp;
      
      // Calculate reset time based on window or block duration
      const resetTime = config.blockDurationMs 
        ? now + config.blockDurationMs
        : oldestTimestamp + config.windowMs;
      
      const resetAt = new Date(resetTime);
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        limit: config.maxAttempts,
        retryAfter,
      };
    }

    // Request allowed
    const resetAt = new Date(now + config.windowMs);

    return {
      allowed: true,
      remaining: config.maxAttempts - count,
      resetAt,
      limit: config.maxAttempts,
    };
  } catch (error) {
    console.error('Auth rate limit error:', error);
    // Fail open: allow request if Redis is unavailable
    return {
      allowed: true,
      remaining: config.maxAttempts,
      resetAt: new Date(now + config.windowMs),
      limit: config.maxAttempts,
    };
  }
}

/**
 * Rate limit login attempts by IP address
 * Implements: 5 attempts per 15 minutes, then 30-minute lockout
 */
export async function rateLimitLogin(ipAddress: string): Promise<AuthRateLimitResult> {
  return rateLimitAuth(ipAddress, 'login', AUTH_RATE_LIMITS.LOGIN);
}

/**
 * Rate limit registration attempts by IP address
 * Implements: 5 attempts per 15 minutes
 */
export async function rateLimitRegistration(ipAddress: string): Promise<AuthRateLimitResult> {
  return rateLimitAuth(ipAddress, 'registration', AUTH_RATE_LIMITS.REGISTRATION);
}

/**
 * Rate limit password reset requests by user identifier (email or user ID)
 * Implements: 3 requests per hour
 */
export async function rateLimitPasswordReset(userIdentifier: string): Promise<AuthRateLimitResult> {
  return rateLimitAuth(userIdentifier, 'password_reset', AUTH_RATE_LIMITS.PASSWORD_RESET);
}

/**
 * Clear rate limit for a specific identifier and operation
 * Useful for testing or manual intervention
 */
export async function clearAuthRateLimit(
  identifier: string,
  operation: 'login' | 'registration' | 'password_reset'
): Promise<void> {
  const redisKey = `auth:ratelimit:${operation}:${identifier}`;
  await redis.del(redisKey);
}

/**
 * Get current rate limit status without incrementing
 */
export async function getAuthRateLimitStatus(
  identifier: string,
  operation: 'login' | 'registration' | 'password_reset'
): Promise<{ count: number; limit: number; remaining: number }> {
  const redisKey = `auth:ratelimit:${operation}:${identifier}`;
  const config = AUTH_RATE_LIMITS[operation.toUpperCase() as keyof typeof AUTH_RATE_LIMITS];
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Remove old entries
    await redis.zremrangebyscore(redisKey, 0, windowStart);
    
    // Count current requests
    const count = await redis.zcard(redisKey);

    return {
      count,
      limit: config.maxAttempts,
      remaining: Math.max(0, config.maxAttempts - count),
    };
  } catch (error) {
    console.error('Get auth rate limit status error:', error);
    return {
      count: 0,
      limit: config.maxAttempts,
      remaining: config.maxAttempts,
    };
  }
}

/**
 * Account lockout result
 */
export interface AccountLockoutResult {
  isLocked: boolean;
  lockedUntil?: Date;
  remainingSeconds?: number;
}

/**
 * Check if an account is locked due to too many failed login attempts
 * 
 * @param email - User email address
 * @returns Lockout status with expiry information
 */
export async function checkAccountLockout(email: string): Promise<AccountLockoutResult> {
  const lockoutKey = `auth:lockout:${email}`;
  
  try {
    const lockoutExpiry = await redis.get(lockoutKey);
    
    if (!lockoutExpiry) {
      return { isLocked: false };
    }
    
    const expiryTimestamp = parseInt(lockoutExpiry);
    const now = Date.now();
    
    if (expiryTimestamp <= now) {
      // Lockout has expired, clean up
      await redis.del(lockoutKey);
      return { isLocked: false };
    }
    
    const remainingSeconds = Math.ceil((expiryTimestamp - now) / 1000);
    
    return {
      isLocked: true,
      lockedUntil: new Date(expiryTimestamp),
      remainingSeconds,
    };
  } catch (error) {
    console.error('Check account lockout error:', error);
    // Fail open: allow login attempt if Redis is unavailable
    return { isLocked: false };
  }
}

/**
 * Set account lockout after too many failed login attempts
 * Locks the account for 30 minutes
 * 
 * @param email - User email address
 */
export async function setAccountLockout(email: string): Promise<void> {
  const lockoutKey = `auth:lockout:${email}`;
  const lockoutDurationMs = 30 * 60 * 1000; // 30 minutes
  const expiryTimestamp = Date.now() + lockoutDurationMs;
  
  try {
    // Set lockout with expiry timestamp as value
    await redis.set(lockoutKey, expiryTimestamp.toString());
    
    // Set TTL for automatic cleanup
    await redis.expire(lockoutKey, Math.ceil(lockoutDurationMs / 1000));
  } catch (error) {
    console.error('Set account lockout error:', error);
  }
}

/**
 * Clear account lockout (e.g., after successful login)
 * 
 * @param email - User email address
 */
export async function clearAccountLockout(email: string): Promise<void> {
  const lockoutKey = `auth:lockout:${email}`;
  
  try {
    await redis.del(lockoutKey);
  } catch (error) {
    console.error('Clear account lockout error:', error);
  }
}

/**
 * Track failed login attempt and potentially trigger lockout
 * 
 * @param email - User email address
 * @returns Whether the account should be locked
 */
export async function trackFailedLoginAttempt(email: string): Promise<boolean> {
  const failedAttemptsKey = `auth:failed:${email}`;
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;
  
  try {
    // Increment failed attempts counter
    const attempts = await redis.incr(failedAttemptsKey);
    
    // Set expiry on first attempt
    if (attempts === 1) {
      await redis.expire(failedAttemptsKey, Math.ceil(windowMs / 1000));
    }
    
    // Check if we've exceeded the limit
    if (attempts >= maxAttempts) {
      // Set lockout
      await setAccountLockout(email);
      // Clear the failed attempts counter
      await redis.del(failedAttemptsKey);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Track failed login attempt error:', error);
    return false;
  }
}

/**
 * Clear failed login attempts counter (e.g., after successful login)
 * 
 * @param email - User email address
 */
export async function clearFailedLoginAttempts(email: string): Promise<void> {
  const failedAttemptsKey = `auth:failed:${email}`;
  
  try {
    await redis.del(failedAttemptsKey);
  } catch (error) {
    console.error('Clear failed login attempts error:', error);
  }
}
