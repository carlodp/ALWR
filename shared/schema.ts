import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum('alwr_user_role', ['customer', 'admin', 'agent']);
export const accountStatusEnum = pgEnum('alwr_account_status', ['active', 'expired']);
export const subscriptionStatusEnum = pgEnum('alwr_subscription_status', [
  'active',
  'inactive',
  'cancelled',
  'pending',
  'trial'
]);
export const documentTypeEnum = pgEnum('alwr_document_type', [
  'living_will',
  'healthcare_directive',
  'power_of_attorney',
  'dnr',
  'other'
]);
export const auditActionEnum = pgEnum('alwr_audit_action', [
  'document_upload',
  'document_view',
  'document_download',
  'document_delete',
  'document_bulk_delete',
  'emergency_access',
  'profile_update',
  'subscription_create',
  'subscription_update',
  'customer_create',
  'customer_update',
  'customer_export',
  'two_factor_enable',
  'two_factor_disable',
  'login',
  'logout'
]);

export const emailNotificationTypeEnum = pgEnum('alwr_email_notification_type', [
  'renewal_reminder',
  'emergency_access_alert',
  'password_changed',
  'account_created',
  'document_uploaded',
  'payment_received',
  'subscription_expired'
]);

export const emailStatusEnum = pgEnum('alwr_email_status', [
  'pending',
  'sent',
  'failed',
  'bounced'
]);

export const twoFactorMethodEnum = pgEnum('alwr_2fa_method', [
  'totp',
  'email',
  'backup_code'
]);

// ============================================================================
// AUTHENTICATION TABLES (Required by Replit Auth)
// ============================================================================

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Required for Replit Auth with role extension
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('customer').notNull(),
  
  // Email Verification
  emailVerified: boolean("email_verified").default(false).notNull(),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationTokenExpiresAt: timestamp("email_verification_token_expires_at"),
  
  // Password Reset
  passwordResetToken: varchar("password_reset_token"),
  passwordResetTokenExpiresAt: timestamp("password_reset_token_expires_at"),
  passwordResetAttempts: integer("password_reset_attempts").default(0),
  
  // Two-Factor Authentication (TOTP-based)
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  twoFactorSecret: varchar("two_factor_secret"), // Encrypted in production
  twoFactorBackupCodes: text("two_factor_backup_codes"), // JSON array of backup codes
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// CUSTOMER MANAGEMENT
// ============================================================================

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Account Status (separate from subscription status)
  accountStatus: accountStatusEnum("account_status").default('active').notNull(),
  
  // Contact Information
  phone: varchar("phone"),
  address: text("address"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  
  // Emergency Contact
  emergencyContactName: varchar("emergency_contact_name"),
  emergencyContactPhone: varchar("emergency_contact_phone"),
  emergencyContactRelationship: varchar("emergency_contact_relationship"),
  
  // ID Card Information
  idCardNumber: varchar("id_card_number").unique(),
  idCardIssuedDate: timestamp("id_card_issued_date"),
  currentVersion: integer("current_version").default(1),
  
  // Referral Tracking
  referralCode: varchar("referral_code").unique(),
  referredByCustomerId: varchar("referred_by_customer_id").references(() => customers.id),
  
  // Stripe Integration
  stripeCustomerId: varchar("stripe_customer_id").unique(),
  
  // Metadata
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_customer_user_id").on(table.userId),
  index("idx_customer_stripe_id").on(table.stripeCustomerId),
  index("idx_customer_referral_code").on(table.referralCode),
]);

// ============================================================================
// CUSTOMER TAGS & SEGMENTS
// ============================================================================

export const customerTags = pgTable("customer_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  tag: varchar("tag").notNull(), // e.g., "Rotary", "Seminars", "Direct", "Agent"
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_customer_tags_customer_id").on(table.customerId),
  index("idx_customer_tags_tag").on(table.tag),
]);

// ============================================================================
// PHYSICAL CARD ORDERS
// ============================================================================

const cardOrderStatusEnum = pgEnum('alwr_card_order_status', [
  'requested',
  'printed',
  'shipped',
  'delivered',
  'cancelled'
]);

