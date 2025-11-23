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

export const userRoleEnum = pgEnum('alwr_user_role', ['customer', 'admin', 'agent', 'reseller', 'super_admin']);
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

export const reportFrequencyEnum = pgEnum('alwr_report_frequency', [
  'daily',
  'weekly',
  'monthly'
]);

export const reportTypeEnum = pgEnum('alwr_report_type', [
  'revenue',
  'subscriptions',
  'customers',
  'documents',
  'comprehensive'
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
  
  // Custom Password Authentication
  passwordHash: varchar("password_hash"), // bcrypt hashed password - optional for custom auth
  lastLoginAt: timestamp("last_login_at"),
  loginAttempts: integer("login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  
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
}, (table) => [
  index("idx_users_email").on(table.email),
  index("idx_users_role").on(table.role),
  index("idx_users_created_at").on(table.createdAt),
  index("idx_users_email_role").on(table.email, table.role),
]);

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
  referralCode: varchar("referral_code"), // Optional referral code
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
  index("idx_subscription_renewal_date").on(table.renewalDate),
  index("idx_subscription_customer_status").on(table.customerId, table.status),
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
  index("idx_document_created_at").on(table.createdAt),
  index("idx_document_type").on(table.fileType),
  index("idx_document_customer_created").on(table.customerId, table.createdAt),
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
// FAILED LOGIN ATTEMPTS (Security Tracking)
// ============================================================================

export const failedLoginAttempts = pgTable("failed_login_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  reason: varchar("reason").notNull(), // 'invalid_password', 'account_locked', 'user_not_found', 'invalid_2fa'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_failed_login_email").on(table.email),
  index("idx_failed_login_ip").on(table.ipAddress),
  index("idx_failed_login_created_at").on(table.createdAt),
]);

// ============================================================================
// DATA EXPORTS (Customer Data Access Right)
// ============================================================================

// Report Scheduling Table
export const reportSchedules = pgTable("report_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Schedule Configuration
  name: varchar("name").notNull(),
  description: text("description"),
  reportType: reportTypeEnum("report_type").notNull(),
  frequency: reportFrequencyEnum("frequency").notNull(),
  
  // Email Configuration
  recipientEmails: text("recipient_emails").array().notNull(), // Array of emails to receive the report
  includeCharts: boolean("include_charts").default(true).notNull(),
  
  // Timing
  dayOfWeek: integer("day_of_week"), // 0-6 for weekly reports
  dayOfMonth: integer("day_of_month"), // 1-31 for monthly reports
  hour: integer("hour").default(9).notNull(), // Hour of day (0-23)
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  lastGeneratedAt: timestamp("last_generated_at"),
  nextScheduledAt: timestamp("next_scheduled_at"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_report_user_id").on(table.userId),
  index("idx_report_is_active").on(table.isActive),
  index("idx_report_next_scheduled").on(table.nextScheduledAt),
]);

// Report History Table
export const reportHistory = pgTable("report_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scheduleId: varchar("schedule_id").references(() => reportSchedules.id).notNull(),
  
  // Report Details
  generatedAt: timestamp("generated_at").defaultNow(),
  sentAt: timestamp("sent_at"),
  emailsDelivered: text("emails_delivered").array(),
  deliveryStatus: varchar("delivery_status").default('pending').notNull(), // pending, sent, failed
  deliveryError: text("delivery_error"),
  
  // Report Snapshot
  dataSnapshot: jsonb("data_snapshot"), // Store the actual report data
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_history_schedule_id").on(table.scheduleId),
  index("idx_history_generated_at").on(table.generatedAt),
]);

