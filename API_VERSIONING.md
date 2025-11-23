# API Versioning Guide

## Overview

The ALWR API supports multiple API versions to ensure backward compatibility while allowing for continuous improvements and new features.

**Current Status:**
- **v1**: DEPRECATED (sunset on 2025-12-31)
- **v2**: STABLE (recommended)

---

## Quick Start

### Get Version Information

```bash
# Check current API versions
curl http://localhost:5000/api/version

# Explicit version endpoints
curl http://localhost:5000/api/v1/version
curl http://localhost:5000/api/v2/version
```

### Response Example

```json
{
  "currentVersion": "v2",
  "currentVersionInfo": {
    "version": "v2",
    "status": "stable",
    "releaseDate": "2024-11-23"
  },
  "allVersions": [
    {
      "version": "v1",
      "status": "deprecated",
      "releaseDate": "2024-01-01",
      "sunsetDate": "2025-12-31",
      "breaking": [
        "All v1 endpoints will be removed on 2025-12-31",
        "Please migrate to v2 which includes performance improvements and new features"
      ]
    },
    {
      "version": "v2",
      "status": "stable",
      "releaseDate": "2024-11-23",
      "breaking": [
        "Analytics endpoints moved to /api/v2/admin/analytics/*",
        "Rate limit headers changed: X-RateLimit-Remaining instead of X-RateLimit-Requests-Remaining"
      ]
    }
  ],
  "migrationGuide": {
    "from_v1_to_v2": "https://docs.alwr.local/migration/v1-to-v2",
    "deprecationTimeline": {
      "current": "v1 deprecated, v2 stable",
      "2025Q4": "v1 endpoints will be removed"
    }
  }
}
```

---

## Version Detection

The API automatically detects which version you're using based on your request URL:

```
/api/v1/endpoint      → Uses v1
/api/v2/endpoint      → Uses v2
/api/endpoint         → Uses v2 (default)
```

---

## Deprecation Headers

When using v1, the API returns deprecation warnings in response headers:

```
Deprecation: true
Sunset: Fri, 31 Dec 2025 00:00:00 GMT
Warning: 299 - "API v1 is deprecated" "Please migrate to /api/v2/" "2025-12-31"
X-API-Warn: v1 will be sunset on 2025-12-31
X-API-Version: v1
```

These headers signal to clients and monitoring tools that v1 is deprecated.

---

## Migration Timeline

| Date | Event |
|------|-------|
| **2024-01-01** | v1 released |
| **2024-11-23** | v2 released, v1 marked deprecated |
| **2025-12-31** | v1 endpoints shut down, v2 becomes required |

### Recommended Timeline for Migration

1. **This week**: Review breaking changes, run tests
2. **Next week**: Deploy v2 endpoints alongside v1
3. **Next month**: Redirect v1 traffic to v2
4. **Q4 2025**: Remove v1 endpoints

---

## Breaking Changes

### v1 to v2

#### 1. Analytics Endpoints

**v1 (Deprecated):**
```
GET /api/admin/analytics
```

**v2 (Current):**
```
GET /api/v2/admin/analytics/dashboard
GET /api/v2/admin/analytics/summary
GET /api/v2/admin/analytics/growth
GET /api/v2/admin/analytics/subscriptions
GET /api/v2/admin/analytics/revenue
GET /api/v2/admin/analytics/customers
GET /api/v2/admin/analytics/documents
```

#### 2. Rate Limit Headers

**v1 Response Headers:**
```
X-RateLimit-Requests-Remaining: 95
X-RateLimit-Total: 100
```

**v2 Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000000
```

#### 3. Error Response Format

**v1:**
```json
{
  "message": "Error message"
}
```

**v2:**
```json
{
  "error": "ErrorType",
  "message": "Error message",
  "code": "ERROR_CODE"
}
```

---

## Migration Guide

### Step 1: Review Changes

Check `/api/version` for all breaking changes between v1 and v2.

### Step 2: Update Endpoints

Replace all `/api/` calls with `/api/v2/`:

**Before (v1):**
```javascript
const response = await fetch('/api/admin/stats');
const response = await fetch('/api/customer/profile');
```

**After (v2):**
```javascript
const response = await fetch('/api/v2/admin/analytics/dashboard');
const response = await fetch('/api/v2/customer/profile');
```

### Step 3: Handle Header Changes

Update code that reads rate limit headers:

**Before:**
```javascript
const remaining = response.headers.get('X-RateLimit-Requests-Remaining');
```

**After:**
```javascript
const remaining = response.headers.get('X-RateLimit-Remaining');
```

### Step 4: Test Thoroughly

Test all API calls in both staging and production:

```bash
# Test v1 endpoint (with deprecation warning)
curl -i http://localhost:5000/api/auth/user
# Should include Deprecation and Sunset headers

