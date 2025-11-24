import { db } from "./db";
import { 
  users, customers, subscriptions, documents, documentVersions, emergencyAccessLogs, auditLogs, customerNotes,
  customerTags, physicalCardOrders, emailTemplates, emailNotifications, agents, agentCustomerAssignments,
  resellers, resellerCustomerReferrals, failedLoginAttempts, dataExports, reportSchedules, reportHistory, systemSettings,
  apiKeys, savedSearches,
  type User, type UpsertUser, type Customer, type InsertCustomer,
  type Subscription, type InsertSubscription, type Document, type InsertDocument,
  type DocumentVersion, type InsertDocumentVersion,
  type EmergencyAccessLog, type InsertEmergencyAccessLog,
  type AuditLog, type InsertAuditLog, type CustomerNote, type InsertCustomerNote,
  type CustomerTag, type InsertCustomerTag,
  type PhysicalCardOrder, type InsertPhysicalCardOrder,
  type EmailTemplate, type InsertEmailTemplate,
  type EmailNotification, type InsertEmailNotification,
  type Agent, type InsertAgent, type AgentCustomerAssignment, type InsertAgentCustomerAssignment,
  type Reseller, type InsertReseller, type ResellerCustomerReferral, type InsertResellerCustomerReferral,
  type FailedLoginAttempt, type InsertFailedLoginAttempt,
  type DataExport, type InsertDataExport, type ReportSchedule, type InsertReportSchedule,
  type ReportHistory, type InsertReportHistory, type SystemSettings, type InsertSystemSettings,
  type ApiKey, type InsertApiKey, type SavedSearch, type InsertSavedSearch
} from "@shared/schema";
import { eq, and, sql, desc, lte, gte } from "drizzle-orm";
import { encryptField, decryptField } from "./encryption";

/**
 * SECURITY #7: Column-Level Encryption for PII
 * 
 * This storage layer should implement encryption/decryption for sensitive fields.
 * When storing PII, use encryptField(); when retrieving, use decryptField().
 * 
 * Fields that should be encrypted:
 * - users.email (when storing/retrieving)
 * - users.firstName (when storing/retrieving)
 * - users.lastName (when storing/retrieving)
 * - customers.emergencyContactName (when storing/retrieving)
 * - customers.emergencyContactPhone (when storing/retrieving)
 * - documents.content (if contains sensitive healthcare info)
 * 
 * Example implementation for future enhancement:
 * 
 * async getUser(id: string): Promise<User | undefined> {
 *   const user = await db.query.users.findFirst({ where: eq(users.id, id) });
 *   if (user && user.email) {
 *     user.email = decryptField(user.email);
 *     user.firstName = user.firstName ? decryptField(user.firstName) : undefined;
 *     user.lastName = user.lastName ? decryptField(user.lastName) : undefined;
 *   }
 *   return user;
 * }
 * 
 * async upsertUser(user: UpsertUser): Promise<User> {
 *   const encrypted = { ...user };
 *   if (encrypted.email) encrypted.email = encryptField(encrypted.email);
 *   if (encrypted.firstName) encrypted.firstName = encryptField(encrypted.firstName);
 *   if (encrypted.lastName) encrypted.lastName = encryptField(encrypted.lastName);
 *   // ... rest of upsert logic
 * }
 * 
 * MIGRATION NOTES:
 * - For existing unencrypted data, run one-time migration to encrypt all PII
 * - Encryption happens transparently at storage layer
 * - Decryption happens when data is retrieved (invisible to routes)
 * - See server/secrets-rotation-policy.md for key rotation procedures
 */

/**
 * Storage Interface - All Database Operations
 * 
 * Centralized interface for all database CRUD operations.
 * Implement encryption/decryption at this layer for PII fields.
 * 
 * All methods return Promise<T> for async database operations.
 */
export interface IStorage {
  // ========== User Operations ==========
  
  /**
   * Get user by ID
   * @param id User ID
   * @returns User or undefined if not found
   */
  getUser(id: string): Promise<User | undefined>;
  
  /**
   * Get user by email address
   * @param email User email
   * @returns User or undefined if not found
   */
  getUserByEmail(email: string): Promise<User | undefined>;
  
  /**
   * Create or update a user (upsert)
   * @param user User data (email, password hash, name, etc)
   * @returns Created/updated user
   */
  upsertUser(user: UpsertUser): Promise<User>;
  
  /**
   * Update user role (customer → admin, etc)
   * @param userId User to update
   * @param role New role
   */
  updateUserRole(userId: string, role: 'customer' | 'admin' | 'agent'): Promise<void>;
  
  /**
   * Update user account status
   * @param userId User to update
   * @param status active, suspended, locked, or inactive
   */
  updateUserStatus(userId: string, status: 'active' | 'suspended' | 'locked' | 'inactive'): Promise<void>;
  
  /**
   * Count users with specific role
   * @param role Role to count
   * @returns Total count
   */
  countUsersWithRole(role: 'customer' | 'admin' | 'agent'): Promise<number>;
  
  /**
   * List all users with pagination
   * @param limit Results per page
   * @param offset Starting position
   * @returns Array of users
   */
  listAllUsers(limit?: number, offset?: number): Promise<User[]>;
  
  /**
   * Update user's two-factor authentication settings
   * @param userId User to update
   * @param enabled Enable/disable 2FA
   * @param secret TOTP secret (if enabling)
   * @param backupCodes Backup codes for 2FA recovery
   */
  updateUserTwoFactor(userId: string, enabled: boolean, secret?: string, backupCodes?: string[]): Promise<User | undefined>;
  
  /**
   * Get user's two-factor authentication status
   * @param userId User to check
   * @returns 2FA status and secret (if enabled)
   */
  getUserTwoFactorStatus(userId: string): Promise<{ enabled: boolean; secret?: string; backupCodes?: string[] } | undefined>;
  
  /**
   * Set email verification token (for account verification flow)
   * @param userId User to verify
   * @param token Verification token
   * @param expiresAt Token expiration time
   */
  setEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  
  /**
   * Mark email as verified using token
   * @param token Verification token
   * @returns True if verified, false if token invalid/expired
   */
  verifyEmail(token: string): Promise<boolean>;
  
  /**
   * Set password reset token (for forgot password flow)
   * @param userId User requesting reset
   * @param token Reset token
   * @param expiresAt Token expiration time
   */
  setPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  
  /**
   * Get user ID from password reset token and mark as used
   * @param token Reset token
   * @returns User ID if valid, undefined if invalid/expired
   */
  resetPassword(token: string): Promise<string | undefined>;
  
  /**
   * Set user's password hash
   * @param userId User to update
   * @param passwordHash bcrypt hash of new password
   */
  setPassword(userId: string, passwordHash: string): Promise<void>;
  
  /**
   * Record login attempt (successful or failed)
   * Used for account locking after failed attempts
   * @param userId User attempting login
   * @param success Whether login was successful
   */
  recordLoginAttempt(userId: string, success: boolean): Promise<void>;
  
  /**
   * Lock user account temporarily after failed login attempts
   * @param userId User to lock
   * @param lockedUntil When the lock expires
   */
  lockAccount(userId: string, lockedUntil: Date): Promise<void>;

