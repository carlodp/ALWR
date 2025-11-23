import { db } from "./db";
import { 
  users, customers, subscriptions, documents, documentVersions, emergencyAccessLogs, auditLogs, customerNotes,
  customerTags, physicalCardOrders, emailTemplates, emailNotifications,
  type User, type UpsertUser, type Customer, type InsertCustomer,
  type Subscription, type InsertSubscription, type Document, type InsertDocument,
  type DocumentVersion, type InsertDocumentVersion,
  type EmergencyAccessLog, type InsertEmergencyAccessLog,
  type AuditLog, type InsertAuditLog, type CustomerNote, type InsertCustomerNote,
  type CustomerTag, type InsertCustomerTag,
  type PhysicalCardOrder, type InsertPhysicalCardOrder,
  type EmailTemplate, type InsertEmailTemplate,
  type EmailNotification, type InsertEmailNotification
} from "@shared/schema";
import { eq, and, sql, desc, lte, gte } from "drizzle-orm";

export interface IStorage {
  // User Operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(userId: string, role: 'customer' | 'admin' | 'agent'): Promise<void>;
  updateUserStatus(userId: string, status: 'active' | 'suspended' | 'locked' | 'inactive'): Promise<void>;
  countUsersWithRole(role: 'customer' | 'admin' | 'agent'): Promise<number>;
  listAllUsers(limit?: number, offset?: number): Promise<User[]>;
  updateUserTwoFactor(userId: string, enabled: boolean, secret?: string, backupCodes?: string[]): Promise<User | undefined>;
  getUserTwoFactorStatus(userId: string): Promise<{ enabled: boolean; secret?: string; backupCodes?: string[] } | undefined>;
  setEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  verifyEmail(token: string): Promise<boolean>;
  setPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  resetPassword(token: string): Promise<string | undefined>;
  setPassword(userId: string, passwordHash: string): Promise<void>;
  recordLoginAttempt(userId: string, success: boolean): Promise<void>;
  lockAccount(userId: string, lockedUntil: Date): Promise<void>;

  // Customer Operations
  getCustomer(userId: string): Promise<Customer | undefined>;
  getCustomerById(customerId: string): Promise<Customer | undefined>;
  getCustomerByStripeId(stripeCustomerId: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(customerId: string, data: Partial<Customer>): Promise<Customer | undefined>;
  listCustomers(limit?: number, offset?: number): Promise<Customer[]>;
  searchCustomers(query: string): Promise<Customer[]>;

  // Customer Notes Operations
  createCustomerNote(note: InsertCustomerNote): Promise<CustomerNote>;
  listCustomerNotes(customerId: string): Promise<CustomerNote[]>;

  // Subscription Operations
  getSubscription(customerId: string): Promise<Subscription | undefined>;
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(subscriptionId: string, data: Partial<Subscription>): Promise<Subscription | undefined>;
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
    await db.delete(documents).where(eq(documents.id, documentId));
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
    const [customerCount] = await db.select({ count: sql<number>`count(*)` }).from(customers);
    const [activeSubCount] = await db.select({ count: sql<number>`count(*)` }).from(subscriptions).where(eq(subscriptions.status, 'active'));
    const [documentCount] = await db.select({ count: sql<number>`count(*)` }).from(documents);
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    const [expiringCount] = await db.select({ count: sql<number>`count(*)` }).from(subscriptions).where(
      and(
        eq(subscriptions.status, 'active'),
        lte(subscriptions.endDate, expiryDate)
      )
    );

    return {
      totalCustomers: customerCount.count,
      activeSubscriptions: activeSubCount.count,
      totalDocuments: documentCount.count,
      expiringSubscriptions: expiringCount.count,
    };
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
    await this.createAuditLog({
      userId,
      action: action as any,
      resourceType: 'user',
      resourceId: userId,
      status: 'success',
      details: { ipAddress, userAgent },
    });
  }
}

export const storage = new DatabaseStorage();