# Test v2 endpoint (stable)
curl -i http://localhost:5000/api/v2/auth/user
# Should NOT include deprecation headers
```

### Step 5: Monitor and Deploy

1. Deploy updated code
2. Monitor error logs for API errors
3. Gradually shift traffic from v1 to v2
4. Once fully migrated, stop using v1 endpoints

---

## API Version Endpoints

### Get Full Version Info
```bash
GET /api/version
GET /api/v1/version
GET /api/v2/version
```

---

## Authentication Routes

Both v1 and v2 support these endpoints:

```
/api/auth/user                          (v1 & v2 compatible)
/api/v2/auth/user                       (explicit v2)
/api/v2/auth/login                      (v2 only)
/api/v2/auth/logout                     (v2 only)
```

---

## Customer Profile Routes

```
/api/customer/profile                   (v1 & v2 compatible)
/api/v2/customer/profile                (explicit v2)
/api/v2/customer/subscription           (v2)
/api/v2/customer/documents              (v2)
```

---

## Admin Routes

```
/api/admin/analytics/dashboard          (v1 & v2 compatible)
/api/v2/admin/analytics/dashboard       (explicit v2)
/api/v2/admin/analytics/revenue         (v2 only)
/api/v2/admin/analytics/customers       (v2 only)
```

---

## Best Practices

### 1. Always Specify Version

Don't rely on defaults. Explicitly use v2:

```javascript
// Good
fetch('/api/v2/auth/user')

// Avoid
fetch('/api/auth/user')  // Relies on default v2
```

### 2. Handle Deprecation Warnings

```javascript
const response = await fetch('/api/auth/user');

if (response.headers.get('Deprecation') === 'true') {
  console.warn('This API version is deprecated!');
  console.warn(`Sunset date: ${response.headers.get('Sunset')}`);
}
```

### 3. Monitor Rate Limit Headers

```javascript
const remaining = parseInt(response.headers.get('X-RateLimit-Remaining'));
const limit = parseInt(response.headers.get('X-RateLimit-Limit'));

if (remaining < limit * 0.1) {
  console.warn('Approaching rate limit!');
}
```

### 4. Test Version Compatibility

```typescript
describe('API Versioning', () => {
  it('should return v2 for default /api/ calls', async () => {
    const res = await fetch('/api/auth/user');
    expect(res.headers.get('X-API-Version')).toBe('v2');
  });

  it('should mark v1 as deprecated', async () => {
    const res = await fetch('/api/v1/auth/user');
    expect(res.headers.get('Deprecation')).toBe('true');
    expect(res.headers.get('Sunset')).toBeDefined();
  });
});
```

---

## FAQ

### Q: When will v1 be shut down?

**A:** v1 will be removed on 2025-12-31. Please migrate to v2 before this date.

### Q: Can I use both v1 and v2 endpoints simultaneously?

**A:** Yes, you can migrate gradually. Both v1 and v2 endpoints work together during the transition period.

### Q: What if I don't migrate before the sunset date?

**A:** v1 endpoints will return 410 Gone responses and your applications will break. Please migrate immediately.

### Q: Are there any performance differences between v1 and v2?

**A:** v2 includes performance optimizations, caching improvements, and better rate limiting. v2 endpoints should be significantly faster.

### Q: Can I request new v1 features?

**A:** No, v1 is frozen. All new features are v2-only. Please migrate to v2 to access new functionality.

### Q: How do I report migration issues?

**A:** Contact support@alwr.local with your migration details and any error messages you encounter.

---

## Files

- `server/api-versioning.ts` - Versioning middleware and utilities
- `API_VERSIONING.md` - This documentation
- `/api/version` - Version information endpoint

## Status

✅ **Production Ready**

- All endpoints accessible via v1 and v2
- Deprecation warnings active for v1
- Migration guide complete
- 12-month sunset timeline

---

**Last Updated**: November 23, 2025  
**Status**: ✅ Complete
