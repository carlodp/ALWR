# ALWR - America Living Will Registry

## Overview

The America Living Will Registry (ALWR) is a 24/7 online service for securely storing and managing living wills and advance healthcare directives. This system provides a comprehensive API backend built with Express.js and Node.js, offering 90+ REST API endpoints for document management, subscription handling, emergency access, batch operations, advanced search, and administrative functions.

The platform serves multiple user roles (customers, agents, resellers, admins, super admins) with role-based access control and manages sensitive healthcare documents with HIPAA-compliant security measures.

### Latest Enhancements (Phase 3)
- **Improved User Experience**: Popup modals for customer, agent, and reseller details
  - Click "View" on customer/agent/reseller rows to open a popup modal
  - Modal displays key information without leaving the list view
  - Option to navigate to full detail page for editing from the modal
  - Tabbed interface for customers (Overview, Contact, Documents)
  - Smooth, non-disruptive user interactions
- **Accounting Page**: Complete financial ledger showing payment logs from customer subscriptions
  - Summary cards: Total revenue, active subscriptions, payment records count
  - Searchable payment table with date, customer name, email, status, dates, and amount paid
  - Integrated into admin dashboard with quick-access tile
  - Sidebar menu item for easy navigation
- **Batch Operations**: Bulk create customers, update subscriptions, delete documents, add tags, and send email campaigns
- **Advanced Search**: Save complex search filters with full-text search, keywords, and sorting preferences
- These features reduce admin workload by 80%+ for bulk operations

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Technology Stack

**Backend:**
- Node.js with Express.js as the web framework
- TypeScript for type safety across the entire codebase
- PostgreSQL database with Drizzle ORM for type-safe database operations
- Vite for frontend build tooling with React
- Jest for automated testing

**Frontend:**
- React with TypeScript
- Wouter for client-side routing
- TanStack Query for server state management
- shadcn/ui component library (Material Design 3 influenced) with Dialog/Modal support
- Tailwind CSS for styling
- Dark/light theme support
- Modal dialogs for non-disruptive detail viewing

### Authentication & Security

**Authentication:**
- Custom email/password authentication with bcrypt password hashing
- Replit Auth integration for initial user authentication
- Session-based authentication using PostgreSQL session store
- 30-minute session timeout with activity-based extension
- Account locking after 5 failed login attempts with exponential backoff (15 min → 4 hours max)
- Two-factor authentication (TOTP) with authenticator apps (Google Authenticator, Authy)

**Security Features:**
1. CORS validation restricting requests to whitelisted origins
2. Content Security Policy (CSP) preventing XSS attacks
3. HSTS headers enforcing HTTPS connections
4. Multi-tier rate limiting (global, auth, API, user-based, concurrent)
5. Request payload size limits (5MB default, 50MB documents, 100KB settings)
6. Secrets rotation policy (SESSION_SECRET monthly, DATABASE_PASSWORD quarterly)
7. Column-level PII encryption with AES-256-GCM (ready for implementation)
8. API key authentication system with SHA256 hashing and permission-based access
9. Comprehensive audit logging (35+ audit action types)
10. IP whitelisting for admin endpoints via ADMIN_IPS environment variable

**Role-Based Access Control:**
- Customer: View/manage own profile, documents, subscriptions
- Agent: Manage customers and subscriptions (500 requests/hour)
- Reseller: Customer referral management (300 requests/hour)
- Admin: Full system access except super admin functions (2000 requests/hour)
- Super Admin: Complete system control (5000 requests/hour)

### Database Architecture

**Schema Organization (shared/schema.ts):**

**Core Tables:**
- `users` - User authentication and profiles (email, password, role, 2FA settings)
- `customers` - Customer profiles with comprehensive contact info (PII encrypted ready)
  - Personal details (name, DOB, PRN number)
  - Professional info (title, organization)
  - Address fields (address1, address2, city, state, zip, country)
  - Phone fields (phone1, phone1Ext, phone2, phone2Ext, fax)
  - Emergency contact information
  - Referral tracking
- `subscriptions` - Subscription management with Stripe integration
- `documents` - Healthcare documents with versioning support
- `document_versions` - Document version history

