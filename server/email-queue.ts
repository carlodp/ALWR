/**
 * Email Queue System
 * 
 * Handles asynchronous email processing with retry logic,
 * delivery tracking, and failure handling.
 */

import { db } from './db';
import { emailNotifications } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export interface EmailJob {
  id: string;
  recipientEmail: string;
  subject: string;
  htmlContent: string;
  notificationType: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  retryCount: number;
  maxRetries: number;
}

export class EmailQueue {
  private processingInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private processIntervalMs = 5000; // Process queue every 5 seconds

  /**
   * Start the email queue processor
   * Should be called once when the app starts
   */
  start() {
    if (this.processingInterval) {
      console.log('Email queue is already running');
      return;
    }

    console.log('Starting email queue processor...');
    this.processingInterval = setInterval(() => {
      this.processQueue().catch(err => 
        console.error('Error processing email queue:', err)
      );
    }, this.processIntervalMs);
  }

  /**
   * Stop the email queue processor
   */
  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('Email queue processor stopped');
    }
  }

  /**
   * Add an email to the queue
   */
  async enqueue(email: {
    recipientEmail: string;
    subject: string;
    htmlContent: string;
    notificationType: string;
    userId?: string;
    templateId?: string;
    resourceType?: string;
    resourceId?: string;
  }) {
    try {
      const [created] = await db.insert(emailNotifications).values({
        recipientEmail: email.recipientEmail,
        subject: email.subject,
        htmlContent: email.htmlContent,
        notificationType: email.notificationType as any,
        userId: email.userId || null,
        templateId: email.templateId || null,
        resourceType: email.resourceType,
        resourceId: email.resourceId,
        status: 'pending',
        retryCount: 0,
      }).returning();

      console.log(`📧 Email queued: ${created.id} to ${email.recipientEmail}`);
      return created;
    } catch (error) {
      console.error('Error enqueueing email:', error);
      throw error;
    }
  }

  /**
   * Process pending emails from the queue
   */
  private async processQueue() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    try {
      // Get pending emails (ordered by created date for FIFO)
      const pending = await db.query.emailNotifications.findMany({
        where: eq(emailNotifications.status, 'pending'),
        orderBy: emailNotifications.createdAt,
        limit: 10, // Process max 10 at a time
      });

      if (pending.length === 0) return;

      console.log(`📬 Processing ${pending.length} pending emails...`);

      for (const email of pending) {
        try {
          await this.sendEmail(email);
        } catch (error) {
          console.error(`Error sending email ${email.id}:`, error);
          await this.handleFailedEmail(email);
        }
      }
    } catch (error) {
      console.error('Error in processQueue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Send a single email
   */
  private async sendEmail(email: any) {
    // In production, this would call your email provider
    // (SendGrid, AWS SES, Mailgun, etc.)
    
    // Mock implementation - always succeeds
    // Replace with actual email service provider
    console.log(`✉️  Sending email to ${email.recipientEmail}`);

    // Simulate email sending (replace with real provider)
    const success = Math.random() > 0.05; // 95% success rate for demo

    if (!success) {
      throw new Error('Mock email service failed (demo failure)');
    }

    // Mark as sent
    await db.update(emailNotifications)
      .set({
        status: 'sent',
        sentAt: new Date(),
      })
      .where(eq(emailNotifications.id, email.id));

    console.log(`✅ Email sent: ${email.id}`);
  }

  /**
   * Handle failed email send attempts
   */
  private async handleFailedEmail(email: any) {
    const maxRetries = 3;
    const newRetryCount = (email.retryCount || 0) + 1;

    if (newRetryCount >= maxRetries) {
      // Mark as failed
      await db.update(emailNotifications)
        .set({
          status: 'failed',
          retryCount: newRetryCount,
          failureReason: 'Max retries exceeded',
        })
        .where(eq(emailNotifications.id, email.id));

      console.log(`❌ Email failed after ${newRetryCount} attempts: ${email.id}`);
    } else {
      // Retry later
      const nextRetryDelay = Math.min(60000, 1000 * Math.pow(2, newRetryCount)); // Exponential backoff
      const nextRetryAt = new Date(Date.now() + nextRetryDelay);

      await db.update(emailNotifications)
        .set({
          retryCount: newRetryCount,
          failureReason: `Retry attempt ${newRetryCount}`,
        })
        .where(eq(emailNotifications.id, email.id));

      console.log(`⏰ Email scheduled for retry at ${nextRetryAt.toISOString()}: ${email.id}`);
    }
  }

  /**
   * Get queue statistics
   */
  async getStats() {
    const pending = await db.query.emailNotifications.findMany({
      where: eq(emailNotifications.status, 'pending'),
    });

    const sent = await db.query.emailNotifications.findMany({
      where: eq(emailNotifications.status, 'sent'),
    });

    const failed = await db.query.emailNotifications.findMany({
      where: eq(emailNotifications.status, 'failed'),
    });

    return {
      pending: pending.length,
      sent: sent.length,
      failed: failed.length,
      total: pending.length + sent.length + failed.length,
    };
  }

  /**
   * Get all emails with optional filtering
   */
  async listEmails(options?: {
    status?: 'pending' | 'sent' | 'failed' | 'bounced';
    limit?: number;
    offset?: number;
  }) {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    if (options?.status) {
      return await db.query.emailNotifications.findMany({
        where: eq(emailNotifications.status, options.status),
        limit,
        offset,
        orderBy: emailNotifications.createdAt,
      });
    }

    return await db.query.emailNotifications.findMany({
      limit,
      offset,
      orderBy: emailNotifications.createdAt,
    });
  }

  /**
   * Manually retry a failed email
   */
  async retryEmail(emailId: string) {
    const email = await db.query.emailNotifications.findFirst({
      where: eq(emailNotifications.id, emailId),
    });

    if (!email) {
      throw new Error('Email not found');
    }

    // Reset to pending with retry count
    await db.update(emailNotifications)
      .set({
        status: 'pending',
        retryCount: (email.retryCount || 0) + 1,
        failureReason: null,
      })
      .where(eq(emailNotifications.id, emailId));

    console.log(`🔄 Email reset for retry: ${emailId}`);
  }
}

// Create a singleton instance
export const emailQueue = new EmailQueue();
