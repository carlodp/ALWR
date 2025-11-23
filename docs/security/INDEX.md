# Security Documentation

Security, authentication, and encryption documentation.

## Files

### [AUTH_VERIFICATION.md](AUTH_VERIFICATION.md)
Authentication and session management verification guide.

**Covers:**
- Session creation and validation
- Authentication flows
- Account locking mechanisms
- Password management
- Session expiration
- Testing procedures

### [SECRETS_ROTATION.md](SECRETS_ROTATION.md)
Secrets and encryption keys rotation policy.

**Covers:**
- SESSION_SECRET rotation (monthly)
- DATABASE_PASSWORD rotation (quarterly)
- ENCRYPTION_MASTER_KEY rotation (quarterly)
- Key generation procedures
- Rotation checklists
- Emergency rotation procedures

---

## Security Measures (10 Implemented)

### #1-3: Headers & Transport Security
- **CORS Validation** - Restrict origin-based requests
- **CSP Headers** - Content Security Policy for XSS prevention
- **HSTS Headers** - Force HTTPS, prevent downgrade attacks

### #4-5: Rate Limiting & Payload Protection
- **User Rate Limiting** - 100 requests/min per authenticated user
- **Payload Size Limits** - Default 5MB, documents 50MB, settings 100KB

### #6-7: Encryption & Secrets
- **Secrets Rotation Policy** - Monthly/quarterly rotations
- **Column-Level Encryption** - AES-256-GCM for PII

### #8-10: Authentication & Access Control
- **API Key Authentication** - SHA256 hashed keys with expiration
- **Enhanced Audit Logging** - 35+ audit action types
- **IP Whitelisting** - Admin endpoints restricted to whitelisted IPs

---

## Quick Reference

### Environment Variables
```bash
# Session encryption
SESSION_SECRET=<32-byte-hex-string>

# Database access
DATABASE_URL=postgresql://...

# PII encryption (ready to enable)
ENCRYPTION_MASTER_KEY=<32-byte-hex-string>

# Admin IP whitelist
ADMIN_IPS=192.168.1.100,203.0.113.45
```

### Key Rotation Schedule
- **SESSION_SECRET** - Monthly (invalidates all sessions)
- **DATABASE_PASSWORD** - Quarterly (via DB provider)
- **ENCRYPTION_MASTER_KEY** - Quarterly (requires re-encryption)

### Security Headers
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

### Rate Limiting Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000000
```

### API Key Format
```
ALWR_<48-character-hex-string>
Example: ALWR_a1b2c3d4e5f6...
```

---

## Implementation Files

### Core Security Files
- `server/security.ts` - CORS, headers, rate limiting
- `server/encryption.ts` - AES-256-GCM encryption/decryption
- `server/api-key-service.ts` - API key generation and validation
- `server/audit-logging-helper.ts` - Audit logging with 35+ actions
- `server/ip-whitelist-middleware.ts` - IP validation for admin routes

### Schema & Types
- `shared/schema.ts` - API keys table, audit actions enum

### Storage Operations
- `server/storage.ts` - API key CRUD methods
- Database indices on sensitive tables

---

## Audit Logging

### Monitored Actions (35+)

**User Management**
- user_create, user_update, user_delete
- user_role_change, user_suspend, user_activate

**Admin Actions**
- admin_login, admin_failed_login, admin_logout
- admin_export_data, admin_bulk_action, admin_settings_change

**Security Events**
- failed_login_attempt, account_locked, account_unlocked
- password_changed, password_reset, password_reset_failed
- two_factor_enabled, two_factor_disabled, two_factor_failed

**API Management**
- api_key_created, api_key_revoked, ip_whitelist_changed

**Data Operations**
- document_accessed, document_exported
- subscription_created, subscription_cancelled, subscription_renewed
- customer_export, customer_create, customer_update

### Audit Trail Includes
- User/admin ID
- Action performed
- Timestamp
- IP address
- User agent
- Changes before/after
- Success/failure status
- Error messages (if failed)

---

## Best Practices

### For Admins
1. ✅ Rotate SESSION_SECRET monthly
2. ✅ Rotate DATABASE_PASSWORD quarterly
3. ✅ Review audit logs regularly
4. ✅ Monitor API key usage
5. ✅ Keep ADMIN_IPS whitelist updated
6. ✅ Enable 2FA for all admin accounts

### For Developers
1. ✅ Never log PII or secrets
2. ✅ Always validate API keys before use
3. ✅ Check IP whitelist on admin endpoints
4. ✅ Sanitize error messages
5. ✅ Use encryption service for PII
6. ✅ Log security-relevant actions

### For Operations
1. ✅ Monitor rate limit headers
2. ✅ Alert on unusual API key usage
3. ✅ Review audit logs for suspicious activity
4. ✅ Test secrets rotation process
5. ✅ Keep encryption key backups secure
6. ✅ Document all security changes

---

## Navigation

- **[Back to README](../../README.md)**
- **[Guide Documentation](../guide/INDEX.md)**
- **[Features Documentation](../features/INDEX.md)**
- **[Quick Start Guides](../quickstart/INDEX.md)**
- **[Tracking & Progress](../tracking/INDEX.md)**