  // Agent Operations
  createAgent(data: InsertAgent): Promise<Agent>;
  getAgent(agentId: string): Promise<Agent | undefined>;
  getAgentByUserId(userId: string): Promise<Agent | undefined>;
  listAgents(limit?: number, offset?: number): Promise<Agent[]>;
  updateAgent(agentId: string, data: Partial<InsertAgent>): Promise<Agent | undefined>;
  deleteAgent(agentId: string): Promise<void>;
  
  // Agent-Customer Assignments
  assignCustomerToAgent(agentId: string, customerId: string): Promise<AgentCustomerAssignment>;
  unassignCustomer(agentId: string, customerId: string): Promise<void>;
  getAgentCustomers(agentId: string): Promise<AgentCustomerAssignment[]>;
  getCustomerAgent(customerId: string): Promise<Agent | undefined>;
  updateAssignment(assignmentId: string, data: Partial<AgentCustomerAssignment>): Promise<AgentCustomerAssignment | undefined>;

  // Reseller Operations
  createReseller(data: InsertReseller): Promise<Reseller>;
  getReseller(resellerId: string): Promise<Reseller | undefined>;
  getResellerByUserId(userId: string): Promise<Reseller | undefined>;
  listResellers(limit?: number, offset?: number): Promise<Reseller[]>;
  updateReseller(resellerId: string, data: Partial<InsertReseller>): Promise<Reseller | undefined>;
  deleteReseller(resellerId: string): Promise<void>;
  
  // Reseller-Customer Referrals
  addCustomerToReseller(resellerId: string, customerId: string): Promise<ResellerCustomerReferral>;
  getResellerCustomers(resellerId: string): Promise<ResellerCustomerReferral[]>;
  getCustomerReseller(customerId: string): Promise<Reseller | undefined>;
  updateReferral(referralId: string, data: Partial<ResellerCustomerReferral>): Promise<ResellerCustomerReferral | undefined>;

  // Customer Operations
  getCustomer(userId: string): Promise<Customer | undefined>;
  getCustomerById(customerId: string): Promise<Customer | undefined>;
  getCustomerByStripeId(stripeCustomerId: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(customerId: string, data: Partial<Customer>): Promise<Customer | undefined>;
  deleteCustomer(customerId: string): Promise<void>;
  listCustomers(limit?: number, offset?: number): Promise<Customer[]>;
  searchCustomers(query: string): Promise<Customer[]>;

  // Customer Notes Operations
  createCustomerNote(note: InsertCustomerNote): Promise<CustomerNote>;
  listCustomerNotes(customerId: string): Promise<CustomerNote[]>;

  // Subscription Operations
  getSubscription(customerId: string): Promise<Subscription | undefined>;
  getSubscriptionsByCustomer(customerId: string): Promise<Subscription[]>;
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(subscriptionId: string, data: Partial<Subscription>): Promise<Subscription | undefined>;
  deleteSubscription(subscriptionId: string): Promise<void>;
  listExpiringSubscriptions(daysUntilExpiry: number): Promise<Subscription[]>;

  // Document Operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(documentId: string): Promise<Document | undefined>;
  listDocumentsByCustomer(customerId: string): Promise<Document[]>;
  deleteDocument(documentId: string): Promise<void>;
  bulkDeleteDocuments(documentIds: string[]): Promise<number>; // Returns count deleted
  incrementDocumentAccess(documentId: string): Promise<void>;
  
  // Document Versioning
  createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion>;
  listDocumentVersions(documentId: string): Promise<DocumentVersion[]>;
  restoreDocumentVersion(documentId: string, versionNumber: number): Promise<Document | undefined>;

  // Emergency Access Operations
  verifyEmergencyAccess(idCardNumber: string, lastName: string, birthYear: string): Promise<Customer | undefined>;
  logEmergencyAccess(log: InsertEmergencyAccessLog): Promise<EmergencyAccessLog>;
  listEmergencyAccessLogs(customerId: string): Promise<EmergencyAccessLog[]>;

  // Audit Logging
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  listAuditLogs(limit?: number, offset?: number): Promise<AuditLog[]>;
  listAuditLogsFiltered(filters: {
    limit?: number;
    offset?: number;
    action?: string;
    status?: 'success' | 'failed';
    resourceType?: string;
    dateFrom?: string;
    dateTo?: string;
    searchQuery?: string;
  }): Promise<AuditLog[]>;
  
  // Failed Login Attempts (Security)
  recordFailedLogin(log: InsertFailedLoginAttempt): Promise<FailedLoginAttempt>;
  listFailedLoginAttempts(email: string, hours?: number): Promise<FailedLoginAttempt[]>;
  getFailedLoginCountByIp(ipAddress: string, hours?: number): Promise<number>;
  
  // Data Exports
  createDataExport(data: InsertDataExport): Promise<DataExport>;
  getDataExport(exportId: string): Promise<DataExport | undefined>;
  listCustomerDataExports(customerId: string): Promise<DataExport[]>;
  updateDataExportStatus(exportId: string, status: 'pending' | 'processing' | 'ready' | 'failed', errorMessage?: string): Promise<DataExport | undefined>;
  updateDataExportFile(exportId: string, storageKey: string, fileSize: number): Promise<DataExport | undefined>;
  incrementDataExportDownloadCount(exportId: string): Promise<void>;
  deleteExpiredDataExports(): Promise<number>; // Returns count deleted

  // Report Schedules
  createReportSchedule(data: InsertReportSchedule & { nextScheduledAt: Date }): Promise<ReportSchedule>;
  getReportSchedule(scheduleId: string): Promise<ReportSchedule | undefined>;
  listReportSchedules(userId: string): Promise<ReportSchedule[]>;
  updateReportSchedule(scheduleId: string, data: Partial<ReportSchedule>): Promise<ReportSchedule | undefined>;
  deleteReportSchedule(scheduleId: string): Promise<void>;

  // Report History
  createReportHistory(data: InsertReportHistory & { generatedAt?: Date }): Promise<ReportHistory>;
  listReportHistory(userId: string): Promise<ReportHistory[]>;
  getReportHistoryBySchedule(scheduleId: string): Promise<ReportHistory[]>;

  // System Settings
  getSystemSettings(): Promise<SystemSettings | undefined>;
  updateSystemSettings(updates: Partial<InsertSystemSettings>): Promise<SystemSettings | undefined>;

  // Customer Tags
  addCustomerTag(tag: InsertCustomerTag): Promise<CustomerTag>;
  removeCustomerTag(customerId: string, tag: string): Promise<void>;
  listCustomerTags(customerId: string): Promise<CustomerTag[]>;
  
  // Physical Card Orders
  createPhysicalCardOrder(order: InsertPhysicalCardOrder): Promise<PhysicalCardOrder>;
  getPhysicalCardOrder(orderId: string): Promise<PhysicalCardOrder | undefined>;
  listPhysicalCardOrders(customerId: string): Promise<PhysicalCardOrder[]>;
  updatePhysicalCardOrder(orderId: string, data: Partial<PhysicalCardOrder>): Promise<PhysicalCardOrder | undefined>;
  
  // Email Templates
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  getEmailTemplate(name: string): Promise<EmailTemplate | undefined>;
  listEmailTemplates(): Promise<EmailTemplate[]>;
  updateEmailTemplate(templateId: string, data: Partial<EmailTemplate>): Promise<EmailTemplate | undefined>;

  // Email Notifications
  createEmailNotification(notification: InsertEmailNotification): Promise<EmailNotification>;
  listEmailNotifications(userId: string, limit?: number): Promise<EmailNotification[]>;
  listPendingEmailNotifications(limit?: number): Promise<EmailNotification[]>;
  updateEmailNotificationStatus(notificationId: string, status: 'sent' | 'failed' | 'bounced', failureReason?: string): Promise<EmailNotification | undefined>;
  
  // Referral Tracking
  generateReferralCode(): string;
  getReferralsByCustomer(customerId: string): Promise<Customer[]>;

  // Global Search
  globalSearch(query: string, limit?: number): Promise<any[]>;

  // Bulk Operations
  exportCustomersToCSV(filters?: { tags?: string[]; status?: string }): Promise<string>; // Returns CSV string
  
  // Session Management (for audit logging)
  logUserSession(userId: string, action: 'login' | 'logout', ipAddress?: string, userAgent?: string): Promise<void>;

  // Dashboard Stats
  getDashboardStats(): Promise<{
    totalCustomers: number;
    activeSubscriptions: number;
    totalDocuments: number;
    expiringSubscriptions: number;
  }>;

  // Analytics
  getSubscriptionsForAnalytics(): Promise<Subscription[]>;
  listDocuments(): Promise<Document[]>;

  // API Keys (SECURITY #8)
  createApiKey(key: InsertApiKey): Promise<ApiKey>;
  getApiKeyById(keyId: string): Promise<ApiKey | undefined>;
  getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined>;
  listApiKeys(userId: string): Promise<ApiKey[]>;
  updateApiKeyUsage(keyId: string): Promise<void>;
  revokeApiKey(keyId: string, revokedBy: string): Promise<ApiKey | undefined>;
  deleteApiKey(keyId: string): Promise<void>;
  listValidApiKeys(userId: string): Promise<ApiKey[]>; // Not expired, not revoked
}

export class DatabaseStorage implements IStorage {
  // ============================================================================
  // USER OPERATIONS
  // ============================================================================

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    return result;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    return result;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const existing = user.email ? await this.getUserByEmail(user.email) : undefined;
    
