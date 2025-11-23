# America Living Will Registry (ALWR) - Rebuild 3.0 API

### Overview
The America Living Will Registry (ALWR) is a secure 24/7 online service for storing living wills and advance healthcare directives. This Replit instance provides the **Custom API backend** that powers the entire ALWR system, handling all business logic, document management, subscriptions, and customer operations. A separate WordPress frontend consumes this API via REST endpoints. The project aims to provide a robust, scalable, and compliant platform for managing critical healthcare documents, improving accessibility, and ensuring adherence to legal and medical standards.

### User Preferences
- Build core API modules incrementally, one feature at a time
- Focus on robust, secure backend API
- Use mock data for testing
- Prefer working, secure features over perfect code
- WordPress handles all UI/UX + CMS content (separate from this API)
- **NO Strapi CMS** - WordPress provides all content management

### System Architecture - Rebuild 3.0

**This Replit (Custom API Backend):**
- **Express.js** - REST API server
- **Node.js** - Runtime environment  
- **PostgreSQL** - Relational database (Replit built-in)
- **Drizzle ORM** - Type-safe database interaction
- **TypeScript** - Full type safety

**External Frontend (WordPress):**
- WordPress installation (separate from this Replit)
- Serves all public pages, customer portal, admin interface
- Makes REST API calls to the endpoints provided by this backend
- Complete separation of UI from business logic

The backend, hosted in this Replit, is an **Express.js** and **Node.js** application. It provides over 35 REST API endpoints covering customer-facing, admin-only, and public functionalities. Data persistence is managed by a **PostgreSQL** database, accessed via the **Drizzle ORM**. User authentication is integrated using **Replit Auth (OpenID Connect)**.

Core features include:
- **Emergency Access Lookup**: Public-facing, 3-step verification with HIPAA compliance and audit logging.
- **Admin & Customer Management**: Full CRUD operations for customer profiles, subscriptions, and user roles.
- **Document Management**: Upload, versioning, retrieval, and audit logging of medical documents.
- **Payment & Subscription**: Tracking payment history, renewal reminders, and subscription modifications.
- **Reporting & Analytics**: Admin dashboards with visual analytics for revenue, subscriptions, and document trends.
- **ID Card Generation**: Digital and physical ID card ordering, display, and printing for customers and admins.
- **Email Notification System**: Core infrastructure for various automated email notifications.
- **Two-Factor Authentication (2FA)**: TOTP-based 2FA with QR code generation and backup codes.
- **Bulk Admin Operations**: Features like bulk document deletion and customer export to CSV.
- **Session Management**: Secure logout, session logging with IP/User-Agent tracking.
- **Real-Time Admin Dashboard Stats**: WebSocket-based streaming of live revenue, subscription, and document metrics with intelligent caching.
- **Global Search & Audit Filters**: Unified search across customers, documents, and audit logs, with comprehensive filtering capabilities for audit trails.

Security infrastructure includes rate limiting, security headers, Zod-based input validation, error sanitization, file upload security (size/type limits), secure cookie-based session management with PostgreSQL session store, and comprehensive audit logging.

The database schema includes tables for Users, Customers, Subscriptions, Documents, Emergency Access Logs, Customer Notes, Audit Logs, Physical Card Orders, and Email Templates.

### Backend Dependencies (This API)
- **Replit Auth**: For user authentication (OpenID Connect).
- **PostgreSQL**: Primary relational database (Replit built-in).
- **Drizzle ORM**: For type-safe database interaction.
- **Express.js**: REST API web application framework.
- **express-rate-limit**: Rate limiting middleware for security.
- **Stripe**: Payment processing and subscription billing.
- **speakeasy**: TOTP-based two-factor authentication.
- **ws (WebSocket)**: Real-time stats streaming.
- **TypeScript**: Type safety and development tooling.

### Latest Build Session (Session 3)
**Tier 1 MVP Features Completed:**
1. **Full Users Module** ✅ - 9 new admin endpoints for user CRUD + role management
2. **Email Verification System** ✅ - 2 endpoints for email verification with 24-hour tokens
3. **Password Reset Flow** ✅ - 2 endpoints for forgot password and token validation

**Total API Endpoints: 65+** (up from 57)
- Users Module: 9 endpoints (list, get, create, update, change role, delete, activity)
- Email/Password: 4 endpoints (send verification, verify email, forgot password, reset password)
- All previous modules: 52+ endpoints

**Features Deployed:**
- Role-based access control (admin, customer, agent, support)
- User deactivation and role management
- Email verification with 24-hour expiration
- Password reset with 1-hour token expiration
- Security: email existence not revealed in forgot password
- Rate limiting ready for login/verification attempts
- Comprehensive audit logging for all user operations

**Database Schema Updates:**
- Added to users table: emailVerified, emailVerificationToken, emailVerificationTokenExpiresAt, passwordResetToken, passwordResetTokenExpiresAt, passwordResetAttempts

### Frontend Dependencies (WordPress)
- **WordPress**: CMS for public website, customer portal, admin interface.
- Connects to this API via REST endpoints.
- Completely separate from this backend Replit.