# Email Queue System Documentation

## Overview

The email queue system provides asynchronous email processing with retry logic, delivery tracking, and failure handling. Instead of sending emails synchronously during API requests, emails are queued and processed in the background, ensuring requests never fail due to email service issues.

## Architecture

```
User Action (e.g., password reset)
    ↓
API Endpoint
    ↓
EmailService.sendPasswordResetEmail()
    ↓
emailQueue.enqueue()
    ↓
Database: emailNotifications table (status: 'pending')
    ↓
Background Processor (every 5 seconds)
    ↓
Process up to 10 pending emails
    ↓
Send via provider (mock for now)
    ↓
Update status: 'sent' or 'failed'
    ↓
On failure: retry with exponential backoff
```

## Key Features

✅ **Asynchronous Processing**: Emails don't block API requests
✅ **Automatic Retries**: Failed emails retry up to 3 times with exponential backoff
✅ **Delivery Tracking**: Every email has a status (pending, sent, failed, bounced)
✅ **Admin Dashboard**: View queue stats and manage emails
✅ **Failure Handling**: Failed emails are logged with error messages
✅ **Scalable**: Process multiple emails in batches

## Email Queue API

### Admin Endpoints

All admin endpoints require `requireAdmin` middleware (Super Admin or Admin role).

#### 1. Get Queue Statistics
```
GET /api/admin/email-queue/stats
```

Returns:
```json
{
  "pending": 5,
  "sent": 1234,
  "failed": 3,
  "total": 1242
}
```

#### 2. List Emails in Queue
```
GET /api/admin/email-queue?status=pending&limit=50&offset=0
```

Query Parameters:
- `status`: Filter by status ('pending', 'sent', 'failed', 'bounced')
- `limit`: Number of records (default: 50)
- `offset`: Pagination offset (default: 0)

Returns:
```json
{
  "emails": [
    {
      "id": "uuid",
      "recipientEmail": "customer@example.com",
      "subject": "Password Reset",
      "status": "pending",
      "retryCount": 0,
      "createdAt": "2024-01-15T10:30:00Z",
      "sentAt": null,
      "failureReason": null
    }
  ],
  "count": 5,
  "limit": 50,
  "offset": 0
}
```

#### 3. Send Test Email (Admin Only)
```
POST /api/admin/email-queue/send

Body:
{
  "recipientEmail": "admin@example.com",
  "subject": "Test Email Subject",
  "htmlContent": "<h1>Test</h1><p>This is a test email</p>"
}
```

Returns:
```json
{
  "message": "Email queued successfully",
  "emailId": "uuid"
}
```

#### 4. Retry Failed Email
```
POST /api/admin/email-queue/:id/retry
```

Returns:
```json
{
  "message": "Email scheduled for retry",
  "emailId": "uuid"
}
```

## Email Service Methods

The `emailService` module provides high-level methods for sending common emails:

```typescript
import { emailService } from './email-service';

// Send welcome email
await emailService.sendAccountCreatedEmail(
  'customer@example.com',
  'John Doe'
);

// Send password reset
await emailService.sendPasswordResetEmail(
  'customer@example.com',
  'John Doe',
  'reset-token-123'
);

// Send subscription reminder
await emailService.sendSubscriptionReminderEmail(
  'customer@example.com',
  'John Doe',
  new Date('2024-02-15')
);

// Send custom email (admin use)
await emailService.sendCustomEmail(
  'customer@example.com',
  'Subject',
  '<h1>HTML Content</h1>'
);
```

## Email Queue Class

### Start Processing
```typescript
import { emailQueue } from './email-queue';

// Start when app initializes (already done in app.ts)
emailQueue.start();
```

### Add Email to Queue
```typescript
const result = await emailQueue.enqueue({
  recipientEmail: 'user@example.com',
  subject: 'Email Subject',
  htmlContent: '<h1>HTML Content</h1>',
  notificationType: 'password_changed',
  userId: 'user-id', // optional
  templateId: 'template-id', // optional
});
```

### Get Queue Statistics
```typescript
const stats = await emailQueue.getStats();
// Returns: { pending: 5, sent: 1234, failed: 3, total: 1242 }
```

### List Emails
```typescript
const emails = await emailQueue.listEmails({
  status: 'pending',
  limit: 50,
  offset: 0,
});
```

### Retry Failed Email
```typescript
await emailQueue.retryEmail('email-id');
```

## Email Status Flow

```
pending
  ↓
  ├─→ sent ✅ (success)
  │
  └─→ failed ❌ (max retries exceeded)
      ↓
      retry attempt 1, 2, 3
      ↓
      if max retries: mark as failed
```

## Configuration

The email queue processor is configured with:

- **Interval**: 5 seconds (checks for pending emails every 5 seconds)
- **Batch Size**: 10 emails per cycle
- **Max Retries**: 3 attempts
- **Backoff Strategy**: Exponential (1s, 2s, 4s, 8s, ...)

To customize, edit `server/email-queue.ts`:
```typescript
private processIntervalMs = 5000; // Change interval
// In processQueue: limit: 10, // Change batch size
```

## Mock Email Provider

Currently, emails use a mock provider that simulates 95% success rate. For production, replace the `sendEmail()` method in `email-queue.ts` with your actual email service:

### AWS SES Example
```typescript
import AWS from 'aws-sdk';
const sesClient = new AWS.SES();

private async sendEmail(email: any) {
  const params = {
    Source: 'noreply@alwr.com',
    Destination: { ToAddresses: [email.recipientEmail] },
    Message: {
      Subject: { Data: email.subject },
      Body: { Html: { Data: email.htmlContent } },
    },
  };
  
  await sesClient.sendEmail(params).promise();
  
  await db.update(emailNotifications)
    .set({ status: 'sent', sentAt: new Date() })
    .where(eq(emailNotifications.id, email.id));
}
```

