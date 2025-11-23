# ALWR Secrets Rotation Policy (Security #6)

## Overview
This document defines the security policy for rotating secrets, encryption keys, and sensitive credentials. Regular rotation limits exposure if a secret is compromised.

## Secrets to Rotate

### 1. SESSION_SECRET (Monthly)
**What it is:** Secret key used to sign session cookies  
**Storage:** `process.env.SESSION_SECRET`  
**Impact:** Invalidates all active user sessions  
**Rotation steps:**

```bash
# 1. Generate new session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Update environment variable
# Set SESSION_SECRET to new value in Replit Secrets tab

# 3. Redeploy application (workflow auto-restarts)

# 4. All users must log in again
```

**Frequency:** Monthly (or immediately if suspected compromise)  
**Last rotated:** [Document in git commit messages]

---

### 2. DATABASE_PASSWORD (Quarterly)
**What it is:** PostgreSQL database password  
**Storage:** `process.env.DATABASE_URL` (contains password)  
**Impact:** Database connection temporarily fails during rotation  
**Rotation steps:**

```bash
# 1. Connect to database provider (Replit or hosting service)
# 2. Change password in database settings
# 3. Update DATABASE_URL environment variable
# 4. Redeploy application
# 5. Verify database connections work
```

**Frequency:** Every 3 months  
**Last rotated:** [Document in database provider]  
**Alerting:** Monitor failed connection attempts after rotation

---

### 3. ENCRYPTION_MASTER_KEY (Quarterly)
**What it is:** Master key for encrypting PII (emails, names, SSNs, documents)  
**Storage:** `process.env.ENCRYPTION_MASTER_KEY` (64-char hex string)  
**Impact:** Must re-encrypt all PII in database  
**Rotation steps:**

```bash
# 1. Generate new encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Set OLD_ENCRYPTION_KEY = current value
# 3. Trigger key rotation migration:
#    - Read old encrypted values
#    - Decrypt with OLD_ENCRYPTION_KEY
#    - Re-encrypt with NEW_ENCRYPTION_KEY

# 4. Update ENCRYPTION_MASTER_KEY to new value
# 5. Remove OLD_ENCRYPTION_KEY from environment
# 6. Verify all users can still access their data

# Example migration script (run once):
# const oldKey = process.env.OLD_ENCRYPTION_KEY;
# const storage = getStorage();
# const users = await db.query('SELECT * FROM users WHERE email LIKE ?', ['%@%']);
# for (const user of users) {
#   const decrypted = decryptField(user.email, oldKey);
#   const encrypted = encryptField(decrypted, newKey);
#   await db.update('users', { email: encrypted }, { id: user.id });
# }
```

**Frequency:** Every 3 months  
**Last rotated:** [Document in ENCRYPTION_MASTER_KEY changelog]

---

### 4. STRIPE_SECRET_KEY (Managed by Replit)
**What it is:** Stripe API secret key for payment processing  
**Storage:** Managed by Replit Stripe integration  
**Impact:** Automatic - no manual rotation needed  
**Replit handles:**
- Automatic key rotation
- Graceful transition period
- No downtime required
- Validation of new keys

**Documentation:** See Replit Stripe integration settings

---

### 5. WORDPRESS_API_SECRET (On Change to WordPress)
**What it is:** Shared secret for signing requests from WordPress to API  
**Storage:** `process.env.WORDPRESS_API_SECRET` (should match WordPress setting)  
**Impact:** WordPress can no longer call API during rotation  
**Rotation steps:**

```bash
# MUST be coordinated with WordPress admin:
# 1. Generate new random string (32+ chars)
# 2. WordPress admin updates their ALWR_API_SECRET setting
# 3. Update WORDPRESS_API_SECRET in Replit
# 4. Verify WordPress can still reach API
```

**Frequency:** When WordPress security is updated, or yearly  
**Last rotated:** [Coordinate with WordPress admin]

---

## Rotation Schedule

| Secret | Frequency | Last Rotated | Next Due |
|--------|-----------|--------------|----------|
| SESSION_SECRET | Monthly | [Date] | [Date] |
| DATABASE_PASSWORD | Quarterly | [Date] | [Date] |
| ENCRYPTION_MASTER_KEY | Quarterly | [Date] | [Date] |
| STRIPE_SECRET_KEY | Automatic | [Managed by Replit] | N/A |
| WORDPRESS_API_SECRET | Yearly | [Date] | [Date] |

---

## Emergency Rotation (If Compromised)

If a secret is suspected compromised:

1. **IMMEDIATE (within 1 hour):**
   - Rotate the compromised secret
   - Check audit logs for unauthorized access
   - Notify affected users if needed

2. **WITHIN 24 HOURS:**
   - Review activity logs for suspicious behavior
   - Check if other systems using the secret were affected
   - Document the incident

3. **FOLLOW UP:**
   - Implement additional monitoring on that secret
   - Consider more frequent rotation for that secret
   - Update security training if human error caused compromise

---

## Key Generation

Generate cryptographically secure random values:

```bash
# SESSION_SECRET (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ENCRYPTION_MASTER_KEY (32 bytes, hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# WORDPRESS_API_SECRET (32 chars)
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"

# Database password (use provider's tools)
```

---

## Automation Opportunities

Consider automating in future:

1. **Monthly rotation alerts** - Slack/email reminder to rotate SESSION_SECRET
2. **Automated key versioning** - Keep multiple old keys for graceful transition
3. **Encryption key versioning** - Allow different keys for different record creation dates
4. **Audit logging** - Track which key encrypted which records
5. **Secret scanning** - Monitor git history for accidentally committed secrets

---

## Testing

After each rotation:

1. **Verify application still works:**
   ```bash
   curl http://localhost:5000/api/auth/user
   ```

2. **Verify users can still log in:**
   - Try admin login
   - Try customer login
   - Check 2FA still works

3. **Verify encryption still works:**
   - Create new user (test encrypted fields)
   - View existing user profile (test decryption)
   - Export customer data (test decrypted values)

4. **Check logs for errors:**
   - Review application logs for decryption failures
   - Check database for connection errors

---

## Alerts to Monitor

Set up alerts for:

- Failed login attempts spike (KEY COMPROMISE INDICATOR)
- Database connection failures (PASSWORD ROTATION ISSUE)
- Decryption failures on PII (KEY MISMATCH)
- Unauthorized API calls with old signatures (WORDPRESS ISSUE)

---

## Compliance

This rotation policy helps meet:

- **HIPAA**: Encryption at rest, key management
- **GDPR**: Data security, incident response
- **SOC 2**: Secret management, rotation, audit trails
- **PCI DSS**: Key rotation and management

---

## References

- [OWASP: Secrets Management](https://owasp.org/www-community/Sensitive_Data_Exposure)
- [Cryptography Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