export const physicalCardOrders = pgTable("physical_card_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  idCardNumber: varchar("id_card_number").notNull(),
  
  // Address for mailing
  recipientName: varchar("recipient_name").notNull(),
  recipientAddress: text("recipient_address").notNull(),
  recipientCity: varchar("recipient_city").notNull(),
  recipientState: varchar("recipient_state").notNull(),
  recipientZip: varchar("recipient_zip").notNull(),
  
  // Order tracking
  status: cardOrderStatusEnum("status").default('requested').notNull(),
  trackingNumber: varchar("tracking_number"),
  requestedAt: timestamp("requested_at").defaultNow(),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  
  // Cost
  shippingCost: integer("shipping_cost"), // in cents
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_card_order_customer_id").on(table.customerId),
  index("idx_card_order_status").on(table.status),
]);

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(), // e.g., "Renewal Reminder", "Welcome"
  subject: varchar("subject").notNull(),
  content: text("content").notNull(), // HTML content
  category: varchar("category"), // e.g., "auto", "manual", "system"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  
  // Stripe Integration
  stripeSubscriptionId: varchar("stripe_subscription_id").unique(),
  stripePriceId: varchar("stripe_price_id"),
  
  // Subscription Details
  status: subscriptionStatusEnum("status").default('pending').notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  renewalDate: timestamp("renewal_date"),
  
  // Pricing
  amount: integer("amount").notNull(), // in cents
  currency: varchar("currency", { length: 3 }).default('usd').notNull(),
  
  // Notifications
  renewalReminderSent: boolean("renewal_reminder_sent").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_subscription_customer_id").on(table.customerId),
  index("idx_subscription_status").on(table.status),
  index("idx_subscription_end_date").on(table.endDate),
]);

// ============================================================================
// DOCUMENT MANAGEMENT
// ============================================================================

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  
  // Document Details
  fileName: varchar("file_name").notNull(),
  fileType: documentTypeEnum("file_type").notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  mimeType: varchar("mime_type").notNull(),
  
  // Storage
  storageKey: varchar("storage_key").notNull().unique(), // S3/cloud storage key
  encryptionKey: varchar("encryption_key"), // For encrypted storage
  
  // Metadata
  description: text("description"),
  uploadedBy: varchar("uploaded_by").references(() => users.id).notNull(),
  
  // Versioning
  currentVersion: integer("current_version").default(1).notNull(),
  
  // Access Tracking
  accessCount: integer("access_count").default(0),
  lastAccessedAt: timestamp("last_accessed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_document_customer_id").on(table.customerId),
  index("idx_document_uploaded_by").on(table.uploadedBy),
]);

// Document versions - track all versions of documents
export const documentVersions = pgTable("document_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").references(() => documents.id).notNull(),
  version: integer("version").notNull(),
  
  // File Details
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type").notNull(),
  
  // Storage
  storageKey: varchar("storage_key").notNull(),
  encryptionKey: varchar("encryption_key"),
  
  // Metadata
  uploadedBy: varchar("uploaded_by").references(() => users.id).notNull(),
  changeNotes: text("change_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_document_version_document_id").on(table.documentId),
  index("idx_document_version_uploaded_by").on(table.uploadedBy),
]);

// ============================================================================
// EMERGENCY ACCESS SYSTEM
// ============================================================================

export const emergencyAccessLogs = pgTable("emergency_access_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  
  // Access Details
  accessorName: varchar("accessor_name").notNull(),
  accessorRole: varchar("accessor_role").notNull(), // e.g., "Doctor", "EMT", "Hospital Staff"
  accessorOrganization: varchar("accessor_organization"),
  accessorPhone: varchar("accessor_phone"),
  
  // Verification
  idCardNumber: varchar("id_card_number").notNull(),
  verificationMethod: varchar("verification_method").notNull(), // e.g., "ID Card + DOB", "ID Card + Last 4 SSN"
  verificationData: text("verification_data"), // Encrypted verification details
  
  // Access Result
  accessGranted: boolean("access_granted").notNull(),
  accessReason: text("access_reason"), // Why access was denied if false
  documentsAccessed: jsonb("documents_accessed"), // Array of document IDs
  
  // Tracking
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  
  // Notification
  customerNotified: boolean("customer_notified").default(false),
  notificationSentAt: timestamp("notification_sent_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_emergency_access_customer_id").on(table.customerId),
  index("idx_emergency_access_created_at").on(table.createdAt),
]);

// ============================================================================
// CUSTOMER NOTES
// ============================================================================

export const customerNotes = pgTable("customer_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  noteText: text("note_text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_customer_notes_customer_id").on(table.customerId),
  index("idx_customer_notes_created_at").on(table.createdAt),
]);

// ============================================================================
// AUDIT LOGGING (HIPAA Compliance)
// ============================================================================

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Actor
  userId: varchar("user_id").references(() => users.id),
  actorName: varchar("actor_name").notNull(), // User name or "System" or external accessor
  actorRole: varchar("actor_role").notNull(),
  
  // Action
  action: auditActionEnum("action").notNull(),
  resourceType: varchar("resource_type").notNull(), // e.g., "document", "customer", "subscription"
  resourceId: varchar("resource_id").notNull(),
  
  // Details
  details: jsonb("details"), // Additional context about the action
  changesBefore: jsonb("changes_before"), // State before change
  changesAfter: jsonb("changes_after"), // State after change
  
  // Tracking
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  
  // Status
  success: boolean("success").notNull().default(true),
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_audit_log_user_id").on(table.userId),
  index("idx_audit_log_action").on(table.action),
  index("idx_audit_log_resource").on(table.resourceType, table.resourceId),
  index("idx_audit_log_created_at").on(table.createdAt),
]);

