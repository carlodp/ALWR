# America Living Will Registry (ALWR) - API

## Overview
The America Living Will Registry (ALWR) API is the custom backend for a 24/7 online service managing living wills and advance healthcare directives. It handles business logic, document management, subscriptions, and customer operations. The project aims to provide a robust, scalable, HIPAA-compliant platform for critical healthcare documents, ensuring accessibility and adherence to legal and medical standards, and powering the entire ALWR system.

## User Preferences
- Build core API modules incrementally, one feature at a time
- Focus on robust, secure backend API
- Use mock data for testing
- Prefer working, secure features over perfect code
- WordPress handles all UI/UX + CMS content (separate from this API)
- NO Strapi CMS - WordPress provides all content management

## System Architecture
This Replit instance hosts a custom API backend built with Express.js and Node.js, offering over 80 REST API endpoints. It interacts with a PostgreSQL database using Drizzle ORM for type-safe operations. The architecture strictly separates the UI (handled by WordPress) from the business logic.

**Key Architectural Decisions & Features:**
-   **Technology Stack**: Node.js, Express.js, PostgreSQL, Drizzle ORM, TypeScript.
-   **Authentication & Authorization**: Custom email/password authentication, account locking, session management with PostgreSQL store, secure cookie-based sessions, and role-based access control (Super Admin, Admin, Agent, Reseller, Customer).
-   **Core Modules**: User & Role Management, Document Management (upload, versioning, audit logging), Emergency Access Lookup (HIPAA compliant), Agent & Reseller Management, Payment & Subscription tracking, Reporting & Analytics (real-time WebSocket statistics, automated report scheduling), ID Card Generation, Email Notification System, and Two-Factor Authentication (TOTP-based).
-   **Security & Compliance**: Rate limiting (role-based, per-user, concurrent operation limits), security headers, Zod-based input validation, error sanitization, file upload security, comprehensive audit logging, session timeout, secure password handling with bcrypt, and tracking of failed login attempts.
-   **Database Schema**: Comprises tables for Users, Customers, Subscriptions, Documents, Emergency Access Logs, Customer Notes, Audit Logs, Physical Card Orders, Email Templates, Agents, Resellers, failed login attempts, and data export requests. Includes database indices on frequently queried columns and slow query logging with N+1 detection.
-   **UI/UX Interaction (WordPress Frontend)**: The API supports user creation flow, dynamic field rendering, integrated password generation, and manages all public-facing and customer portal interactions via the external WordPress instance.
-   **Enhanced Account Management**: Includes Forgot Password Flow, 2-step Profile Setup Wizard, Account Status Badges, and an enhanced Admin User Creation process, with an Admin dashboard feature for editing user accounts including role-based field visibility.
-   **API Documentation**: Integrated OpenAPI/Swagger documentation for all key endpoints, available at `/api/docs` for interactive UI and `/api/docs.json` for the specification. Includes API versioning (v1 deprecated, v2 stable) with automatic detection and deprecation warnings.
-   **Data Export Feature**: Supports customer data export requests (GDPR/CCPA compliance) in JSON, CSV, and PDF formats, with status tracking, download tracking, and auto-cleanup.
-   **Advanced Caching Strategy**: Implemented in-memory caching with TTL support, smart invalidation, and 5 strategic cache layers.
-   **Email Queue System**: Asynchronous email processing with automatic retries, delivery status tracking, and pre-built methods for common email scenarios.
-   **Automated Testing Suite**: Comprehensive suite with Jest for unit and integration tests, including mock data generation, coverage tracking, and zero database dependency for isolated testing.
-   **Admin Analytics Dashboard**: Real-time WebSocket-based dashboard with live metrics, system health monitoring, and historical trends for subscriptions, revenue, customer growth, and document uploads.
-   **Automated Report Scheduling**: Enterprise-grade report generation with customizable schedules (daily/weekly/monthly), multiple report types (revenue, subscriptions, customers, documents, comprehensive), multi-recipient email delivery, schedule management UI, and delivery tracking.

## Recent Implementations (November 23, 2025)

### #2 & #3: Document Management Enhancements + Activity/Audit Log

**Document Management Enhancements** (`/customer/documents`):
- ✅ **Document Age Tracking**: Shows how old each document is (e.g., "3 months old", "1 year old")
- ✅ **"Needs Review" Indicators**: Red badge + alert for documents older than 1 year
- ✅ **Type-Based Filtering**: Click badges to filter by Living Will, Healthcare Directive, Power of Attorney, DNR, etc.
- ✅ **Real-Time Search**: Search by filename across all documents
- ✅ **Better Organization**: Shows filtered count (e.g., "3 of 8 documents")
- ✅ **Status Icons**: Clock icon shows document age at a glance
- ✅ **Bulk Selection**: Select multiple documents for future bulk operations
- ✅ **Smart Alerts**: Warns users to update old documents with helpful guidance

**Customer Activity/Audit Log** (`/customer/activity`):
- ✅ **Complete Activity Timeline**: Shows all account activities with timestamps
- ✅ **Activity Categories**: Login, Security, Document, Access, Other
- ✅ **Search Functionality**: Full-text search across all activities
- ✅ **Category Filtering**: Click badges to filter by type
- ✅ **Detailed Events**: Includes:
  - Login history (device, browser, IP)
  - Password changes
  - 2FA toggles (enabled/disabled)
  - Document uploads with file details
  - Document views/downloads
  - Emergency access requests and access logs
  - Subscription renewals
