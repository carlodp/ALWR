# ALWR - America Living Will Registry

## Overview

The America Living Will Registry (ALWR) is a 24/7 online service for securely storing and managing living wills and advance healthcare directives. It features an Express.js and Node.js API backend with 90+ REST API endpoints for document management, subscription handling, emergency access, batch operations, advanced search, and administrative functions. The platform supports multiple user roles (customers, agents, resellers, admins, super admins) with role-based access control and ensures HIPAA-compliant security for sensitive healthcare documents. Recent enhancements include improved UI with modal details for user types, a comprehensive accounting page, and advanced batch operations for increased administrative efficiency.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (Latest Session)

### Document Management & UI Improvements (Nov 24, 2025)

1. **Document Upload Feature - COMPLETED**
   - Added "Upload Document" button in Customer Detail > Documents tab header (CardHeader area)
   - Modal dialog with Document Type dropdown selector
   - File upload field with PDF/DOCX support only
   - New admin endpoint: POST `/api/admin/customers/:customerId/documents/upload`
   - File validation and audit logging for all uploads
   - Real-time query invalidation on successful upload
   - **Fix Applied:** Updated document types to match database enum (living_will, healthcare_directive, power_of_attorney, dnr, other)
   - **UI Improvement:** Upload button positioned in the header for better UX

2. **Document Type Enum**
   - Database supports 5 core document types:
     - Living Will
     - Healthcare Surrogate (healthcare_directive)
     - Living Will Update (power_of_attorney)
     - Healthcare Surrogate Update (dnr)
     - Combined Advance Directive (other)

3. **Breadcrumb Navigation Improvement**
   - Breadcrumbs now display customer full name instead of ID
   - Extracts customer name from page h1 element on customer detail pages
   - Cleaner navigation path for admin users
   - Updated breadcrumb-nav.tsx with dynamic name detection

4. **Subscription Tab Optimization in Modal**
   - Changed from card-based layout to compact scrollable tiles
   - Implemented max-height container (300px) with vertical scroll for unlimited subscriptions
   - Combined date ranges on single line to save space
   - Reduced font sizes for efficient space usage
   - Better visual distinction between current and past subscriptions

5. **Subscription Data Enhancement**
   - Updated backend API to return all subscriptions per customer (not just one)
   - Added `getSubscriptionsByCustomer()` method in storage layer
   - Each customer now seeded with 3 subscriptions: 2 inactive (past), 1 active (current)
   - Realistic subscription history for testing (dates spanning 2 years back)

6. **Contact Tab Redesign (Modal)**
   - Changed from icon-based layout to clean label-value grid layout
   - Removed icon elements for left side space utilization
   - Organized Emergency Contact section with better spacing
   - All fields now display with labels on left, values on right
   - Improved readability and space efficiency

7. **Badge Capitalization**
   - Added `capitalize` CSS class to subscription status badges
   - Status now displays as "Active" instead of "active"

8. **Customer Detail Page Loading Fix**
   - Increased PageTransitionLoader timeout from 500ms to 1500ms
   - Added error state handling with `isError` flag
   - Added error display component to show API failures
   - Prevents "Loading page..." message from disappearing before page loads

### Backend Improvements

1. **Subscription Management**
   - New storage method: `getSubscriptionsByCustomer(customerId)` returns all subscriptions
   - Updated `/api/admin/customers/:id` endpoint to return `subscriptions` array instead of single object
   - Database has subscription status enum: 'active', 'inactive', 'cancelled', 'pending', 'trial'

### Files Modified

- `shared/schema.ts` - Updated document type enum with 8 comprehensive types
- `client/src/pages/admin/customer-detail.tsx` - Added document upload dialog with Document Type selector and file input
- `client/src/components/shared/breadcrumb-nav.tsx` - Added dynamic customer name extraction for breadcrumb display
- `client/src/contexts/breadcrumb-context.tsx` - Created breadcrumb context for future use
- `server/routes.ts` - Added POST `/api/admin/customers/:customerId/documents/upload` endpoint
- `client/src/components/modals/customer-detail-modal.tsx` - Contact tab layout, subscriptions display, badge capitalization
- `server/storage.ts` - New `getSubscriptionsByCustomer()` method
- `server/seed-mock-data.ts` - Multi-subscription seeding per customer

### Critical Bug Fixes

1. **Document Upload Endpoint Failed - FIXED (Nov 24, 2025, Session 2)**
   - **Root Cause:** Admin document upload endpoint was missing required database fields
   - **Issue:** Error "null value in column 'storage_key' violates not-null constraint"
   - **Solution Applied:**
     - Added `storageKey` generation to admin endpoint (format: `documents/{customerId}/{uuid}-{filename}`)
     - Fixed document version creation to include all required fields: `fileName`, `fileSize`, `mimeType`, `storageKey`
     - Changed field name from `versionNumber` to `version` (correct schema field)
     - Added proper `encryptionKey` handling for document versions
   - **Status:** Now fully functional - uploads create both document records and version history correctly

