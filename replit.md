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

### Latest Build Session (Session 7)
**Tier 1 MVP Features Completed:**
1. **Full Users Module** ✅ - 9 admin endpoints for user CRUD + role management
2. **Email Verification System** ✅ - 2 endpoints for email verification (24-hour tokens)
3. **Password Reset Flow** ✅ - 2 endpoints for forgot password & token validation
4. **Custom Email/Password Authentication** ✅ - Standalone login/register system
5. **Agents Module** ✅ - Full agent management with customer assignments
6. **Resellers Module** ✅ - Full reseller management with customer referral tracking
7. **Efficient Role Assignment Architecture** ✅ - Select user → add role-specific fields → create role

**Total API Endpoints: 86+** (unchanged)
- Users Module: 9 endpoints (list, get, create, update, change role, delete, activity)
- Custom Auth: 2 endpoints (register, login with password hashing & account locking)
- Email/Password: 4 endpoints (send verification, verify email, forgot password, reset password)
- **Agents Module: 9 endpoints** (list, get, create, update, delete, assign customer, unassign customer, get agent customers, get customer's agent)
- **Resellers Module: 9 endpoints** (list, create, get, update, delete, add customer, get reseller customers, get customer's reseller)
- All previous modules: 44+ endpoints

**New Resellers Module (Session 6):**
**9 API Endpoints:**
1. `GET /api/resellers` - List all resellers (admin only, with pagination)
2. `POST /api/resellers` - Create new reseller (admin only)
3. `GET /api/resellers/:resellerId` - Get reseller details (admin or self)
4. `PATCH /api/resellers/:resellerId` - Update reseller info (admin only)
5. `DELETE /api/resellers/:resellerId` - Soft delete reseller (admin only)
6. `POST /api/resellers/:resellerId/add-customer` - Add customer referral (admin only)
7. `GET /api/resellers/:resellerId/customers` - Get all customers referred by reseller
8. `GET /api/customers/:customerId/reseller` - Get reseller for customer

**Resellers Module Features:**
- ✅ Reseller profile management with company info (name, phone, address, tax ID)
- ✅ Partner tier tracking (standard, premium, enterprise)
- ✅ Commission rate and payment terms management
- ✅ Stripe Connect ID for payouts
- ✅ Performance metrics (customers referred, documents processed, revenue generated, commission earned)
- ✅ Customer referral tracking with individual commission rates
- ✅ Reseller-Customer relationship management
- ✅ Audit logging for all reseller operations (create, update, delete, add customer)
- ✅ Role-based permissions (admin-only operations, reseller self-access)
- ✅ Soft delete for resellers (mark as inactive instead of hard delete)
- ✅ Automatic performance tracking when adding customers
- ✅ Comprehensive relations system (resellers -> users, resellers -> referrals -> customers)

**Database Schema - New Tables (Session 6):**
- `resellers` table: Stores reseller profiles with user reference, status, company info, partner tier, commission, and performance metrics
- `reseller_customer_referrals` table: Links resellers to customers they referred, tracks performance metrics per customer

**Frontend Architecture - Unified Create User + Role Assignment (Session 7 & 8):**
- **Single-Page Create User Flow** - All in `/admin/users/new`:
  - Step 1: Basic Information (email, firstName, lastName, **password**)
    - **Password Generation**: Generate Password button (RotateCw icon) creates secure 16-char passwords
    - Excludes ambiguous chars (0/O, 1/l/I) to avoid login errors
    - Mix of uppercase, lowercase, numbers, special chars (!@#$%^&*-_=+)
    - Copy Password button (Copy icon) copies to clipboard for easy distribution
    - Read-only display of generated password with character count
  - Step 2: Select Role (customer, agent, reseller, admin)
  - Step 3: Role-Specific Fields (appear dynamically based on role)
    - Customer: phone, address (optional)
    - Agent: agencyName*, phone, address, licenseNumber, commissionRate
    - Reseller: companyName*, phone, address, taxId, partnerTier, commissionRate, paymentTerms
    - Admin: no additional fields
  - Creates both user account AND assigns role in one submission
  - **Password Security**: Passwords are bcrypt-hashed on backend before storage
- **User Management Pages**:
  - `admin-users.tsx` - View all accounts with search/filter
  - `admin-user-roles.tsx` - View and manage user roles (display-only interface for now)
- **Sidebar Navigation**: "Accounts" collapsible section
  - View Accounts - See all users with search
  - Create User - Create account + assign role in one flow
  - User Roles - View all user roles

**Database Schema Updates (Overall):**
- Authentication fields: passwordHash, lastLoginAt, loginAttempts, lockedUntil
- Agents module: agents table, agent_customer_assignments table with proper indexing
- **Resellers module: resellers table, reseller_customer_referrals table with proper indexing**
- Maintained: emailVerified, emailVerificationToken, passwordResetToken, all 2FA fields

**Session 8 Updates - Password Generator & Super Admin Role:**

**Super Admin Role:**
- **Super Admin Account**: carlo@wdmorgan.com with password: `_jA6TJb&eP#__Ahu`
- **Protection**: Super Admin accounts cannot be modified or demoted through the UI or API
- **Permanent Role**: Super Admin role can only be set manually via database/code (email-based protection)
- **Features**:
  - Full system access with highest privileges
  - Protected from accidental role changes
  - Marked with badge in User Roles interface
  - Backend validation prevents API-based role changes
- **How to create additional Super Admins**:
  1. Insert user directly into database with desired email
  2. Add email to protection list in backend code (`server/routes.ts`)
  3. Add email check to frontend UI (`client/src/pages/admin-user-roles.tsx`)

**Password Generator Feature:**
- **New Module**: `client/src/lib/passwordGenerator.ts`
  - `generatePassword(length?: number)` - Generates secure 16-char random passwords
  - `copyToClipboard(text: string)` - Copies password to browser clipboard with feedback
- **Updated Endpoints**: `POST /api/admin/users` now accepts password field
  - Validates password meets minimum requirements (12+ chars)
  - Hashes password with bcrypt before storage
  - Added 'reseller' to validRoles list for admin user creation
- **Updated Component**: `/admin/users/new` (admin-create-user.tsx)
  - Added password field to Step 1 with Generate and Copy buttons
  - Password generation integrated into form validation
  - Read-only password display field with character count
  - Toast notifications for copy success/failure
- **Key Features**:
  - Admin generates passwords instead of users choosing weak ones
  - Ambiguous character exclusion (0/O, 1/l/I, etc.)
  - Secure random number generation
  - One-click copying to clipboard
  - Applies to all user roles (customer, agent, reseller, admin)

**Session 9 Updates - Email/Password Login & Session Management:**

**Login System - Email/Password Only:**
- **Removed Replit Auth** - Replaced with simple email/password login
- **New Pages**:
  - `/login` - Login page with email/password form
  - `/signup` - Registration page with first name, last name, email, password, confirm password
- **Public Routes** - Both accessible without authentication
  - Links updated from `/api/login` to `/login` and `/signup` on landing page
- **Authentication Endpoints**:
  - `POST /api/auth/login` - Authenticates user with email/password (rate limited)
  - `POST /api/auth/register` - Creates new customer account with custom password
- **Features**:
  - Password validation: minimum 12 characters
  - Account locking: After 5 failed login attempts, account locks for 15 minutes
  - Audit logging: All login/logout actions tracked
  - Session management: Proper session destruction on logout
  - Toast notifications for success/error messages

**Session Management Fixes:**
- **Logout Fixed** - `/api/auth/logout` now properly:
  - Calls `req.logout()` to clear Replit Auth
  - Destroys session with `req.session.destroy()`
  - Clears session cookie (`connect.sid`)
  - Logs the logout action with proper audit trail
- **Audit Log Improvement** - `logUserSession()` now:
  - Fetches user name and role from database for audit trail
  - Provides proper `actorName` and `actorRole` fields (required)
  - Handles errors gracefully to prevent logout failures
  
**Database Optimization (Session 9):**
- Cleaned expired sessions (0 deleted - all current)
- Cleaned old audit logs, emergency access logs, email notifications
- Ran VACUUM ANALYZE for query optimization
- Database size: ~1.2 MB total, optimized for performance

### Frontend Dependencies (WordPress)
- **WordPress**: CMS for public website, customer portal, admin interface.
- Connects to this API via REST endpoints.
- Completely separate from this backend Replit.