    if (existing) {
      const [updated] = await db.update(users)
        .set({ 
          ...user, 
          updatedAt: new Date() 
        })
        .where(eq(users.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUserRole(userId: string, role: 'customer' | 'admin' | 'agent'): Promise<void> {
    await db.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUserStatus(userId: string, status: 'active' | 'suspended' | 'locked' | 'inactive'): Promise<void> {
    // For now, we'll update the account status via the customers table if customer exists
    // In the future, we could add a status column directly to users table
    const customer = await this.getCustomer(userId);
    if (customer) {
      await db.update(customers)
        .set({ accountStatus: status === 'active' ? 'active' : 'expired', updatedAt: new Date() })
        .where(eq(customers.id, customer.id));
    }
  }

  async countUsersWithRole(role: 'customer' | 'admin' | 'agent'): Promise<number> {
    const result = await db.query.users.findMany({
      where: eq(users.role, role),
    });
    return result.length;
  }

  async setEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db.update(users)
      .set({ emailVerificationToken: token, emailVerificationTokenExpiresAt: expiresAt })
      .where(eq(users.id, userId));
  }

  async verifyEmail(token: string): Promise<boolean> {
    const user = await db.query.users.findFirst({
      where: eq(users.emailVerificationToken, token),
    });

    if (!user || !user.emailVerificationTokenExpiresAt || new Date() > user.emailVerificationTokenExpiresAt) {
      return false;
    }

    await db.update(users)
      .set({ 
        emailVerified: true, 
        emailVerificationToken: undefined,
        emailVerificationTokenExpiresAt: undefined,
        updatedAt: new Date() 
      })
      .where(eq(users.id, user.id));

    return true;
  }

  async setPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db.update(users)
      .set({ passwordResetToken: token, passwordResetTokenExpiresAt: expiresAt })
      .where(eq(users.id, userId));
  }

  async resetPassword(token: string): Promise<string | undefined> {
    const user = await db.query.users.findFirst({
      where: eq(users.passwordResetToken, token),
    });

    if (!user || !user.passwordResetTokenExpiresAt || new Date() > user.passwordResetTokenExpiresAt) {
      return undefined;
    }

    // Return userId for the password reset to be completed by the client
    await db.update(users)
      .set({ 
        passwordResetToken: undefined,
        passwordResetTokenExpiresAt: undefined,
        passwordResetAttempts: 0,
        updatedAt: new Date() 
      })
      .where(eq(users.id, user.id));

    return user.id;
  }

  async setPassword(userId: string, passwordHash: string): Promise<void> {
    await db.update(users)
      .set({ 
        passwordHash, 
        loginAttempts: 0,
        lockedUntil: undefined,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async recordLoginAttempt(userId: string, success: boolean): Promise<void> {
    if (success) {
      await db.update(users)
        .set({ 
          lastLoginAt: new Date(),
          loginAttempts: 0,
          lockedUntil: undefined,
          updatedAt: new Date() 
        })
        .where(eq(users.id, userId));
    } else {
      const user = await this.getUser(userId);
      if (user) {
        const newAttempts = (user.loginAttempts || 0) + 1;
        await db.update(users)
          .set({ 
            loginAttempts: newAttempts,
            updatedAt: new Date() 
          })
          .where(eq(users.id, userId));
      }
    }
  }

  async lockAccount(userId: string, lockedUntil: Date): Promise<void> {
    await db.update(users)
      .set({ 
        lockedUntil,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async createAgent(data: InsertAgent): Promise<Agent> {
    const [agent] = await db.insert(agents).values(data).returning();
    return agent;
  }

  async getAgent(agentId: string): Promise<Agent | undefined> {
    return db.query.agents.findFirst({
      where: eq(agents.id, agentId),
    });
  }

  async getAgentByUserId(userId: string): Promise<Agent | undefined> {
    return db.query.agents.findFirst({
      where: eq(agents.userId, userId),
    });
  }

  async listAgents(limit: number = 1000, offset: number = 0): Promise<Agent[]> {
    return db.query.agents.findMany({
      limit,
      offset,
    });
  }

  async updateAgent(agentId: string, data: Partial<InsertAgent>): Promise<Agent | undefined> {
    const [updated] = await db.update(agents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(agents.id, agentId))
      .returning();
    return updated;
  }

  async deleteAgent(agentId: string): Promise<void> {
    // Soft delete - mark as inactive
    await db.update(agents)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(eq(agents.id, agentId));
  }

  async assignCustomerToAgent(agentId: string, customerId: string): Promise<AgentCustomerAssignment> {
    // Check if already assigned
    const existing = await db.query.agentCustomerAssignments.findFirst({
      where: and(
        eq(agentCustomerAssignments.agentId, agentId),
        eq(agentCustomerAssignments.customerId, customerId),
        eq(agentCustomerAssignments.isActive, true),
      ),
    });

    if (existing) {
      return existing;
    }

    // Create new assignment
    const [assignment] = await db.insert(agentCustomerAssignments)
      .values({ agentId, customerId, isActive: true })
      .returning();

    // Update agent stats
    const agent = await this.getAgent(agentId);
    if (agent) {
      await this.updateAgent(agentId, {
        totalCustomersAssigned: (agent.totalCustomersAssigned || 0) + 1,
      });
    }

    return assignment;
  }

  async unassignCustomer(agentId: string, customerId: string): Promise<void> {
    await db.update(agentCustomerAssignments)
      .set({ isActive: false, unassignedAt: new Date(), updatedAt: new Date() })
      .where(and(
        eq(agentCustomerAssignments.agentId, agentId),
        eq(agentCustomerAssignments.customerId, customerId),
      ));
  }

  async getAgentCustomers(agentId: string): Promise<AgentCustomerAssignment[]> {
    return db.query.agentCustomerAssignments.findMany({
      where: and(
        eq(agentCustomerAssignments.agentId, agentId),
        eq(agentCustomerAssignments.isActive, true),
      ),
    });
  }

  async getCustomerAgent(customerId: string): Promise<Agent | undefined> {
    const assignment = await db.query.agentCustomerAssignments.findFirst({
      where: and(
        eq(agentCustomerAssignments.customerId, customerId),
        eq(agentCustomerAssignments.isActive, true),
      ),
    });

    if (!assignment) return undefined;

    return this.getAgent(assignment.agentId);
  }

  async updateAssignment(assignmentId: string, data: Partial<AgentCustomerAssignment>): Promise<AgentCustomerAssignment | undefined> {
    const [updated] = await db.update(agentCustomerAssignments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(agentCustomerAssignments.id, assignmentId))
      .returning();
    return updated;
  }

  async createReseller(data: InsertReseller): Promise<Reseller> {
    const [reseller] = await db.insert(resellers).values(data).returning();
    return reseller;
  }

  async getReseller(resellerId: string): Promise<Reseller | undefined> {
    return db.query.resellers.findFirst({
      where: eq(resellers.id, resellerId),
    });
  }

  async getResellerByUserId(userId: string): Promise<Reseller | undefined> {
    return db.query.resellers.findFirst({
      where: eq(resellers.userId, userId),
    });
  }

  async listResellers(limit: number = 1000, offset: number = 0): Promise<Reseller[]> {
    return db.query.resellers.findMany({
      limit,
      offset,
    });
  }

  async updateReseller(resellerId: string, data: Partial<InsertReseller>): Promise<Reseller | undefined> {
    const [updated] = await db.update(resellers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(resellers.id, resellerId))
      .returning();
    return updated;
  }

  async deleteReseller(resellerId: string): Promise<void> {
    await db.update(resellers)
      .set({ status: 'inactive', updatedAt: new Date() })
      .where(eq(resellers.id, resellerId));
  }

  async addCustomerToReseller(resellerId: string, customerId: string): Promise<ResellerCustomerReferral> {
    const [referral] = await db.insert(resellerCustomerReferrals)
      .values({ resellerId, customerId })
      .returning();

    const reseller = await this.getReseller(resellerId);
    if (reseller) {
      await this.updateReseller(resellerId, {
        totalCustomersReferred: (reseller.totalCustomersReferred || 0) + 1,
      });
    }

    return referral;
  }

  async getResellerCustomers(resellerId: string): Promise<ResellerCustomerReferral[]> {
    return db.query.resellerCustomerReferrals.findMany({
      where: eq(resellerCustomerReferrals.resellerId, resellerId),
    });
  }

  async getCustomerReseller(customerId: string): Promise<Reseller | undefined> {
    const referral = await db.query.resellerCustomerReferrals.findFirst({
      where: eq(resellerCustomerReferrals.customerId, customerId),
    });

    if (!referral) return undefined;

    return this.getReseller(referral.resellerId);
  }

  async updateReferral(referralId: string, data: Partial<ResellerCustomerReferral>): Promise<ResellerCustomerReferral | undefined> {
    const [updated] = await db.update(resellerCustomerReferrals)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(resellerCustomerReferrals.id, referralId))
      .returning();
    return updated;
  }

  async listAllUsers(limit: number = 1000, offset: number = 0): Promise<User[]> {
    const result = await db.query.users.findMany({
      limit,
      offset,
      orderBy: (users) => desc(users.createdAt),
    });
    return result;
  }

  // ============================================================================
  // CUSTOMER OPERATIONS
  // ============================================================================

  async getCustomer(userId: string): Promise<Customer | undefined> {
    const result = await db.query.customers.findFirst({
      where: eq(customers.userId, userId),
    });
    return result;
  }

  async getCustomerById(customerId: string): Promise<Customer | undefined> {
    const result = await db.query.customers.findFirst({
      where: eq(customers.id, customerId),
    });
    return result;
  }

  async getCustomerByStripeId(stripeCustomerId: string): Promise<Customer | undefined> {
    const result = await db.query.customers.findFirst({
      where: eq(customers.stripeCustomerId, stripeCustomerId),
    });
    return result;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [created] = await db.insert(customers).values(customer).returning();
    return created;
  }

  async updateCustomer(customerId: string, data: Partial<Customer>): Promise<Customer | undefined> {
    const [updated] = await db.update(customers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customers.id, customerId))
      .returning();
    return updated;
  }

  async listCustomers(limit: number = 100, offset: number = 0): Promise<Customer[]> {
    const result = await db.query.customers.findMany({
      limit,
      offset,
      orderBy: desc(customers.createdAt),
    });
    return result;
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    // Search by ID card number, phone, or user email
    const result = await db.query.customers.findMany({
      where: sql`
        ${customers.idCardNumber} ILIKE ${'%' + query + '%'} OR
        ${customers.phone} ILIKE ${'%' + query + '%'}
      `,
      limit: 50,
    });
    return result;
  }

  // ============================================================================
  // CUSTOMER NOTES OPERATIONS
  // ============================================================================

  async createCustomerNote(note: InsertCustomerNote): Promise<CustomerNote> {
    const [created] = await db.insert(customerNotes).values(note).returning();
    return created;
  }

  async listCustomerNotes(customerId: string): Promise<CustomerNote[]> {
    const result = await db.query.customerNotes.findMany({
      where: eq(customerNotes.customerId, customerId),
      orderBy: desc(customerNotes.createdAt),
      with: {
        user: true,
      },
    });
    return result as CustomerNote[];
  }

  // ============================================================================
  // SUBSCRIPTION OPERATIONS
  // ============================================================================

  async getSubscription(customerId: string): Promise<Subscription | undefined> {
    const result = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.customerId, customerId),
      orderBy: desc(subscriptions.createdAt),
    });
    return result;
  }

  async getSubscriptionsByCustomer(customerId: string): Promise<Subscription[]> {
    const result = await db.query.subscriptions.findMany({
      where: eq(subscriptions.customerId, customerId),
      orderBy: desc(subscriptions.createdAt),
    });
    return result;
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined> {
    const result = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId),
    });
    return result;
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [created] = await db.insert(subscriptions).values(subscription).returning();
    return created;
  }

  async updateSubscription(subscriptionId: string, data: Partial<Subscription>): Promise<Subscription | undefined> {
    const [updated] = await db.update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.id, subscriptionId))
      .returning();
    return updated;
  }