- ✅ **Privacy Notice**: Transparency about account monitoring
- ✅ **Time Formatting**: "2h ago", "3d ago", etc. for easy readability
- ✅ **Color-Coded Badges**: Visual distinction between activity types

### Enhanced Customer Dashboard & Help Center
**Dashboard Features Added**:
- Account security status section showing 2FA status and last login time
- Help & support section with mini FAQ accordion (3 common questions)
- Quick action shortcuts to guides with category filters
- Visit Help Center button with full access to all resources
- Color-coded security indicators (green for protected, orange for not protected)
- Recent documents preview with quick view option
- Professional card-based layout with clear visual hierarchy
- Responsive design that works on all screen sizes
- All testable with proper data-testid attributes

**Comprehensive Help Center** (`/customer/help`):
- **8 Detailed Guides** with step-by-step instructions:
  - How to Upload Documents (8 steps + 4 tips)
  - Enable Two-Factor Authentication (8 steps + 4 tips)
  - Manage Your Subscription (8 steps + 4 tips)
  - View and Manage Documents (8 steps + 4 tips)
  - Backup Codes and Account Recovery (7 steps + 4 tips)
  - Set Up Emergency Access (7 steps + 4 tips)
  - View and Download Your ID Card (7 steps + 4 tips)
  - View Payment History and Invoices (7 steps + 4 tips)
- **8 FAQs** in accordion format covering:
  - Data security and encryption
  - When to update documents
  - Password reset procedures
  - Multiple emergency contacts
  - Subscription expiration
  - Support contact
  - Data export options
  - File format support
- **Full-text search** across guides and FAQs
- **Category filtering** (Documents, Security, Billing, Emergency, ID Card)
- **Expandable tips** for each guide with best practices
- **Responsive design** for mobile and desktop

**Customer Features Overview**:
- **Dashboard**: Metrics, quick actions, security status, recent documents, mini FAQs, help center link
- **Profile**: View/edit contact info, emergency contacts, password change, 2FA management
- **Documents**: Upload, version control, download, organize by type, age tracking, "Needs Review" alerts, type filtering
- **Subscription**: View status, manage billing, upgrade/downgrade
- **Payments**: View invoices, download receipts, payment history
- **ID Card**: View/download digital ID card
- **Physical Card**: Order physical ID cards
- **Emergency Access**: Set up emergency contact access
- **Activity Log**: Complete audit trail with search and filtering
- **Help Center**: Comprehensive guides, FAQs, searchable documentation

## Implementation Timeline (November 23, 2025)

### Automated Report Scheduling + QoL Enhancements (Admin Portal)
**Core Features**:
- Report types: Revenue, Subscriptions, Customers, Documents, Comprehensive
- Schedule frequencies: Daily, Weekly, Monthly with custom delivery times
- Multi-recipient email support per schedule
- Schedule enable/disable toggle
- Report history tracking with delivery status (pending/sent/failed)
- API endpoints: GET/POST/PATCH/DELETE schedules, GET history
- Database tables: report_schedules, report_history with full CRUD storage methods

**Quality of Life Improvements**:
- Delete schedule functionality with confirmation dialog
- Search/filter schedules by name (real-time filtering)
- Schedule summary card (showing total, active, inactive counts)
- Next scheduled time display on each schedule
- Copy recipient emails button (one-click to clipboard)
- Better toast notifications with status feedback on toggle actions
- Enhanced empty state with icon and helpful guidance text
- Disabled state management for buttons during mutations
- Improved error messages and user feedback

**UI/UX Enhancements**:
- Professional card-based schedule layout
- Color-coded status indicators (green for active, orange for inactive)
- Visual feedback on button interactions
- Responsive grid layout for schedule details
- Grouped action buttons (Enable/Disable, Delete, Copy)
- Truncated email display with full text on hover

### Real-Time Dashboard Analytics
**Features**:
- WebSocket-powered metrics updating every 5 seconds
- 10+ new dashboard metrics with growth trends
- Live connection indicator
- Auto-reconnection on disconnect
- Primary metrics: Total Customers, Active Subscriptions, Documents Stored, Monthly Revenue
- Secondary metrics: Expiring Soon, New Today, Active Users
- Real-time activity feed with status indicators
- System health monitoring

## External Dependencies
-   **Replit Auth**: For initial user authentication.
-   **PostgreSQL**: Primary relational database.
-   **Drizzle ORM**: For type-safe database interactions.
-   **Express.js**: Web application framework.
-   **express-rate-limit**: Middleware for rate limiting.
-   **Stripe**: Payment processing and subscription billing.
-   **speakeasy**: For TOTP-based two-factor authentication.
-   **ws (WebSocket)**: For real-time statistics streaming.
-   **WordPress**: External CMS and frontend for the entire ALWR system.
-   **swagger-ui-express**: For interactive API documentation UI.
-   **swagger-jsdoc**: For converting JSDoc to OpenAPI specification.
-   **Jest**: Testing framework for automated unit and integration tests.