export const dataExports = pgTable("data_exports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Export Status
  status: varchar("status").notNull().default('pending'), // 'pending', 'processing', 'ready', 'failed'
  
  // Export Contents
  includePersonalData: boolean("include_personal_data").default(true).notNull(),
  includeDocuments: boolean("include_documents").default(true).notNull(),
  includePaymentHistory: boolean("include_payment_history").default(true).notNull(),
  includeAuditLog: boolean("include_audit_log").default(true).notNull(),
  
  // Export Details
  storageKey: varchar("storage_key"), // S3 key or file path
  fileSize: integer("file_size"), // in bytes
  format: varchar("format").default('json').notNull(), // 'json', 'csv', 'pdf'
  
  // Tracking
  requestedAt: timestamp("requested_at").defaultNow(),
  processingStartedAt: timestamp("processing_started_at"),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"), // Auto-delete after this date
  downloadCount: integer("download_count").default(0),
  
  // Error Tracking
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_data_export_customer_id").on(table.customerId),
  index("idx_data_export_status").on(table.status),
  index("idx_data_export_expires_at").on(table.expiresAt),
  index("idx_data_export_created_at").on(table.createdAt),
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
// AGENTS MODULE
// ============================================================================

export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Agent Status
  status: varchar("status").default('active').notNull(), // active, inactive, suspended
  
  // Organization/Agency Info
  agencyName: varchar("agency_name"),
  agencyPhone: varchar("agency_phone"),
  agencyAddress: text("agency_address"),
  
  // License/Credentials
  licenseNumber: varchar("license_number"),
  licenseExpiresAt: timestamp("license_expires_at"),
  
  // Commission & Payment
  commissionRate: varchar("commission_rate"), // e.g., "10.5" for 10.5%
  stripeConnectId: varchar("stripe_connect_id"), // For payouts
  
  // Performance Tracking
  totalCustomersAssigned: integer("total_customers_assigned").default(0),
  totalDocumentsProcessed: integer("total_documents_processed").default(0),
  totalRevenueGenerated: integer("total_revenue_generated").default(0), // in cents
  
  // Metadata
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_agent_user_id").on(table.userId),
  index("idx_agent_status").on(table.status),
]);

// Agent-Customer Assignments (tracks which customers an agent manages)
export const agentCustomerAssignments = pgTable("agent_customer_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").references(() => agents.id).notNull(),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  
  // Assignment Details
  assignedAt: timestamp("assigned_at").defaultNow(),
  unassignedAt: timestamp("unassigned_at"),
  isActive: boolean("is_active").default(true).notNull(),
  
  // Performance on this customer
  documentCount: integer("document_count").default(0),
  lastContactAt: timestamp("last_contact_at"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_assignment_agent_id").on(table.agentId),
  index("idx_assignment_customer_id").on(table.customerId),
  index("idx_assignment_is_active").on(table.isActive),
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

export const agentsRelations = relations(agents, ({ one, many }) => ({
  user: one(users, {
    fields: [agents.userId],
    references: [users.id],
  }),
  assignments: many(agentCustomerAssignments),
}));

export const agentCustomerAssignmentsRelations = relations(agentCustomerAssignments, ({ one }) => ({
  agent: one(agents, {
    fields: [agentCustomerAssignments.agentId],
    references: [agents.id],
  }),
  customer: one(customers, {
    fields: [agentCustomerAssignments.customerId],
    references: [customers.id],
  }),
}));

// ============================================================================
// RESELLERS MODULE
// ============================================================================

export const resellers = pgTable("resellers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Reseller Status
  status: varchar("status").default('active').notNull(), // active, inactive, suspended
  
  // Company Info
  companyName: varchar("company_name").notNull(),
  companyPhone: varchar("company_phone"),
  companyAddress: text("company_address"),
  taxId: varchar("tax_id"), // For 1099 reporting
  
  // Partner Tier
  partnerTier: varchar("partner_tier").default('standard'), // standard, premium, enterprise
  
  // Commission & Payment
  commissionRate: varchar("commission_rate"), // e.g., "15.5" for 15.5%
  paymentTerms: varchar("payment_terms"), // net30, net60, etc.
  stripeConnectId: varchar("stripe_connect_id"), // For payouts
  
  // Performance Tracking
  totalCustomersReferred: integer("total_customers_referred").default(0),
  totalDocumentsProcessed: integer("total_documents_processed").default(0),
  totalRevenueGenerated: integer("total_revenue_generated").default(0), // in cents
  totalCommissionEarned: integer("total_commission_earned").default(0), // in cents
  
  // Metadata
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_reseller_user_id").on(table.userId),
  index("idx_reseller_status").on(table.status),
  index("idx_reseller_tier").on(table.partnerTier),
]);

// Reseller-Customer Relationships (tracks which customers were referred by reseller)
export const resellerCustomerReferrals = pgTable("reseller_customer_referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: varchar("reseller_id").references(() => resellers.id).notNull(),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  
  // Referral Details
  referredAt: timestamp("referred_at").defaultNow(),
  commissionRate: varchar("commission_rate"), // Override global rate if needed
  
  // Performance on this customer
  documentCount: integer("document_count").default(0),
  revenueGenerated: integer("revenue_generated").default(0), // in cents
  commissionEarned: integer("commission_earned").default(0), // in cents
  
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_referral_reseller_id").on(table.resellerId),
  index("idx_referral_customer_id").on(table.customerId),
]);