  async listExpiringSubscriptions(daysUntilExpiry: number): Promise<Subscription[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

    const result = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.status, 'active'),
        lte(subscriptions.endDate, expiryDate)
      ),
    });
    return result;
  }

  async listAllSubscriptions(limit: number = 100, offset: number = 0): Promise<any[]> {
    const result = await db.query.subscriptions.findMany({
      limit,
      offset,
      orderBy: desc(subscriptions.createdAt),
      with: {
        customer: {
          with: {
            user: true,
          },
        },
      },
    });
    return result;
  }

  async getSubscriptionById(subscriptionId: string): Promise<any> {
    const result = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, subscriptionId),
      with: {
        customer: {
          with: {
            user: true,
          },
        },
      },
    });
    return result;
  }

  // ============================================================================
  // DOCUMENT OPERATIONS
  // ============================================================================

  async createDocument(document: InsertDocument): Promise<Document> {
    const [created] = await db.insert(documents).values(document).returning();
    return created;
  }

  async getDocument(documentId: string): Promise<Document | undefined> {
    const result = await db.query.documents.findFirst({
      where: eq(documents.id, documentId),
    });
    return result;
  }

  async listDocumentsByCustomer(customerId: string): Promise<Document[]> {
    const result = await db.query.documents.findMany({
      where: eq(documents.customerId, customerId),
      orderBy: desc(documents.createdAt),
    });
    return result;
  }

  async deleteDocument(documentId: string): Promise<void> {
    // Delete document versions first (cascade)
    await db.delete(documentVersions).where(eq(documentVersions.documentId, documentId));
    // Then delete the document
    await db.delete(documents).where(eq(documents.id, documentId));
  }

  async deleteCustomer(customerId: string): Promise<void> {
    const customer = await this.getCustomerById(customerId);
    if (!customer) return;
    
    // Delete all related data
    await db.delete(documents).where(eq(documents.customerId, customerId));
    await db.delete(subscriptions).where(eq(subscriptions.customerId, customerId));
    await db.delete(customerNotes).where(eq(customerNotes.customerId, customerId));
    await db.delete(emergencyAccessLogs).where(eq(emergencyAccessLogs.customerId, customerId));
    await db.delete(customers).where(eq(customers.id, customerId));
    
    // Delete user account
    if (customer.userId) {
      await db.delete(users).where(eq(users.id, customer.userId));
    }
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    await db.delete(subscriptions).where(eq(subscriptions.id, subscriptionId));
  }

  async incrementDocumentAccess(documentId: string): Promise<void> {
    await db.update(documents)
      .set({ 
        accessCount: sql`${documents.accessCount} + 1`,
        lastAccessedAt: new Date()
      })
      .where(eq(documents.id, documentId));
  }

  // ============================================================================
  // DOCUMENT VERSIONING OPERATIONS
  // ============================================================================

  async createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion> {
    const [created] = await db.insert(documentVersions).values(version).returning();
    return created;
  }

  async listDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    const versions = await db.query.documentVersions.findMany({
      where: eq(documentVersions.documentId, documentId),
      orderBy: desc(documentVersions.version),
    });
    return versions;
  }

  async restoreDocumentVersion(documentId: string, versionNumber: number): Promise<Document | undefined> {
    const version = await db.query.documentVersions.findFirst({
      where: and(
        eq(documentVersions.documentId, documentId),
        eq(documentVersions.version, versionNumber)
      ),
    });

    if (!version) return undefined;

    const [updated] = await db.update(documents)
      .set({ 
        fileName: version.fileName,
        fileSize: version.fileSize,
        mimeType: version.mimeType,
        storageKey: version.storageKey,
        encryptionKey: version.encryptionKey,
        currentVersion: versionNumber,
        updatedAt: new Date()
      })
      .where(eq(documents.id, documentId))
      .returning();
    
    return updated;
  }

  // ============================================================================
  // EMERGENCY ACCESS OPERATIONS
  // ============================================================================

  async verifyEmergencyAccess(
    idCardNumber: string,
    lastName: string,
    birthYear: string
  ): Promise<Customer | undefined> {
    // Verify ID card number matches and get customer
    const customer = await db.query.customers.findFirst({
      where: eq(customers.idCardNumber, idCardNumber),
      with: {
        user: true,
      },
    });

    if (!customer || !customer.user) {
      return undefined;
    }

    // Verify last name matches (case insensitive)
    const lastNameMatches = customer.user.lastName?.toLowerCase() === lastName.toLowerCase();
    
    // For birth year verification, you'd typically have a DOB field in the user table
    // For MVP, we'll just verify the ID card number and last name
    if (!lastNameMatches) {
      return undefined;
    }

    return customer;
  }

  async logEmergencyAccess(log: InsertEmergencyAccessLog): Promise<EmergencyAccessLog> {
    const [created] = await db.insert(emergencyAccessLogs).values(log).returning();
    return created;
  }

  async listEmergencyAccessLogs(customerId: string): Promise<EmergencyAccessLog[]> {
    const result = await db.query.emergencyAccessLogs.findMany({
      where: eq(emergencyAccessLogs.customerId, customerId),
      orderBy: desc(emergencyAccessLogs.createdAt),
    });
    return result;
  }

  // ============================================================================
  // AUDIT LOGGING
  // ============================================================================

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  async listAuditLogs(limit: number = 100, offset: number = 0): Promise<AuditLog[]> {
    const result = await db.query.auditLogs.findMany({
      limit,
      offset,
      orderBy: desc(auditLogs.createdAt),
    });
    return result;
  }

  async listAuditLogsFiltered(filters: {
    limit?: number;
    offset?: number;
    action?: string;
    status?: 'success' | 'failed';
    resourceType?: string;
    dateFrom?: string;
    dateTo?: string;
    searchQuery?: string;
  }): Promise<AuditLog[]> {
    const {
      limit = 100,
      offset = 0,
      action,
      status,
      resourceType,
      dateFrom,
      dateTo,
      searchQuery,
    } = filters;

    const conditions: any[] = [];

    if (action && action !== 'all') {
      conditions.push(eq(auditLogs.action, action));
    }

    if (status === 'success') {
      conditions.push(eq(auditLogs.success, true));
    } else if (status === 'failed') {
      conditions.push(eq(auditLogs.success, false));
    }

    if (resourceType && resourceType !== 'all') {
      conditions.push(eq(auditLogs.resourceType, resourceType));
    }

    if (dateFrom) {
      conditions.push(gte(auditLogs.createdAt, new Date(dateFrom)));
    }

    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(lte(auditLogs.createdAt, endOfDay));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    let result = await db.query.auditLogs.findMany({
      limit,
      offset,
      where,
      orderBy: desc(auditLogs.createdAt),
    });

    if (searchQuery && searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter(log =>
        log.actorName.toLowerCase().includes(searchLower) ||
        log.resourceId.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }

  // ============================================================================
  // FAILED LOGIN ATTEMPTS (Security)
  // ============================================================================

  async recordFailedLogin(log: InsertFailedLoginAttempt): Promise<FailedLoginAttempt> {
    const [created] = await db.insert(failedLoginAttempts).values(log).returning();
    return created;
  }

  async listFailedLoginAttempts(email: string, hours: number = 24): Promise<FailedLoginAttempt[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return db.query.failedLoginAttempts.findMany({
      where: and(
        eq(failedLoginAttempts.email, email),
        gte(failedLoginAttempts.createdAt, since)
      ),
      orderBy: desc(failedLoginAttempts.createdAt),
      limit: 100,
    });
  }

  async getFailedLoginCountByIp(ipAddress: string, hours: number = 24): Promise<number> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const result = await db.query.failedLoginAttempts.findMany({
      where: and(
        eq(failedLoginAttempts.ipAddress, ipAddress),
        gte(failedLoginAttempts.createdAt, since)
      ),
    });
    return result.length;
  }

  // ============================================================================
  // DATA EXPORTS
  // ============================================================================

  async createDataExport(data: InsertDataExport): Promise<DataExport> {
    const [created] = await db.insert(dataExports).values(data).returning();
    return created;
  }

  async getDataExport(exportId: string): Promise<DataExport | undefined> {
    return db.query.dataExports.findFirst({
      where: eq(dataExports.id, exportId),
    });
  }

  async listCustomerDataExports(customerId: string): Promise<DataExport[]> {
    return db.query.dataExports.findMany({
      where: eq(dataExports.customerId, customerId),
      orderBy: desc(dataExports.createdAt),
    });
  }

  async updateDataExportStatus(exportId: string, status: 'pending' | 'processing' | 'ready' | 'failed', errorMessage?: string): Promise<DataExport | undefined> {
    const updates: any = { status };
    if (errorMessage) updates.errorMessage = errorMessage;
    if (status === 'processing') updates.processingStartedAt = new Date();
    if (status === 'ready') updates.completedAt = new Date();
    
    const [updated] = await db.update(dataExports)
      .set(updates)
      .where(eq(dataExports.id, exportId))
      .returning();
    return updated;
  }

  async updateDataExportFile(exportId: string, storageKey: string, fileSize: number): Promise<DataExport | undefined> {
    const [updated] = await db.update(dataExports)
      .set({ storageKey, fileSize })
      .where(eq(dataExports.id, exportId))
      .returning();
    return updated;
  }

  async incrementDataExportDownloadCount(exportId: string): Promise<void> {
    const current = await this.getDataExport(exportId);
    if (current) {
      await db.update(dataExports)
        .set({ downloadCount: (current.downloadCount || 0) + 1 })
        .where(eq(dataExports.id, exportId));
    }
  }

  async deleteExpiredDataExports(): Promise<number> {
    const now = new Date();
    const deleted = await db.delete(dataExports).where(
      lte(dataExports.expiresAt, now)
    );
    return 0; // Drizzle doesn't return count easily
  }

  // ============================================================================
  // CUSTOMER TAGS
  // ============================================================================

  async addCustomerTag(tag: InsertCustomerTag): Promise<CustomerTag> {
    const [created] = await db.insert(customerTags).values(tag).returning();
    return created;
  }

  async removeCustomerTag(customerId: string, tagName: string): Promise<void> {
    await db.delete(customerTags).where(
      and(
        eq(customerTags.customerId, customerId),
        eq(customerTags.tag, tagName)
      )
    );
  }

  async listCustomerTags(customerId: string): Promise<CustomerTag[]> {
    const result = await db.query.customerTags.findMany({
      where: eq(customerTags.customerId, customerId),
    });
    return result;
  }

  // ============================================================================
  // PHYSICAL CARD ORDERS
  // ============================================================================

  async createPhysicalCardOrder(order: InsertPhysicalCardOrder): Promise<PhysicalCardOrder> {
    const [created] = await db.insert(physicalCardOrders).values(order).returning();
    return created;
  }

  async getPhysicalCardOrder(orderId: string): Promise<PhysicalCardOrder | undefined> {
    return db.query.physicalCardOrders.findFirst({
      where: eq(physicalCardOrders.id, orderId),
    });
  }

  async listPhysicalCardOrders(customerId: string): Promise<PhysicalCardOrder[]> {
    return db.query.physicalCardOrders.findMany({
      where: eq(physicalCardOrders.customerId, customerId),
      orderBy: desc(physicalCardOrders.requestedAt),
    });
  }

  async updatePhysicalCardOrder(orderId: string, data: Partial<PhysicalCardOrder>): Promise<PhysicalCardOrder | undefined> {
    const [updated] = await db.update(physicalCardOrders)
      .set(data)
      .where(eq(physicalCardOrders.id, orderId))
      .returning();
    return updated;
  }

  // ============================================================================
  // EMAIL TEMPLATES
  // ============================================================================

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [created] = await db.insert(emailTemplates).values(template).returning();
    return created;
  }

  async getEmailTemplate(name: string): Promise<EmailTemplate | undefined> {
    return db.query.emailTemplates.findFirst({
      where: eq(emailTemplates.name, name),
    });
  }

  async listEmailTemplates(): Promise<EmailTemplate[]> {
    return db.query.emailTemplates.findMany({
      where: eq(emailTemplates.isActive, true),
    });
  }

  async updateEmailTemplate(templateId: string, data: Partial<EmailTemplate>): Promise<EmailTemplate | undefined> {
    const [updated] = await db.update(emailTemplates)
      .set(data)
      .where(eq(emailTemplates.id, templateId))
      .returning();
    return updated;
  }

  // ============================================================================
  // REFERRAL TRACKING
  // ============================================================================

  generateReferralCode(): string {
    // Generate a unique referral code like ALWR-ABC123
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'ALWR-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async getReferralsByCustomer(customerId: string): Promise<Customer[]> {
    const result = await db.query.customers.findMany({
      where: eq(customers.referredByCustomerId, customerId),
    });
    return result;
  }

  // ============================================================================
  // GLOBAL SEARCH
  // ============================================================================

  async globalSearch(query: string, limit: number = 50): Promise<any[]> {
    const searchTerm = `%${query}%`;
    
    // Search customers by name, email, phone, ID card number
    const customerResults = await db.query.customers.findMany({
      where: sql`
        ${customers.idCardNumber} ILIKE ${searchTerm} OR
        ${customers.phone} ILIKE ${searchTerm}
      `,
      with: {
        user: true,
      },
      limit: limit / 3,
    });

    // Search documents by title
    const documentResults = await db.query.documents.findMany({
      where: sql`
        ${documents.title} ILIKE ${searchTerm} OR
        ${documents.fileName} ILIKE ${searchTerm}
      `,
      limit: limit / 3,
    });

    // Search audit logs by action or resource
    const auditResults = await db.query.auditLogs.findMany({
      where: sql`
        ${auditLogs.action} ILIKE ${searchTerm} OR
        ${auditLogs.actorName} ILIKE ${searchTerm} OR
        ${auditLogs.resourceId} ILIKE ${searchTerm}
      `,
      limit: limit / 3,
      orderBy: desc(auditLogs.createdAt),
    });

    // Format results
    const results: any[] = [
      ...customerResults.map(c => ({
        type: 'customer',
        id: c.id,
        title: c.user?.email || 'Unknown Customer',
        description: c.phone || 'No phone',
        customerId: c.id,
        email: c.user?.email,
        timestamp: c.createdAt?.toISOString(),
      })),
      ...documentResults.map(d => ({
        type: 'document',
        id: d.id,
        title: d.title,
        description: d.fileName,
        customerId: d.customerId,
        timestamp: d.uploadedAt?.toISOString(),
      })),
      ...auditResults.map(a => ({
        type: 'audit_log',
        id: a.id,
        title: a.action,
        description: `${a.actorName} on ${a.resourceId}`,
        timestamp: a.createdAt?.toISOString(),
      })),
    ];

    return results.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeB - timeA;
    }).slice(0, limit);
  }

  // ============================================================================
  // DASHBOARD STATS
  // ============================================================================

  async getDashboardStats(): Promise<{
    totalCustomers: number;
    activeSubscriptions: number;
    totalDocuments: number;
    expiringSubscriptions: number;
  }> {
    // Get all customers
    const allCustomers = await db.query.customers.findMany();
    const totalCustomers = allCustomers.length;

    // Get active subscriptions
    const activeSubscriptions = await db.query.subscriptions.findMany({
      where: eq(subscriptions.status, 'active'),
    });
    const activeSubscriptionsCount = activeSubscriptions.length;

    // Get all documents
    const allDocuments = await db.query.documents.findMany();
    const totalDocuments = allDocuments.length;

    // Get expiring subscriptions (within 30 days)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    const expiringSubscriptions = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.status, 'active'),
        lte(subscriptions.endDate, expiryDate)
      ),
    });
    const expiringSubscriptionsCount = expiringSubscriptions.length;

    return {
      totalCustomers,
      activeSubscriptions: activeSubscriptionsCount,
      totalDocuments,
      expiringSubscriptions: expiringSubscriptionsCount,
    };
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  async getSubscriptionsForAnalytics(): Promise<Subscription[]> {
    return await db.query.subscriptions.findMany();
  }

  async listDocuments(): Promise<Document[]> {
    return await db.query.documents.findMany();
  }

  // ============================================================================
  // EMAIL NOTIFICATIONS
  // ============================================================================

  async createEmailNotification(notification: InsertEmailNotification): Promise<EmailNotification> {
    const [result] = await db.insert(emailNotifications).values(notification).returning();
    return result;
  }

  async listEmailNotifications(userId: string, limit = 50): Promise<EmailNotification[]> {
    return await db.query.emailNotifications.findMany({
      where: eq(emailNotifications.userId, userId),
      limit,
      orderBy: desc(emailNotifications.createdAt),
    });
  }

  async listPendingEmailNotifications(limit = 50): Promise<EmailNotification[]> {
    return await db.query.emailNotifications.findMany({
      where: eq(emailNotifications.status, 'pending'),
      limit,
      orderBy: emailNotifications.createdAt,
    });
  }

  async updateEmailNotificationStatus(
    notificationId: string,
    status: 'sent' | 'failed' | 'bounced',
    failureReason?: string
  ): Promise<EmailNotification | undefined> {
    const updateData: any = { status };
    if (status === 'sent') {
      updateData.sentAt = new Date();
    }
    if (failureReason && status === 'failed') {
      updateData.failureReason = failureReason;
    }

    const [result] = await db
      .update(emailNotifications)
      .set(updateData)
      .where(eq(emailNotifications.id, notificationId))
      .returning();

    return result;
  }

  // ============================================================================
  // TWO-FACTOR AUTHENTICATION
  // ============================================================================

  async updateUserTwoFactor(
    userId: string,
    enabled: boolean,
    secret?: string,
    backupCodes?: string[]
  ): Promise<User | undefined> {
    const updateData: any = { twoFactorEnabled: enabled };
    if (secret) {
      updateData.twoFactorSecret = secret;
    }
    if (backupCodes) {
      updateData.twoFactorBackupCodes = JSON.stringify(backupCodes);
    }

    const [result] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    return result;
  }

  async getUserTwoFactorStatus(userId: string): Promise<{ enabled: boolean; secret?: string; backupCodes?: string[] } | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    return {
      enabled: user.twoFactorEnabled,
      secret: user.twoFactorSecret || undefined,
      backupCodes: user.twoFactorBackupCodes ? JSON.parse(user.twoFactorBackupCodes) : undefined,
    };
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async bulkDeleteDocuments(documentIds: string[]): Promise<number> {
    if (documentIds.length === 0) return 0;

    // Delete all versions first
    await db.delete(documentVersions).where(
      documentVersions.documentId.inArray(documentIds)
    );

    // Delete documents
    const result = await db.delete(documents).where(
      documents.id.inArray(documentIds)
    );

    return documentIds.length;
  }

  async exportCustomersToCSV(filters?: { tags?: string[]; status?: string }): Promise<string> {
    let customerList = await this.listCustomers(10000, 0);

    // Apply filters
    if (filters?.status) {
      customerList = customerList.filter(c => c.accountStatus === filters.status);
    }

    // Build CSV
    const headers = [
      'Customer ID',
      'Name',
      'Email',
      'Phone',
      'City',
      'State',
      'Account Status',
      'ID Card Number',
      'Created Date',
    ];

    const rows = customerList.map(customer => {
      const user = customer.userId;
      return [
        customer.id,
        customer.firstName + ' ' + customer.lastName || 'N/A',
        customer.email || 'N/A',
        customer.phone || 'N/A',
        customer.city || 'N/A',
        customer.state || 'N/A',
        customer.accountStatus,
        customer.idCardNumber || 'N/A',
        customer.createdAt ? new Date(customer.createdAt).toISOString() : 'N/A',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  async logUserSession(userId: string, action: 'login' | 'logout', ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      // Fetch user to get their name and role for audit log
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        console.warn(`User ${userId} not found for session logging`);
        return;
      }

      const actorName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
      const actorRole = user.role || 'unknown';

      await this.createAuditLog({
        userId,
        actorName,
        actorRole,
        action: action as any,
        resourceType: 'user',
        resourceId: userId,
        success: true,
        details: { ipAddress, userAgent },
      });
    } catch (error) {
      console.error('Failed to log user session:', error);
      // Don't throw - we don't want failed audit logging to break logout/login
    }
  }

  // ============================================================================
  // REPORT SCHEDULING
  // ============================================================================

  async createReportSchedule(data: InsertReportSchedule & { nextScheduledAt: Date }): Promise<ReportSchedule> {
    const [created] = await db.insert(reportSchedules).values(data).returning();
    return created;
  }

  async getReportSchedule(scheduleId: string): Promise<ReportSchedule | undefined> {
    return await db.query.reportSchedules.findFirst({
      where: eq(reportSchedules.id, scheduleId),
    });
  }

  async listReportSchedules(userId: string): Promise<ReportSchedule[]> {
    return await db.query.reportSchedules.findMany({
      where: eq(reportSchedules.userId, userId),
    });
  }

  async updateReportSchedule(scheduleId: string, data: Partial<ReportSchedule>): Promise<ReportSchedule | undefined> {
    const [updated] = await db.update(reportSchedules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(reportSchedules.id, scheduleId))
      .returning();
    return updated;
  }

  async deleteReportSchedule(scheduleId: string): Promise<void> {
    await db.delete(reportSchedules).where(eq(reportSchedules.id, scheduleId));
  }

  async createReportHistory(data: InsertReportHistory & { generatedAt?: Date }): Promise<ReportHistory> {
    const [created] = await db.insert(reportHistory).values(data).returning();
    return created;
  }

  async listReportHistory(userId: string): Promise<ReportHistory[]> {
    return await db.query.reportHistory.findMany({
      orderBy: [desc(reportHistory.generatedAt)],
      limit: 50,
    });
  }

  async getReportHistoryBySchedule(scheduleId: string): Promise<ReportHistory[]> {
    return await db.query.reportHistory.findMany({
      where: eq(reportHistory.scheduleId, scheduleId),
      orderBy: [desc(reportHistory.generatedAt)],
    });
  }

  // ============================================================================
  // SYSTEM SETTINGS
  // ============================================================================

  async getSystemSettings(): Promise<SystemSettings | undefined> {
    const result = await db.query.systemSettings.findFirst();
    return result;
  }

  async updateSystemSettings(updates: Partial<InsertSystemSettings>): Promise<SystemSettings | undefined> {
    let settings = await this.getSystemSettings();
    
    if (!settings) {
      // Create default settings if none exist
      const [newSettings] = await db
        .insert(systemSettings)
        .values({
          idleTimeoutEnabled: true,
          idleWarningMinutes: 25,
          idleCountdownMinutes: 5,
          sessionTimeoutMinutes: 30,
          maxConcurrentSessions: 5,
          rateLimitEnabled: true,
          requestsPerMinute: 60,
          failedLoginLockoutThreshold: 5,
          maxUploadSizeMB: 10,
          twoFactorAuthRequired: false,
        })
        .returning();
      settings = newSettings;
    }
    
    if (!settings) return undefined;
    
    const [updated] = await db
      .update(systemSettings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(systemSettings.id, settings.id))
      .returning();
    
    return updated;
  }

  // ============================================================================
  // API KEYS (SECURITY #8)
  // ============================================================================

  async createApiKey(key: InsertApiKey): Promise<ApiKey> {
    const [created] = await db.insert(apiKeys).values(key).returning();
    return created;
  }

  async getApiKeyById(keyId: string): Promise<ApiKey | undefined> {
    return await db.query.apiKeys.findFirst({
      where: eq(apiKeys.id, keyId),
    });
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined> {
    return await db.query.apiKeys.findFirst({
      where: eq(apiKeys.keyHash, keyHash),
    });
  }

  async listApiKeys(userId: string): Promise<ApiKey[]> {
    return await db.query.apiKeys.findMany({
      where: eq(apiKeys.createdBy, userId),
      orderBy: [desc(apiKeys.createdAt)],
    });
  }

  async updateApiKeyUsage(keyId: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({
        lastUsedAt: new Date(),
        usageCount: sql`${apiKeys.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, keyId));
  }

  async revokeApiKey(keyId: string, revokedBy: string): Promise<ApiKey | undefined> {
    const [updated] = await db
      .update(apiKeys)
      .set({
        isRevoked: true,
        revokedAt: new Date(),
        revokedBy,
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, keyId))
      .returning();
    return updated;
  }

  async deleteApiKey(keyId: string): Promise<void> {
    await db.delete(apiKeys).where(eq(apiKeys.id, keyId));
  }

  async listValidApiKeys(userId: string): Promise<ApiKey[]> {
    const now = new Date();
    return await db.query.apiKeys.findMany({
      where: and(
        eq(apiKeys.createdBy, userId),
        eq(apiKeys.isRevoked, false),
      ),
      orderBy: [desc(apiKeys.createdAt)],
    });
  }

  // ============================================================================
  // ADVANCED SEARCH - SAVED SEARCHES
  // ============================================================================

  async createSavedSearch(data: InsertSavedSearch): Promise<SavedSearch> {
    const [created] = await db.insert(savedSearches).values(data).returning();
    return created;
  }

  async getSavedSearch(searchId: string): Promise<SavedSearch | undefined> {
    return await db.query.savedSearches.findFirst({
      where: eq(savedSearches.id, searchId),
    });
  }

  async listSavedSearches(userId: string): Promise<SavedSearch[]> {
    return await db.query.savedSearches.findMany({
      where: eq(savedSearches.userId, userId),
      orderBy: [desc(savedSearches.createdAt)],
    });
  }

  async updateSavedSearch(searchId: string, data: Partial<InsertSavedSearch>): Promise<SavedSearch | undefined> {
    const [updated] = await db.update(savedSearches)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(savedSearches.id, searchId))
      .returning();
    return updated;
  }

  async deleteSavedSearch(searchId: string): Promise<void> {
    await db.delete(savedSearches).where(eq(savedSearches.id, searchId));
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  async bulkCreateCustomers(customersData: InsertCustomer[]): Promise<Customer[]> {
    if (customersData.length === 0) return [];
    const created = await db.insert(customers).values(customersData).returning();
    return created;
  }

  async bulkUpdateSubscriptionStatus(subscriptionIds: string[], newStatus: string): Promise<number> {
    const result = await db
      .update(subscriptions)
      .set({ status: newStatus as any, updatedAt: new Date() })
      .where((subs) =>
        sql`${subs.id} = ANY(${sql.raw(`ARRAY[${subscriptionIds.map((id) => `'${id}'`).join(', ')}]`)})`
      );
    return subscriptionIds.length;
  }

  async bulkDeleteDocuments(documentIds: string[]): Promise<number> {
    if (documentIds.length === 0) return 0;
    await db.delete(documentVersions)
      .where((dv) =>
        sql`${dv.documentId} = ANY(${sql.raw(`ARRAY[${documentIds.map((id) => `'${id}'`).join(', ')}]`)})`
      );
    await db.delete(documents)
      .where((doc) =>
        sql`${doc.id} = ANY(${sql.raw(`ARRAY[${documentIds.map((id) => `'${id}'`).join(', ')}]`)})`
      );
    return documentIds.length;
  }

  async bulkAddCustomerTags(customerIds: string[], tags: string[]): Promise<number> {
    if (customerIds.length === 0 || tags.length === 0) return 0;
    
    const tagInserts: InsertCustomerTag[] = [];
    for (const customerId of customerIds) {
      for (const tag of tags) {
        tagInserts.push({
          customerId,
          tag,
        } as InsertCustomerTag);
      }
    }
    
    if (tagInserts.length > 0) {
      await db.insert(customerTags).values(tagInserts).onConflictDoNothing();
    }
    return tagInserts.length;
  }

  async bulkRemoveCustomerTags(customerIds: string[], tags: string[]): Promise<number> {
    if (customerIds.length === 0 || tags.length === 0) return 0;
    
    let deleted = 0;
    for (const customerId of customerIds) {
      const result = await db.delete(customerTags)
        .where(
          and(
            eq(customerTags.customerId, customerId),
            sql`${customerTags.tag} = ANY(${sql.raw(`ARRAY[${tags.map((t) => `'${t}'`).join(', ')}]`)})`
          )
        );
      deleted++;
    }
    return deleted;
  }

  async bulkSendEmails(emailData: InsertEmailNotification[]): Promise<EmailNotification[]> {
    if (emailData.length === 0) return [];
    const created = await db.insert(emailNotifications).values(emailData).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
