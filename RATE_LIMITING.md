# Rate Limiting Configuration

## ✅ Implementation Complete

Rate limiting has been implemented across all API routes to protect against abuse and ensure fair usage.

## 🔐 Protection Levels

### Authentication Routes (`/api/auth/*`)
**Most Restrictive**
- **Limit**: 5 requests per minute
- **Purpose**: Prevent brute force attacks, credential stuffing
- **Applies to**: Login, register, password reset

### Payment Routes (`/api/payment/*`)
**Very Restrictive**
- **Limit**: 3 requests per minute
- **Purpose**: Prevent payment fraud, duplicate charges
- **Applies to**: Payment initialization, confirmation

### Order Creation (`/api/orders/create`)
**Strict**
- **Limit**: 5 requests per minute
- **Purpose**: Prevent order spam, duplicate submissions
- **Applies to**: New order creation

### Checkout Routes (`/api/checkout/*`)
**Strict**
- **Limit**: 10 requests per minute
- **Purpose**: Protect checkout flow from abuse
- **Applies to**: Cart updates, address validation, shipping calculations

### Search Routes (`/api/search/*`)
**Moderate**
- **Limit**: 30 requests per minute
- **Purpose**: Prevent search scraping while allowing legitimate use
- **Applies to**: Product search, category search

### General API Routes (`/api/*`)
**Lenient**
- **Limit**: 100 requests per minute
- **Purpose**: General API protection
- **Applies to**: All other API endpoints

## 🏗️ Architecture

### Middleware Chain
```
Request → Rate Limit Check → Authentication → Authorization → Handler
```

**File**: [middleware.ts](middleware.ts:1-61)
- Intercepts all API requests
- Applies rate limiting before any other processing
- Returns 429 status if limit exceeded

**File**: [src/middleware/rate-limit-api.ts](src/middleware/rate-limit-api.ts:1-125)
- Pattern-based configuration
- Uses Redis for distributed rate limiting
- Automatic client identification via IP address

### Redis Backend
- **Container**: `mientior-redis` (Redis 7 Alpine)
- **Port**: 6379
- **Usage**: Stores request counters with automatic expiration
- **Fallback**: If Redis unavailable, requests are allowed (fail-open)

## 📊 Response Headers

All API responses include rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-11-19T01:23:45.000Z
```

### When Rate Limited (429 Response)

```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": "2025-11-19T01:23:45.000Z",
  "limit": 5,
  "window": 60
}
```

## 🛠️ Configuration

### Environment Variables

```env
# Default limits (applied when not specified)
RATE_LIMIT_MAX=100         # requests
RATE_LIMIT_WINDOW=60       # seconds

# Redis connection
REDIS_URL=redis://localhost:6379
```

### Custom Rate Limits

Edit [src/middleware/rate-limit-api.ts](src/middleware/rate-limit-api.ts:12-46) to add or modify limits:

```typescript
const RATE_LIMIT_CONFIGS = {
  '/api/your-route': {
    limit: 20,              // 20 requests
    window: 60,             // per minute
    keyPrefix: 'your-route',
  },
}
```

## 🧪 Testing Rate Limiting

### Using cURL

```bash
# Test authentication endpoint (5 req/min limit)
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/auth/sign-in \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}' \
    -i
  echo "Request $i"
done

# 6th request should return 429
```

### Using JavaScript (Browser Console)

```javascript
// Test rate limit on search endpoint (30 req/min)
async function testRateLimit() {
  for (let i = 1; i <= 35; i++) {
    const response = await fetch('/api/search?q=test')
    const headers = {
      limit: response.headers.get('X-RateLimit-Limit'),
      remaining: response.headers.get('X-RateLimit-Remaining'),
      reset: response.headers.get('X-RateLimit-Reset'),
    }
    console.log(`Request ${i}:`, response.status, headers)

    if (response.status === 429) {
      const data = await response.json()
      console.log('Rate limited!', data)
      break
    }
  }
}

testRateLimit()
```

## 🔍 Monitoring

### Check Redis Keys

```bash
# Connect to Redis
docker exec -it mientior-redis redis-cli

# List all rate limit keys
KEYS ratelimit:*

# Check specific key value and TTL
GET ratelimit:auth:192.168.1.100
TTL ratelimit:auth:192.168.1.100
```

### Clear Rate Limits (Development Only)

```bash
# Clear all rate limits
docker exec -it mientior-redis redis-cli FLUSHDB

# Clear specific user/IP
docker exec -it mientior-redis redis-cli DEL ratelimit:auth:192.168.1.100
```

## 🚨 Security Considerations

### Client Identification
- Uses `X-Forwarded-For` header (first IP)
- Falls back to `X-Real-IP`
- Default: 'unknown' if no IP found

**Important**: Ensure your reverse proxy (nginx, Cloudflare) sets these headers correctly.

### Bypass Prevention
- Rate limits apply per IP address
- Cannot be bypassed by changing user agents
- Applies to all clients equally (logged in or not)

### DDoS Protection
Rate limiting provides basic DDoS protection but should be combined with:
- Cloudflare or similar CDN
- Network-level firewalls
- WAF (Web Application Firewall)

## 📈 Performance Impact

- **Redis latency**: ~1-2ms per request
- **Memory usage**: ~100 bytes per unique IP
- **Automatic cleanup**: Redis TTL expires old counters
- **Fallback**: System continues to work if Redis is down

## 🔧 Troubleshooting

### Issue: Rate limit not applying

**Check**:
1. Redis is running: `docker ps | grep redis`
2. Redis connection in `.env`: `REDIS_URL=redis://localhost:6379`
3. Middleware is configured: [middleware.ts](middleware.ts:9-16)

### Issue: False positives (legitimate users blocked)

**Solution**:
- Increase limits for affected routes
- Consider user-based rate limiting (after authentication)
- Implement exponential backoff on client side

### Issue: Rate limits too strict in development

**Solution**:
```typescript
// Temporarily disable for development
if (process.env.NODE_ENV === 'development') {
  return null // Skip rate limiting
}
```

## 📚 Related Files

- [middleware.ts](middleware.ts) - Main middleware with rate limiting
- [src/middleware/rate-limit-api.ts](src/middleware/rate-limit-api.ts) - Rate limiting logic
- [src/lib/rate-limiter.ts](src/lib/rate-limiter.ts) - Core rate limiter utility
- [src/lib/redis.ts](src/lib/redis.ts) - Redis client configuration

## ✅ Compliance

This implementation helps meet security requirements for:
- **PCI DSS**: Rate limiting on payment endpoints
- **OWASP**: Protection against automated attacks
- **GDPR**: Fair processing of user data
- **SOC 2**: Access controls and monitoring

## 🎯 Next Steps

- [ ] Add user-based rate limiting (after authentication)
- [ ] Implement tiered limits for premium users
- [ ] Add rate limit analytics dashboard
- [ ] Set up alerts for rate limit breaches
- [ ] Consider IP whitelisting for trusted sources