// Relations for Resellers Module
export const resellersRelations = relations(resellers, ({ one, many }) => ({
  user: one(users, {
    fields: [resellers.userId],
    references: [users.id],
  }),
  referrals: many(resellerCustomerReferrals),
}));

export const resellerCustomerReferralsRelations = relations(resellerCustomerReferrals, ({ one }) => ({
  reseller: one(resellers, {
    fields: [resellerCustomerReferrals.resellerId],
    references: [resellers.id],
  }),
  customer: one(customers, {
    fields: [resellerCustomerReferrals.customerId],
    references: [customers.id],
  }),
}));

// System Settings for Backend Configuration
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Auto Logout Settings
  idleTimeoutEnabled: boolean("idle_timeout_enabled").default(true),
  idleWarningMinutes: integer("idle_warning_minutes").default(25),
  idleCountdownMinutes: integer("idle_countdown_minutes").default(5),
  
  // Session Management
  sessionTimeoutMinutes: integer("session_timeout_minutes").default(30),
  maxConcurrentSessions: integer("max_concurrent_sessions").default(5),
  
  // Rate Limiting
  rateLimitEnabled: boolean("rate_limit_enabled").default(true),
  requestsPerMinute: integer("requests_per_minute").default(60),
  failedLoginLockoutThreshold: integer("failed_login_lockout_threshold").default(5),
  
  // Document Management
  maxUploadSizeMB: integer("max_upload_size_mb").default(10),
  
  // Two-Factor Authentication
  twoFactorAuthRequired: boolean("two_factor_auth_required").default(false),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalCustomersAssigned: true,
  totalDocumentsProcessed: true,
  totalRevenueGenerated: true,
});

export const insertAgentCustomerAssignmentSchema = createInsertSchema(agentCustomerAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  documentCount: true,
});

export const insertResellerSchema = createInsertSchema(resellers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalCustomersReferred: true,
  totalDocumentsProcessed: true,
  totalRevenueGenerated: true,
  totalCommissionEarned: true,
});

export const insertResellerCustomerReferralSchema = createInsertSchema(resellerCustomerReferrals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  documentCount: true,
  revenueGenerated: true,
  commissionEarned: true,
});

export const insertFailedLoginAttemptSchema = createInsertSchema(failedLoginAttempts).omit({
  id: true,
  createdAt: true,
});

export const insertDataExportSchema = createInsertSchema(dataExports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  processingStartedAt: true,
  completedAt: true,
  fileSize: true,
  downloadCount: true,
});

export const insertReportScheduleSchema = createInsertSchema(reportSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastGeneratedAt: true,
  nextScheduledAt: true,
});

export const insertReportHistorySchema = createInsertSchema(reportHistory).omit({
  id: true,
  createdAt: true,
  generatedAt: true,
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

export type InsertAgentCustomerAssignment = z.infer<typeof insertAgentCustomerAssignmentSchema>;
export type AgentCustomerAssignment = typeof agentCustomerAssignments.$inferSelect;

export type InsertReseller = z.infer<typeof insertResellerSchema>;
export type Reseller = typeof resellers.$inferSelect;

export type InsertResellerCustomerReferral = z.infer<typeof insertResellerCustomerReferralSchema>;
export type ResellerCustomerReferral = typeof resellerCustomerReferrals.$inferSelect;

export type InsertFailedLoginAttempt = z.infer<typeof insertFailedLoginAttemptSchema>;
export type FailedLoginAttempt = typeof failedLoginAttempts.$inferSelect;

export type InsertDataExport = z.infer<typeof insertDataExportSchema>;
export type DataExport = typeof dataExports.$inferSelect;

export type InsertReportSchedule = z.infer<typeof insertReportScheduleSchema>;
export type ReportSchedule = typeof reportSchedules.$inferSelect;

export type InsertReportHistory = z.infer<typeof insertReportHistorySchema>;
export type ReportHistory = typeof reportHistory.$inferSelect;

export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;
export type SystemSettings = typeof systemSettings.$inferSelect;

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
