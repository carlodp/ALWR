# Advanced Rate Limiting Documentation

## Overview

ALWR API now includes sophisticated role-based rate limiting with per-user tracking, concurrent operation limits, and detailed error responses.

## Rate Limit Tiers

Each user role has specific rate limits:

| Role | Requests/Hour | Concurrent Limit | Use Case |
|------|---------------|------------------|----------|
| Customer | 100 | 10 | Regular users |
| Agent | 500 | 50 | Staff agents |
| Reseller | 300 | 30 | Reseller partners |
| Admin | 2,000 | 500 | Administrative staff |
| Super Admin | 5,000 | 1,000 | System administrators |

## Implementation

### Middleware Setup

```typescript
import { createRateLimitMiddleware, createConcurrentLimitMiddleware } from './rate-limiter';

// Add to Express app (before routes)
app.use(createRateLimitMiddleware([
  '/api/public',        // Skip rate limiting for public endpoints
  '/api/health-check'   // Skip for health checks
]));

app.use(createConcurrentLimitMiddleware([
  '/api/public'
]));
```

### Headers

Every response includes rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1700000000000
```

## Error Responses

### Rate Limit Exceeded

**Status Code**: 429 (Too Many Requests)

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Max 100 requests per hour.",
  "retryAfter": 1234,
  "resetTime": "2025-11-23T10:30:00Z"
}
```

The `Retry-After` header indicates when to retry (in seconds):
```
Retry-After: 1234
```

### Concurrent Limit Exceeded

**Status Code**: 429

```json
{
  "error": "Too Many Concurrent Operations",
  "message": "Cannot exceed 10 concurrent operations for your role.",
  "resetAfter": 60
}
```

## Usage Examples

### Simple GET Request

```bash
curl -H "Authorization: Bearer token" \
  "http://localhost:5000/api/customers"

# Response headers:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# X-RateLimit-Reset: 1700000000000
```

### When Rate Limited

```bash
curl -H "Authorization: Bearer token" \
  "http://localhost:5000/api/customers"

# Response (429):
# {
#   "error": "Too Many Requests",
#   "message": "Rate limit exceeded. Max 100 requests per hour.",
#   "retryAfter": 1234,
#   "resetTime": "2025-11-23T10:30:00Z"
# }

# Retry-After: 1234
```

## Admin Monitoring

### Check Rate Limit Stats

```bash
curl -H "Authorization: Bearer admin-token" \
  "http://localhost:5000/api/admin/rate-limits/stats"
```

Response:
```json
{
  "totalTracked": 150,
  "activeEntries": 145,
  "tiers": ["customer", "agent", "reseller", "admin", "super_admin"]
}
```

### Clear All Rate Limits (Emergency)

```bash
curl -X POST http://localhost:5000/api/admin/rate-limits/clear \
  -H "Authorization: Bearer admin-token"
```

## Implementation Details

### In-Memory Tracking

Rate limits are tracked in-memory per user/IP:

```typescript
{
  key: "user:12345",
  requests: 45,
  resetTime: 1700000000000,
  concurrent: 2
}
```

- **Key**: `user:{userId}` for authenticated users, `ip:{ipAddress}` for anonymous
- **Requests**: Current request count in window
- **ResetTime**: When the window expires
- **Concurrent**: Current concurrent operations

### Automatic Cleanup

Rate limit entries are automatically cleaned up every 60 seconds:
- Expired windows are removed
- Zero concurrent operations are released

## Integration Points

### In Express Routes

```typescript
app.get('/api/customers', (req, res) => {
  // Rate limiting is checked before this handler
  // If limit exceeded, user gets 429 response
  
  // Your code runs only if rate limit allowed
  res.json(customers);
});
```

### Checking Remaining Requests

```typescript
app.get('/api/status', (req, res) => {
  const key = RateLimiter.getKey(req);
  const role = req.session?.user?.role || 'customer';
  const status = RateLimiter.getStatus(key, role);
  
  res.json({
    remaining: status.remaining,
    limit: status.limit,
    resetIn: status.resetIn,
  });
});
```

