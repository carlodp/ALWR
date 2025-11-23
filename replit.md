# America Living Will Registry (ALWR) - API

## Overview
The America Living Will Registry (ALWR) API is the custom backend for a 24/7 online service storing living wills and advance healthcare directives. It handles all business logic, document management, subscriptions, and customer operations. The project aims to provide a robust, scalable, and HIPAA-compliant platform for managing critical healthcare documents, ensuring accessibility and adherence to legal and medical standards, and powering the entire ALWR system.

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
-   **Core Modules**: User & Role Management, Document Management (upload, versioning, audit logging), Emergency Access Lookup (HIPAA compliant), Agent & Reseller Management, Payment & Subscription tracking, Reporting & Analytics (real-time WebSocket statistics), ID Card Generation, Email Notification System, and Two-Factor Authentication (TOTP-based).
-   **Security & Compliance**: Rate limiting, security headers, Zod-based input validation, error sanitization, file upload security, comprehensive audit logging, session timeout, secure password handling with bcrypt, and tracking of failed login attempts.
-   **Database Schema**: Comprises tables for Users, Customers, Subscriptions, Documents, Emergency Access Logs, Customer Notes, Audit Logs, Physical Card Orders, Email Templates, Agents, Resellers, failed login attempts, and data export requests.
-   **UI/UX Interaction (WordPress Frontend)**: The API supports user creation flow, dynamic field rendering, integrated password generation, and manages all public-facing and customer portal interactions via the external WordPress instance.
-   **Enhanced Account Management**: Includes Forgot Password Flow, 2-step Profile Setup Wizard, Account Status Badges, and an enhanced Admin User Creation process.
-   **API Documentation**: Integrated OpenAPI/Swagger documentation for all key endpoints, available at `/api/docs` for interactive UI and `/api/docs.json` for the specification.
-   **Data Export Feature**: Supports customer data export requests (GDPR/CCPA compliance) in JSON, CSV, and PDF formats, with status tracking, download tracking, and auto-cleanup.
-   **Advanced Caching Strategy**: Implemented in-memory caching with TTL support, smart invalidation, and 5 strategic cache layers to improve API response times and reduce database load.
-   **Email Queue System**: Asynchronous email processing with automatic retries, delivery status tracking, and pre-built methods for common email scenarios.
-   **Automated Testing Suite**: Comprehensive suite with Jest for unit and integration tests, including mock data generation, coverage tracking, and zero database dependency for isolated testing.

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