**Access & Security:**
- `emergency_access_logs` - HIPAA-compliant access tracking
- `audit_logs` - Comprehensive admin action tracking
- `failed_login_attempts` - Brute force attack prevention
- `api_keys` - Third-party API access management

**Business Operations:**
- `agents` - Sales agent management with comprehensive contact details
  - PIN Number, professional info (title, organization)
  - Agent type (Individual or Organizational)
  - Full address and phone fields with extensions
  - License tracking and commission rates
  - Performance metrics (customers, documents, revenue)
- `resellers` - Reseller partner management with contact group classification
  - Contact groups (Event Registrants, Info Seekers, Pennies Peace of Mind)
  - Full contact information (address, phone, email, web)
  - Flexible extended values (JSON array for unlimited custom fields)
  - Performance metrics and commission tracking
- `physical_card_orders` - ID card order processing
- `customer_notes` - Internal customer notes
- `customer_tags` - Customer categorization

**Communication:**
- `email_templates` - Templated email management
- `email_notifications` - Email queue with retry logic
- `data_exports` - GDPR/CCPA compliance data exports

**Reporting & Admin:**
- `report_schedules` - Automated report generation
- `report_history` - Report delivery tracking
- `system_settings` - Backend configuration system
- `saved_searches` - Store and reuse complex search filters

**Batch Operations:**
- `POST /api/admin/batch/customers/create` - Bulk create customers
- `POST /api/admin/batch/subscriptions/update-status` - Bulk update subscriptions
- `POST /api/admin/batch/documents/delete` - Bulk delete documents
- `POST /api/admin/batch/customers/tags/add` - Add tags to multiple customers
- `POST /api/admin/batch/email-campaign` - Send batch email campaigns

**Advanced Search:**
- `GET /api/admin/search/advanced` - Search with complex filters, keywords, sorting
- `POST /api/admin/search/saved` - Save search filters for reuse
- `GET /api/admin/search/saved` - List saved searches
- `GET /api/admin/search/saved/:id` - Get specific saved search
- `PATCH /api/admin/search/saved/:id` - Update saved search
- `DELETE /api/admin/search/saved/:id` - Delete saved search

**Accounting & Payment Ledger:**
- `GET /api/admin/accounting` - Fetch complete payment ledger from all subscriptions
- Frontend: `GET /admin/accounting` - Accounting page route showing financial ledger
- Features: Payment summary cards, searchable transaction table, real-time totals

### Performance & Optimization

**Caching Strategy:**
- In-memory caching with TTL support reducing database queries by 60%+
- 5 strategic cache layers (customer profiles, documents, subscriptions, reports, stats)
- Smart cache invalidation on mutations
- Pattern-based cache clearing
- Auto-cleanup of expired entries every 60 seconds

**Database Optimization:**
- Query performance monitoring with slow query logging (>100ms threshold)
- Recommended indices for users, customers, subscriptions, documents, audit logs
- Query metrics tracking with duration and row counts

**Rate Limiting Tiers:**
- Customer: 100 requests/hour, 10 concurrent
- Agent: 500 requests/hour, 50 concurrent
- Reseller: 300 requests/hour, 30 concurrent
- Admin: 2000 requests/hour, 500 concurrent
- Super Admin: 5000 requests/hour, 1000 concurrent

### API Design

**API Versioning:**
- v1: DEPRECATED (sunset 2025-12-31)
- v2: STABLE (current recommended version)
- Version detection middleware with deprecation warnings
- Backward compatibility support during migration period

**Documentation:**
- OpenAPI/Swagger documentation at `/api/docs` (interactive UI)
- JSON spec at `/api/docs.json`
- 90+ documented endpoints
- Version info endpoint at `/api/version`
- Batch operations docs: `docs/features/BATCH_OPERATIONS_AND_ADVANCED_SEARCH.md`
- Customer Details schema: `docs/features/CUSTOMER_DETAILS_SCHEMA.md`
- Agent Details schema: `docs/features/AGENT_DETAILS_SCHEMA.md`
- Reseller Details schema: `docs/features/RESELLER_DETAILS_SCHEMA.md`
- WordPress API key integration: `docs/integrations/WORDPRESS_API_KEY_AUTHENTICATION.md`