## Concurrent Operation Limiting

Limits concurrent POST/PATCH/PUT/DELETE operations:

```typescript
// User A: 5 concurrent uploads in progress (of 10 limit)
POST /api/documents/upload -> 202 Accepted
POST /api/documents/upload -> 202 Accepted
// ...

// User A: 10 concurrent operations active
POST /api/documents/upload -> 429 Too Many Concurrent Operations

// One upload completes
// ...

// User A: 9 concurrent operations active
POST /api/documents/upload -> 202 Accepted
```

## Configuration

### Adjust Thresholds

```typescript
import RateLimiter from './rate-limiter';

// Get current config for a role
const config = RateLimiter.getConfig('customer');
// { maxRequests: 100, windowMs: 3600000, concurrentLimit: 10 }
```

To change limits, edit `RATE_LIMIT_TIERS` in `server/rate-limiter.ts`:

```typescript
const RATE_LIMIT_TIERS = {
  customer: {
    maxRequests: 150,  // Changed from 100
    windowMs: 60 * 60 * 1000,
    concurrentLimit: 15,  // Changed from 10
  },
  // ...
};
```

Then restart the server.

## Best Practices

### 1. Always Check Remaining Limits

```typescript
const status = RateLimiter.getStatus(key, role);
if (status.remaining < 10) {
  console.warn('User approaching rate limit');
}
```

### 2. Use Appropriate Limits for Your Use Case

- **Slow operations** (exports, bulk uploads): Use concurrent limits
- **Fast queries** (profile lookups): Use request/hour limits
- **High-volume operations**: Consider higher tier roles

### 3. Exclude Non-Critical Endpoints

```typescript
const middleware = createRateLimitMiddleware([
  '/api/health-check',
  '/api/public',
  '/api/status'
]);
```

### 4. Monitor Rate Limit Metrics

```bash
# Daily check
curl "http://localhost:5000/api/admin/rate-limits/stats"

# Alert if:
# - totalTracked > 1000 (many active users)
# - High rejection rate (check logs)
```

## Troubleshooting

### User Getting 429 Unexpectedly

```typescript
// Check their limit status
const key = `user:${userId}`;
const status = RateLimiter.getStatus(key, userRole);
console.log(status);
// { limit: 100, remaining: 0, reset: 1700000000000, resetIn: 1234 }

// Clear their limit if needed
RateLimiter.clearAll(); // or remove specific key
```

### Too Aggressive Limits

- Increase `maxRequests` in `RATE_LIMIT_TIERS`
- Increase concurrent limits for data-heavy operations
- Add more exclusions to `excludePaths`

### Not Enough Concurrent Operations

```typescript
RATE_LIMIT_TIERS.customer.concurrentLimit = 20; // Increase from 10
```

## Performance Impact

- **Memory**: ~100 bytes per tracked user
- **CPU**: O(1) lookup time per request
- **Cleanup**: Automatic every 60 seconds

## Production Checklist

- [ ] Rate limiting middleware configured
- [ ] Excluded non-critical endpoints
- [ ] Admin monitoring enabled
- [ ] Alert thresholds set
- [ ] Role-based limits appropriate
- [ ] Concurrent limits tested
- [ ] Error responses documented
- [ ] Load testing completed

## Files

- `server/rate-limiter.ts` - Core implementation
- `RATE_LIMITING.md` - This documentation
- `QUERY_OPTIMIZATION.md` - Related improvements

## Related

- **Query Optimization** - Reduce queries behind rate limits
- **Caching Strategy** - Reduce request volume
- **Database Indices** - Faster query execution

---

**Status**: ✅ Implemented and Ready  
**Performance**: O(1) per request  
**Memory**: ~100 bytes per user  
**Last Updated**: November 23, 2025
