# America Living Will Registry (ALWR) - API

### Overview
The America Living Will Registry (ALWR) provides a secure, 24/7 online service for storing living wills and advance healthcare directives. This project is the **Custom API backend** that powers the entire ALWR system, handling all business logic, document management, subscriptions, and customer operations. It serves as the data and logic layer for a separate WordPress frontend. The primary goal is to deliver a robust, scalable, and HIPAA-compliant platform for managing critical healthcare documents, ensuring accessibility and adherence to legal and medical standards.

### User Preferences
- Build core API modules incrementally, one feature at a time
- Focus on robust, secure backend API
- Use mock data for testing
- Prefer working, secure features over perfect code
- WordPress handles all UI/UX + CMS content (separate from this API)
- NO Strapi CMS - WordPress provides all content management

### System Architecture
This Replit instance hosts a custom API backend built with **Express.js** and **Node.js**, offering over 80 REST API endpoints. It interacts with a **PostgreSQL** database using **Drizzle ORM** for type-safe operations. The architecture strictly separates the UI (handled by WordPress) from the business logic.

**Key Architectural Decisions & Features:**
-   **Technology Stack**: Node.js, Express.js, PostgreSQL, Drizzle ORM, TypeScript.
-   **Authentication & Authorization**: Custom email/password authentication, account locking, session management with PostgreSQL store, secure cookie-based sessions, and role-based access control (Super Admin, Admin, Agent, Reseller, Customer).
-   **Core Modules**:
    -   **User & Role Management**: CRUD operations for users, dynamic role assignment.
    -   **Document Management**: Upload, versioning, retrieval, and audit logging of medical documents.
    -   **Emergency Access Lookup**: Public-facing, 3-step verification with HIPAA compliance.
    -   **Agent & Reseller Management**: Modules for managing agents, resellers, customer assignment, and referral tracking.
    -   **Payment & Subscription**: Tracking, renewal reminders, and modifications.
    -   **Reporting & Analytics**: Admin dashboards with real-time WebSocket statistics.
    -   **ID Card Generation**: Digital and physical ID card ordering.
    -   **Email Notification System**: Automated email notifications for verification and password resets.
    -   **Two-Factor Authentication (2FA)**: TOTP-based 2FA.
-   **Security & Compliance**: Rate limiting, security headers, Zod-based input validation, error sanitization, file upload security, comprehensive audit logging, session timeout, and secure password handling with bcrypt.
-   **Database Schema**: Comprises tables for Users, Customers, Subscriptions, Documents, Emergency Access Logs, Customer Notes, Audit Logs, Physical Card Orders, Email Templates, Agents, Resellers, and their associated tables.
-   **UI/UX Interaction (WordPress Frontend)**: The API supports a streamlined user creation flow, dynamic field rendering based on roles, and integrated password generation for administrators. All public-facing and customer portal pages are managed by the external WordPress instance.
-   **Frontend Quality of Life Improvements**: Implemented using existing dependencies, these include Dark/Light Mode Theme Toggle, Live Session Timer Display, Global Keyboard Shortcuts (`Cmd/Ctrl+K` for search, `Cmd/Ctrl+/` for Dashboard), Auto-Extend Session on Activity, and Breadcrumb Navigation.
-   **Enhanced Account Creation & Roles**: Includes a Forgot Password Flow, a 2-step Profile Setup Wizard for new users, Account Status Badges, and an enhanced Admin User Creation process with role descriptions and a password generator.
-   **Reusable UI Components**: Developed components like Empty State, Section Header, Input with Icon, Badge Status, Confirmation Dialog, and Loading Card for consistent UI/UX across the frontend.

### External Dependencies
-   **Replit Auth**: For initial user authentication.
-   **PostgreSQL**: Primary relational database.
-   **Drizzle ORM**: For type-safe database interactions.
-   **Express.js**: Web application framework.
-   **express-rate-limit**: Middleware for rate limiting.
-   **Stripe**: Payment processing and subscription billing.
-   **speakeasy**: For TOTP-based two-factor authentication.
-   **ws (WebSocket)**: For real-time statistics streaming.
-   **WordPress**: External CMS and frontend for the entire ALWR system.