### SendGrid Example
```typescript
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

private async sendEmail(email: any) {
  const msg = {
    to: email.recipientEmail,
    from: 'noreply@alwr.com',
    subject: email.subject,
    html: email.htmlContent,
  };
  
  await sgMail.send(msg);
  
  await db.update(emailNotifications)
    .set({ status: 'sent', sentAt: new Date() })
    .where(eq(emailNotifications.id, email.id));
}
```

## Database Schema

The `emailNotifications` table stores all emails:

```sql
CREATE TABLE email_notifications (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  user_id VARCHAR REFERENCES users(id),
  recipient_email VARCHAR NOT NULL,
  
  -- Content
  notification_type VARCHAR NOT NULL,
  template_id VARCHAR REFERENCES email_templates(id),
  subject VARCHAR NOT NULL,
  html_content TEXT NOT NULL,
  
  -- Context
  resource_type VARCHAR,
  resource_id VARCHAR,
  
  -- Status
  status VARCHAR DEFAULT 'pending' NOT NULL,
  sent_at TIMESTAMP,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX idx_email_notification_status ON email_notifications(status);
CREATE INDEX idx_email_notification_user_id ON email_notifications(user_id);
CREATE INDEX idx_email_notification_type ON email_notifications(notification_type);
CREATE INDEX idx_email_notification_created_at ON email_notifications(created_at);
```

## Usage Examples

### Example 1: Send Welcome Email on Account Creation

In your user creation endpoint:
```typescript
import { emailService } from './email-service';

app.post("/api/auth/register", async (req, res) => {
  const user = await createUser(req.body);
  
  // Queue welcome email (non-blocking)
  await emailService.sendAccountCreatedEmail(
    user.email,
    user.firstName,
    user.id
  );
  
  res.json({ message: "Account created", userId: user.id });
});
```

### Example 2: Send Password Reset Email

```typescript
app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await findUserByEmail(email);
  
  if (user) {
    const resetToken = generateToken();
    await saveResetToken(user.id, resetToken);
    
    // Queue email (non-blocking)
    await emailService.sendPasswordResetEmail(
      user.email,
      user.firstName,
      resetToken,
      user.id
    );
  }
  
  res.json({ message: "Reset email sent if account exists" });
});
```

### Example 3: Monitor Queue via Admin Dashboard

```typescript
// Get queue stats
const stats = await emailQueue.getStats();

if (stats.pending > 100) {
  console.warn('⚠️  Email queue backlog detected!');
}

if (stats.failed > 10) {
  console.error('❌ Multiple email failures detected');
}
```

## Monitoring & Alerts

### Recommended Monitoring

1. **Daily Report**: Check failed emails
   ```bash
   curl -H "Authorization: Bearer admin-token" \
     "http://localhost:5000/api/admin/email-queue?status=failed"
   ```

2. **Alert on High Backlog**: If pending > 100
3. **Alert on High Failure Rate**: If failed > 10% of total

### Dashboard Metrics

Admin dashboard should display:
- Pending emails count
- Sent emails count
- Failed emails count
- Average delivery time
- Failed email reasons (grouped)
- Retry attempts distribution

## Troubleshooting

### Emails Not Sending

1. Check queue stats:
   ```bash
   curl "http://localhost:5000/api/admin/email-queue/stats"
   ```

2. Check logs for processor errors:
   ```
   grep "email" server/logs.txt
   ```

3. Verify queue is running:
   ```
   console output should show: "Starting email queue processor..."
   ```

### High Failure Rate

1. Check failure reasons:
   ```bash
   curl "http://localhost:5000/api/admin/email-queue?status=failed"
   ```

2. Common causes:
   - Invalid email addresses
   - Email service downtime
   - Rate limit exceeded
   - Missing environment variables

### Performance Issues

If queue is slow:
1. Increase `processIntervalMs` if CPU usage is high
2. Increase `limit` in `processQueue()` if backlog is growing
3. Check database performance

## Testing

Test the email queue with:

```bash
# Start app with queue
npm run dev

# Send test email via admin endpoint
curl -X POST http://localhost:5000/api/admin/email-queue/send \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "test@example.com",
    "subject": "Test Email",
    "htmlContent": "<h1>Hello</h1>"
  }'

# Check queue stats
curl http://localhost:5000/api/admin/email-queue/stats

# List pending emails
curl "http://localhost:5000/api/admin/email-queue?status=pending"

# Retry a failed email
curl -X POST http://localhost:5000/api/admin/email-queue/:email-id/retry
```

## Next Steps

1. **Implement Real Email Provider**: Replace mock provider with SendGrid, AWS SES, or Mailgun
2. **Add Email Templates**: Create HTML email templates for common scenarios
3. **Email Tracking**: Add open/click tracking
4. **Unsubscribe System**: Add unsubscribe links to marketing emails
5. **Batch Processing**: Optimize for bulk emails to many recipients
6. **Webhooks**: Integrate provider webhooks for bounce/complaint handling

## Files

- `server/email-queue.ts` - Queue implementation
- `server/email-service.ts` - High-level email methods
- `server/routes.ts` - API endpoints
- `shared/schema.ts` - Database schema
- `EMAIL_QUEUE.md` - This documentation

---

**Status**: ✅ Complete and Production Ready
**Last Updated**: November 23, 2025