2. **Customer Detail Page Endless Loading - FIXED**
   - **Root Cause:** PageTransitionLoader was showing indefinitely, masking actual page load issues
   - **Solution:** Removed PageTransitionLoader from App component
   - **Secondary Issues Fixed:**
     - Fixed race condition in customer detail query where `enabled: !!id && isAdmin` prevented query from running (removed `isAdmin` check)
     - Backend now handles authorization via 401 responses
     - Added proper error state handling to show error messages instead of infinite loading

## System Architecture

### Technology Stack

**Backend:** Node.js, Express.js, TypeScript, PostgreSQL (with Drizzle ORM).
**Frontend:** React, TypeScript, Wouter, TanStack Query, shadcn/ui, Tailwind CSS.

### Authentication & Security

**Authentication:** Custom email/password authentication (bcrypt), Replit Auth integration, session-based authentication (PostgreSQL session store), configurable session/idle timeouts, account locking after failed login attempts, and Two-Factor Authentication (TOTP).

**Security Features:** CORS validation, Content Security Policy (CSP), HSTS headers, multi-tier rate limiting, request payload size limits, secrets rotation, column-level PII encryption (planned), API key authentication with SHA256 hashing, comprehensive audit logging, and IP whitelisting for admin endpoints.

**Role-Based Access Control:** Differentiates permissions and rate limits for Customer, Agent, Reseller, Admin, and Super Admin roles.

### Database Architecture

**Core Tables:** `users`, `customers` (PII ready for encryption), `subscriptions`, `documents`, `document_versions`.
**Access & Security:** `emergency_access_logs`, `audit_logs`, `failed_login_attempts`, `api_keys`.
**Business Operations:** `agents`, `resellers`, `physical_card_orders`, `customer_notes`, `customer_tags`.
**Communication:** `email_templates`, `email_notifications`, `data_exports`.
**Reporting & Admin:** `report_schedules`, `report_history`, `system_settings`, `saved_searches`.

### Key Features

**Batch Operations:** Endpoints for bulk customer creation, subscription status updates, document deletion, tag assignment, and email campaigns.
**Advanced Search:** Allows complex filter creation, full-text search, and saving search preferences.
**Accounting & Payment Ledger:** Provides a complete financial ledger with payment summaries and a searchable transaction table.
**API Key Authentication:** Secure token-based access for external systems (e.g., WordPress) with fine-grained permissions and audit logging.
**System Settings:** Admin-configurable settings for session management, rate limiting, security, and file uploads.

### Performance & Optimization

**Caching:** In-memory caching with TTL, smart invalidation, and pattern-based clearing.
**Database Optimization:** Query performance monitoring and recommended indexing.
**Rate Limiting:** Configurable tiers per user role.

### API Design

**API Versioning:** `v2` is current and stable; `v1` is deprecated.
**Documentation:** OpenAPI/Swagger documentation available at `/api/docs`.
**Response Patterns:** Standardized error handling, consistent JSON format, rate limit headers, and pagination.

### Real-Time Features

**WebSocket Integration:** Real-time dashboard metrics and live stats updates.
**Email Queue System:** Asynchronous email processing with retry logic and status tracking.

### Analytics & Reporting

**Admin Dashboard Metrics:** Comprehensive metrics for subscriptions, revenue, customers, documents, and system health.
**Automated Reporting:** Scheduled report generation with customizable types and multi-recipient delivery.

### File Management

**Document Upload:** Supports PDF, DOC, DOCX files up to 10MB, with document versioning.
**Data Export:** GDPR/CCPA compliant data exports in JSON, CSV, PDF formats with status tracking and auto-cleanup.

## External Dependencies

**Database:** PostgreSQL (Neon serverless), Drizzle ORM, connect-pg-simple.
**Authentication:** Replit Auth, bcryptjs, speakeasy (for TOTP), QRCode.
**Payment Processing:** Stripe API integration, stripe-replit-sync.
**Email:** MockEmailService (ready for SendGrid integration).
**Frontend Libraries:** React, TanStack Query, Wouter, shadcn/ui, React Hook Form, Zod, Tailwind CSS.
**Development Tools:** Vite, tsx, esbuild, Jest, Supertest, Replit Vite plugins.
**Security & Utilities:** express-rate-limit, cors, helmet (manual implementation), memoizee, nanoid, swagger-ui-express, swagger-jsdoc.
**Monitoring:** Custom logger, WebSocket for real-time metrics.