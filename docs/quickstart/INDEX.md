# Quick Start Guides

Step-by-step guides for getting started with key features.

## Files

### [EMAIL_QUEUE.md](EMAIL_QUEUE.md)
Quick start guide for the email queue system.

**Learn:**
- How to queue an email
- How to track email status
- How to view pending emails
- How to monitor delivery
- Common issues and solutions

### [CACHING.md](CACHING.md)
Quick start guide for the caching system.

**Learn:**
- How caching works
- How to invalidate cache
- Cache layer configuration
- Performance monitoring
- TTL settings

---

## Getting Started Steps

### 1. Set Up Environment
```bash
npm install
npm run dev
```

### 2. Access API Docs
Navigate to: `http://localhost:5000/api/docs`

### 3. Check Features
- Explore the [Features Documentation](../features/INDEX.md)
- Review [Project Overview](../guide/PROJECT_OVERVIEW.md)
- Read [Design Guidelines](../guide/DESIGN_GUIDELINES.md)

### 4. Test Email Queue (if needed)
```bash
# Follow: docs/quickstart/EMAIL_QUEUE.md
POST /api/emails
{
  "recipientEmail": "user@example.com",
  "subject": "Test",
  "htmlContent": "<p>Test email</p>"
}
```

### 5. Monitor Caching (if needed)
```bash
# Check cache stats
GET /api/admin/cache-stats
```

---

## Common Tasks

### Send an Email
1. Read [EMAIL_QUEUE Quick Start](EMAIL_QUEUE.md)
2. POST to `/api/emails` endpoint
3. Monitor via `/api/admin/emails/stats`

### Check Cache Performance
1. Read [CACHING Quick Start](CACHING.md)
2. View `/api/admin/cache-stats`
3. Adjust TTL if needed

### View API Documentation
- Go to `http://localhost:5000/api/docs`
- Swagger UI shows all endpoints
- Try requests directly from UI

### Configure Rate Limiting
- See [Rate Limiting](../features/RATE_LIMITING.md)
- Default limits are already set
- Adjust in `server/security.ts` if needed

### Monitor Admin Dashboard
- Go to `/api/admin/dashboard`
- Real-time metrics via WebSocket
- Check system health

---

## Troubleshooting

### Email Queue Issues
See [Email Queue Quick Start](EMAIL_QUEUE.md) → Troubleshooting section

### Cache Not Working
See [Caching Quick Start](CACHING.md) → Troubleshooting section

### Rate Limiting Blocking Requests
Check `X-RateLimit-*` response headers
- `X-RateLimit-Limit` - Requests allowed
- `X-RateLimit-Remaining` - Requests left
- `X-RateLimit-Reset` - When limit resets

---

## Next Steps

After getting familiar with quick starts:
1. Review [Features Documentation](../features/INDEX.md) for deep dives
2. Check [Security Documentation](../security/INDEX.md) for security features
3. Read [Project Overview](../guide/PROJECT_OVERVIEW.md) for complete context

---

## Navigation

- **[Back to README](../../README.md)**
- **[Guide Documentation](../guide/INDEX.md)**
- **[Features Documentation](../features/INDEX.md)**
- **[Security Documentation](../security/INDEX.md)**
- **[Tracking & Progress](../tracking/INDEX.md)**
