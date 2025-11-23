# Features Documentation

Detailed documentation for each feature of the ALWR system.

## Files

### [EMAIL_QUEUE.md](EMAIL_QUEUE.md)
Asynchronous email processing system with retry logic, status tracking, and templates.

**Covers:**
- Email queue architecture
- Processing pipeline (async, queued, 10 emails per 5 seconds)
- Retry mechanism (exponential backoff)
- Status tracking (pending, sent, failed, bounced)
- Email templates system
- Admin monitoring endpoints

### [CACHING_STRATEGY.md](CACHING_STRATEGY.md)
In-memory caching with TTL support, smart invalidation, and performance optimization.

**Covers:**
- Caching architecture
- 5 strategic cache layers
- TTL (time-to-live) configuration
- Cache invalidation patterns
- Performance metrics
- Memory management

### [RATE_LIMITING.md](RATE_LIMITING.md)
Multi-tier rate limiting for different user roles and endpoints.

**Covers:**
- Global rate limiting (100 requests / 15 minutes)
- User-based rate limiting (100 requests/minute per user)
- Sensitive endpoint limits (5 requests / 15 minutes)
- Authentication limits (5 attempts / 15 minutes)
- Role-based limits (customer, agent, reseller, admin, super admin)

### [ADMIN_ANALYTICS.md](ADMIN_ANALYTICS.md)
Real-time admin dashboard with WebSocket-based metrics streaming.

**Covers:**
- Dashboard metrics (subscriptions, revenue, customers, documents)
- System health monitoring
- Real-time updates via WebSocket
- Historical trends
- Performance tracking

### [API_VERSIONING.md](API_VERSIONING.md)
API versioning system supporting multiple versions with deprecation warnings.

**Covers:**
- Version 1 (deprecated, sunset 2025-12-31)
- Version 2 (stable, recommended)
- Automatic version detection
- Deprecation warnings
- Migration guide
- Backward compatibility

### [QUERY_OPTIMIZATION.md](QUERY_OPTIMIZATION.md)
Database optimization, indexing strategy, and query performance monitoring.

**Covers:**
- Slow query logging (>100ms threshold)
- Recommended indices
- Query performance metrics
- N+1 detection
- Optimization techniques

---

## Quick Reference

### Email Queue
```
POST /api/emails - Queue email
GET /api/admin/emails - List pending emails
GET /api/admin/emails/stats - Email statistics
```

### Caching
- Cache hit rate tracking
- 60-second auto-cleanup
- Smart invalidation on mutations

### Rate Limiting
- Global: 100 req/15 min
- User: 100 req/min
- Sensitive: 5 req/15 min
- Auth: 5 attempts/15 min

### Analytics
- Real-time WebSocket updates
- 10 key metrics
- System health status
- Revenue tracking

### API Versions
- v1: Deprecated
- v2: Current (recommended)
- Header-based detection
- Automatic warnings

### Database
- 10+ optimized indices
- Query monitoring
- Performance tracking
- Slow query alerts

---

## Implementation Details

All features follow these patterns:
1. **Type Safety** - TypeScript + Zod validation
2. **Error Handling** - Sanitized error messages
3. **Logging** - Structured logging for debugging
4. **Security** - No PII in logs, secured endpoints
5. **Performance** - Optimized queries, caching

---

## Navigation

- **[Back to README](../../README.md)**
- **[Guide Documentation](../guide/INDEX.md)**
- **[Quick Start Guides](../quickstart/INDEX.md)**
- **[Security Documentation](../security/INDEX.md)**
- **[Tracking & Progress](../tracking/INDEX.md)**