// ============================================================================
// EMAIL NOTIFICATIONS
// ============================================================================

export const emailNotifications = pgTable("email_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Recipient
  userId: varchar("user_id").references(() => users.id),
  recipientEmail: varchar("recipient_email").notNull(),
  
  // Email Content
  notificationType: emailNotificationTypeEnum("notification_type").notNull(),
  templateId: varchar("template_id").references(() => emailTemplates.id),
  subject: varchar("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  
  // Context
  resourceType: varchar("resource_type"), // e.g., "subscription", "document", "emergency_access"
  resourceId: varchar("resource_id"),
  
  // Status
  status: emailStatusEnum("status").default('pending').notNull(),
  sentAt: timestamp("sent_at"),
  failureReason: text("failure_reason"),
  retryCount: integer("retry_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_email_notification_user_id").on(table.userId),
  index("idx_email_notification_status").on(table.status),
  index("idx_email_notification_type").on(table.notificationType),
  index("idx_email_notification_created_at").on(table.createdAt),
]);

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  customer: one(customers, {
    fields: [users.id],
    references: [customers.userId],
  }),
  uploadedDocuments: many(documents),
  auditLogs: many(auditLogs),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, {
    fields: [customers.userId],
    references: [users.id],
  }),
  subscriptions: many(subscriptions),
  documents: many(documents),
  emergencyAccessLogs: many(emergencyAccessLogs),
  notes: many(customerNotes),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  customer: one(customers, {
    fields: [subscriptions.customerId],
    references: [customers.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  customer: one(customers, {
    fields: [documents.customerId],
    references: [customers.id],
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const emergencyAccessLogsRelations = relations(emergencyAccessLogs, ({ one }) => ({
  customer: one(customers, {
    fields: [emergencyAccessLogs.customerId],
    references: [customers.id],
  }),
}));

export const customerNotesRelations = relations(customerNotes, ({ one }) => ({
  customer: one(customers, {
    fields: [customerNotes.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [customerNotes.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const emailNotificationsRelations = relations(emailNotifications, ({ one }) => ({
  user: one(users, {
    fields: [emailNotifications.userId],
    references: [users.id],
  }),
  template: one(emailTemplates, {
    fields: [emailNotifications.templateId],
    references: [emailTemplates.id],
  }),
}));

// ============================================================================
// INSERT SCHEMAS (For Validation)
// ============================================================================

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  accessCount: true,
  lastAccessedAt: true,
});

export const insertEmergencyAccessLogSchema = createInsertSchema(emergencyAccessLogs).omit({
  id: true,
  createdAt: true,
  customerNotified: true,
  notificationSentAt: true,
});

export const insertCustomerNoteSchema = createInsertSchema(customerNotes).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerTagSchema = createInsertSchema(customerTags).omit({
  id: true,
  createdAt: true,
});

export const insertPhysicalCardOrderSchema = createInsertSchema(physicalCardOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailNotificationSchema = createInsertSchema(emailNotifications).omit({
  id: true,
  sentAt: true,
  createdAt: true,
  updatedAt: true,
  retryCount: true,
});

// ============================================================================
// TYPES
// ============================================================================

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertEmergencyAccessLog = z.infer<typeof insertEmergencyAccessLogSchema>;
export type EmergencyAccessLog = typeof emergencyAccessLogs.$inferSelect;

export type InsertCustomerNote = z.infer<typeof insertCustomerNoteSchema>;
export type CustomerNote = typeof customerNotes.$inferSelect;

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

export type InsertCustomerTag = z.infer<typeof insertCustomerTagSchema>;
export type CustomerTag = typeof customerTags.$inferSelect;

export type InsertPhysicalCardOrder = z.infer<typeof insertPhysicalCardOrderSchema>;
export type PhysicalCardOrder = typeof physicalCardOrders.$inferSelect;

export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

export type InsertEmailNotification = z.infer<typeof insertEmailNotificationSchema>;
export type EmailNotification = typeof emailNotifications.$inferSelect;

// Global Search Results
export interface GlobalSearchResult {
  type: 'customer' | 'document' | 'audit_log';
  id: string;
  title: string;
  description?: string;
  customerId?: string;
  email?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}
