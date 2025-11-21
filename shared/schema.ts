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
export const subscriptionStatusEnum = pgEnum('alwr_subscription_status', [
  'active',
  'expired',
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
  'emergency_access',
  'profile_update',
  'subscription_create',
  'subscription_update',
  'customer_create',
  'customer_update'
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// CUSTOMER MANAGEMENT
// ============================================================================

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
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
  
  // Stripe Integration
  stripeCustomerId: varchar("stripe_customer_id").unique(),
  
  // Metadata
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_customer_user_id").on(table.userId),
  index("idx_customer_stripe_id").on(table.stripeCustomerId),
]);

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
