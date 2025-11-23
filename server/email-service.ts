/**
 * Email Service
 * 
 * High-level email sending service that uses the queue system
 */

import { emailQueue } from './email-queue';

export class EmailService {
  /**
   * Send account created notification
   */
  async sendAccountCreatedEmail(
    recipientEmail: string,
    firstName: string,
    userId?: string
  ) {
    const subject = `Welcome to ALWR - Account Created`;
    const htmlContent = `
      <h2>Welcome to ALWR</h2>
      <p>Hello ${firstName},</p>
      <p>Your account has been successfully created in the America Living Will Registry.</p>
      <p>You can now log in and start managing your healthcare documents.</p>
      <a href="https://alwr.example.com/login">Login to Your Account</a>
      <p>If you need any assistance, please contact our support team.</p>
    `;

    return await emailQueue.enqueue({
      recipientEmail,
      subject,
      htmlContent,
      notificationType: 'account_created',
      userId,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    recipientEmail: string,
    firstName: string,
    resetToken: string,
    userId?: string
  ) {
    const subject = `ALWR - Password Reset Request`;
    const resetLink = `https://alwr.example.com/reset-password/${resetToken}`;
    const htmlContent = `
      <h2>Password Reset Request</h2>
      <p>Hello ${firstName},</p>
      <p>We received a request to reset your password.</p>
      <p><a href="${resetLink}">Click here to reset your password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    return await emailQueue.enqueue({
      recipientEmail,
      subject,
      htmlContent,
      notificationType: 'password_changed',
      userId,
    });
  }

  /**
   * Send subscription renewal reminder
   */
  async sendSubscriptionReminderEmail(
    recipientEmail: string,
    firstName: string,
    renewalDate: Date,
    userId?: string
  ) {
    const subject = `ALWR - Subscription Renewal Reminder`;
    const htmlContent = `
      <h2>Subscription Renewal Reminder</h2>
      <p>Hello ${firstName},</p>
      <p>Your ALWR subscription will expire on ${renewalDate.toLocaleDateString()}.</p>
      <p>Please renew your subscription to continue accessing your documents.</p>
      <a href="https://alwr.example.com/account/renew">Renew Subscription</a>
      <p>If you have questions, contact support.</p>
    `;

    return await emailQueue.enqueue({
      recipientEmail,
      subject,
      htmlContent,
      notificationType: 'renewal_reminder',
      userId,
    });
  }

  /**
   * Send emergency access alert
   */
  async sendEmergencyAccessAlertEmail(
    recipientEmail: string,
    firstName: string,
    accessorName: string,
    accessTime: Date,
    userId?: string
  ) {
    const subject = `ALWR - Emergency Document Access Alert`;
    const htmlContent = `
      <h2>Emergency Document Access Alert</h2>
      <p>Hello ${firstName},</p>
      <p>Your emergency documents were accessed by ${accessorName} on ${accessTime.toLocaleString()}.</p>
      <p>You can view the access log in your account.</p>
      <a href="https://alwr.example.com/account/access-log">View Access Log</a>
      <p>If this was not authorized, please contact us immediately.</p>
    `;

    return await emailQueue.enqueue({
      recipientEmail,
      subject,
      htmlContent,
      notificationType: 'emergency_access_alert',
      userId,
    });
  }

  /**
   * Send document uploaded notification
   */
  async sendDocumentUploadedEmail(
    recipientEmail: string,
    firstName: string,
    documentName: string,
    userId?: string
  ) {
    const subject = `ALWR - Document Uploaded`;
    const htmlContent = `
      <h2>Document Uploaded Successfully</h2>
      <p>Hello ${firstName},</p>
      <p>Your document "${documentName}" has been uploaded and stored securely.</p>
      <a href="https://alwr.example.com/documents">View Your Documents</a>
      <p>All documents are encrypted and can only be accessed by authorized personnel.</p>
    `;

    return await emailQueue.enqueue({
      recipientEmail,
      subject,
      htmlContent,
      notificationType: 'document_uploaded',
      userId,
    });
  }

  /**
   * Send payment received confirmation
   */
  async sendPaymentConfirmationEmail(
    recipientEmail: string,
    firstName: string,
    amount: number,
    invoiceId: string,
    userId?: string
  ) {
    const subject = `ALWR - Payment Received`;
    const htmlContent = `
      <h2>Payment Received</h2>
      <p>Hello ${firstName},</p>
      <p>We have received your payment of $${(amount / 100).toFixed(2)}.</p>
      <p>Invoice ID: ${invoiceId}</p>
      <a href="https://alwr.example.com/account/billing">View Receipt</a>
      <p>Thank you for your business!</p>
    `;

    return await emailQueue.enqueue({
      recipientEmail,
      subject,
      htmlContent,
      notificationType: 'payment_received',
      userId,
    });
  }

  /**
   * Send subscription expired notification
   */
  async sendSubscriptionExpiredEmail(
    recipientEmail: string,
    firstName: string,
    userId?: string
  ) {
    const subject = `ALWR - Subscription Expired`;
    const htmlContent = `
      <h2>Subscription Expired</h2>
      <p>Hello ${firstName},</p>
      <p>Your ALWR subscription has expired.</p>
      <p>Renew your subscription to continue accessing your documents.</p>
      <a href="https://alwr.example.com/account/renew">Renew Now</a>
      <p>Contact support if you need help.</p>
    `;

    return await emailQueue.enqueue({
      recipientEmail,
      subject,
      htmlContent,
      notificationType: 'subscription_expired',
      userId,
    });
  }

  /**
   * Send custom email (admin use)
   */
  async sendCustomEmail(
    recipientEmail: string,
    subject: string,
    htmlContent: string,
    userId?: string
  ) {
    return await emailQueue.enqueue({
      recipientEmail,
      subject,
      htmlContent,
      notificationType: 'renewal_reminder', // Use generic type
      userId,
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();