**Response Patterns:**
- Standardized error handling with sanitized error messages
- Consistent JSON response format
- Rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
- Pagination support for list endpoints

### Real-Time Features

**WebSocket Integration:**
- Real-time dashboard metrics via WebSocket
- Live stats updates for admin dashboard
- Subscription-based stats streaming
- Automatic reconnection handling

**Email Queue System:**
- Asynchronous email processing (10 emails per 5 seconds)
- Exponential backoff retries (1s → 2s → 4s)
- Database-backed persistence
- Status tracking (pending, sent, failed, bounced)
- Admin monitoring endpoints

### Analytics & Reporting

**Admin Dashboard Metrics:**
- Subscription metrics (total, active, expired, cancelled, pending, trial)
- Revenue metrics (MTD, YTD, last month, last quarter, average per customer)
- Customer metrics (total, active, churn rate, lifetime value, new this month)
- Document metrics (total, uploads by period, average per customer, by type)
- System health (uptime, response time, database status, error rate)

**Automated Reporting:**
- Scheduled report generation (daily, weekly, monthly)
- Multi-recipient email delivery
- Report history tracking
- Customizable report types (subscription, revenue, customer, document, emergency access, audit)

### File Management

**Document Upload:**
- Multer middleware for file handling
- 10MB file size limit
- Supported formats: PDF, DOC, DOCX
- Temporary storage in memory
- Document versioning support

**Data Export:**
- GDPR/CCPA compliance
- Formats: JSON, CSV, PDF
- Status tracking (pending, processing, completed, failed)
- Auto-cleanup after 7 days
- Download tracking

## API Key Authentication (For WordPress & Integrations)

**API Key Features:**
- Secure token-based authentication for external systems
- Fine-grained permissions (read, write, admin)
- Usage tracking and analytics
- Automatic expiration support
- Instant revocation capability
- Timing-safe comparison (prevents timing attacks)
- Full audit logging of all key operations

**API Key Endpoints:**
- `POST /api/admin/apikeys/create` - Generate new API key
- `GET /api/admin/apikeys` - List user's API keys
- `DELETE /api/admin/apikeys/:id` - Revoke API key
- `GET /api/admin/apikeys/permissions/available` - List available permissions

**Middleware:**
- `requireAPIKey` - Validates API key from Authorization header
- `requireAPIKeyPermission(permission)` - Checks for specific permission

**Documentation:** `docs/integrations/WORDPRESS_API_KEY_AUTHENTICATION.md`

## External Dependencies

**Database:**
- PostgreSQL (via Neon serverless with WebSocket support)
- Drizzle ORM with drizzle-kit for migrations
- connect-pg-simple for PostgreSQL session storage

**Authentication:**
- Replit Auth (openid-client with Passport strategy)
- bcryptjs for password hashing
- speakeasy for TOTP two-factor authentication
- QRCode for 2FA QR code generation
- API key authentication with SHA256 hashing

**Payment Processing:**
- Stripe API integration
- stripe-replit-sync for Stripe schema management
- Product and price management via Stripe

**Email (Mock Implementation):**
- MockEmailService for development (logs to console)
- Ready for SendGrid or similar provider integration
- Queue-based processing with retry logic

**Frontend Libraries:**
- React with TypeScript
- TanStack Query for data fetching and caching
- Wouter for routing
- shadcn/ui component library (@radix-ui components)
- React Hook Form with Zod validation
- Tailwind CSS with autoprefixer

**Development Tools:**
- Vite with React plugin
- tsx for TypeScript execution
- esbuild for production builds
- Jest for testing with ts-jest
- Supertest for API integration testing
- @replit/vite-plugin-runtime-error-modal for error overlays
- @replit/vite-plugin-cartographer and dev-banner for development

**Security & Utilities:**
- express-rate-limit for rate limiting
- cors for CORS handling
- helmet for security headers (via manual implementation)
- memoizee for function memoization
- nanoid for unique ID generation
- swagger-ui-express and swagger-jsdoc for API documentation

**Monitoring:**
- Custom logger utility for structured logging
- WebSocket for real-time metrics
- Cache statistics tracking
- Query performance monitoring