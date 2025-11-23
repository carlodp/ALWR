# America Living Will Registry (ALWR) - Rebuild 3.0 API

### Overview
The America Living Will Registry (ALWR) is a secure 24/7 online service for storing living wills and advance healthcare directives. This project provides the **Custom API backend** that powers the entire ALWR system, handling all business logic, document management, subscriptions, and customer operations. A separate WordPress frontend consumes this API via REST endpoints. The project aims to provide a robust, scalable, and compliant platform for managing critical healthcare documents, improving accessibility, and ensuring adherence to legal and medical standards, with a focus on HIPAA compliance.

### User Preferences
- Build core API modules incrementally, one feature at a time
- Focus on robust, secure backend API
- Use mock data for testing
- Prefer working, secure features over perfect code
- WordPress handles all UI/UX + CMS content (separate from this API)
- NO Strapi CMS - WordPress provides all content management

### System Architecture
This Replit instance hosts the custom API backend, which is an **Express.js** and **Node.js** application providing over 80 REST API endpoints. It integrates with a **PostgreSQL** database via **Drizzle ORM** for type-safe data interaction. The system is designed for a complete separation of UI (handled by a separate WordPress frontend) from business logic.

**Key Architectural Decisions & Features:**
- **Technology Stack**: Node.js, Express.js, PostgreSQL, Drizzle ORM, TypeScript.
- **Authentication & Authorization**: Custom email/password authentication, account locking, session management with PostgreSQL store, secure cookie-based sessions, and role-based access control (Super Admin, Admin, Agent, Reseller, Customer).
- **Core Modules**:
    - **User & Role Management**: Full CRUD for users, dynamic role assignment, and a protected Super Admin role.
    - **Document Management**: Upload, versioning, retrieval, and audit logging of medical documents.
    - **Emergency Access Lookup**: Public-facing, 3-step verification with HIPAA compliance and audit logging.
    - **Agent & Reseller Management**: Modules for managing agents and resellers, including customer assignment and referral tracking.
    - **Payment & Subscription**: Tracking, renewal reminders, and subscription modifications.
    - **Reporting & Analytics**: Admin dashboards with real-time WebSocket-based stats.
    - **ID Card Generation**: Digital and physical ID card ordering.
    - **Email Notification System**: Infrastructure for automated email notifications, including verification and password resets.
    - **Two-Factor Authentication (2FA)**: TOTP-based 2FA.
- **Security & Compliance**:
    - Rate limiting, security headers, Zod-based input validation, error sanitization.
    - File upload security (size/type limits).
    - Comprehensive audit logging for all critical actions, including login/logout and emergency access.
    - Session timeout (30-minute inactivity auto-logout) with user warning.
    - Secure password generation and bcrypt hashing.
- **Database Schema**: Includes tables for Users, Customers, Subscriptions, Documents, Emergency Access Logs, Customer Notes, Audit Logs, Physical Card Orders, Email Templates, Agents, Resellers, and their respective association tables.
- **UI/UX (WordPress Frontend Interaction)**: The API supports a single-page user creation flow on the frontend, dynamic field rendering based on user roles, and integrated password generation for administrators. All public pages and customer portals are managed by the external WordPress instance.

### External Dependencies
- **Replit Auth**: Used for initial user authentication (though custom email/password login is now primary).
- **PostgreSQL**: Primary relational database.
- **Drizzle ORM**: For type-safe database interactions.
- **Express.js**: Web application framework.
- **express-rate-limit**: Middleware for rate limiting.
- **Stripe**: Payment processing and subscription billing.
- **speakeasy**: For TOTP-based two-factor authentication.
- **ws (WebSocket)**: For real-time statistics streaming.
- **WordPress**: External CMS and frontend for the entire ALWR system, consuming this API.