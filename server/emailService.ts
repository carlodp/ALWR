/**
 * Email Service - Abstraction layer for sending emails
 * Currently uses MOCK implementation for development
 * Ready to integrate SendGrid or other providers by replacing this file
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IEmailService {
  send(payload: EmailPayload): Promise<EmailResponse>;
}

/**
 * MockEmailService - Development/Testing Implementation
 * Logs emails to console instead of sending them
 * Ready to be swapped with SendGrid implementation when needed
 */
export class MockEmailService implements IEmailService {
  private readonly fromEmail = "noreply@alwr.com";

  async send(payload: EmailPayload): Promise<EmailResponse> {
    const { to, subject, html } = payload;
    
    try {
      // Log email to console for development
      console.log("📧 [MOCK EMAIL]", {
        from: this.fromEmail,
        to,
        subject,
        htmlLength: html.length,
        timestamp: new Date().toISOString(),
      });

      // Generate a mock message ID
      const mockMessageId = `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      return {
        success: true,
        messageId: mockMessageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ [MOCK EMAIL ERROR]", { to, subject, error: errorMessage });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

/**
 * SendGridEmailService - Production Implementation
 * To use SendGrid, replace MockEmailService with this in emailServiceInstance
 * Requires SENDGRID_API_KEY environment variable
 * 
 * Example implementation:
 * export class SendGridEmailService implements IEmailService {
 *   private readonly sgMail = require('@sendgrid/mail');
 *   
 *   constructor(apiKey: string) {
 *     this.sgMail.setApiKey(apiKey);
 *   }
 *   
 *   async send(payload: EmailPayload): Promise<EmailResponse> {
 *     try {
 *       const msg = {
 *         to: payload.to,
 *         from: payload.from || 'noreply@alwr.com',
 *         subject: payload.subject,
 *         html: payload.html,
 *       };
 *       const response = await this.sgMail.send(msg);
 *       return {
 *         success: true,
 *         messageId: response[0].headers['x-message-id'],
 *       };
 *     } catch (error) {
 *       return {
 *         success: false,
 *         error: error instanceof Error ? error.message : 'Unknown error',
 *       };
 *     }
 *   }
 * }
 */

// Initialize with mock service by default
export const emailService: IEmailService = new MockEmailService();
