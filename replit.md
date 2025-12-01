# ALWR - America Living Will Registry

## Overview

The America Living Will Registry (ALWR) is a 24/7 online service for securely storing and managing living wills and advance healthcare directives. Its purpose is to provide a robust, HIPAA-compliant platform for document management, subscription handling, and emergency access to critical healthcare information. The system supports multiple user roles (customers, agents, resellers, admins, super admins) with role-based access control, ensuring secure and efficient management of sensitive documents.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The ALWR platform is built with a Node.js and Express.js API backend, leveraging TypeScript with both PostgreSQL (Drizzle ORM when available) and in-memory storage for development. The frontend is developed using React, TypeScript, Wouter, TanStack Query, shadcn/ui, and Tailwind CSS.

**Storage Layer (Dec 2025 Update):**
- **Dual Storage Support:** App now supports both database storage (DatabaseStorage via Drizzle ORM) and in-memory storage (MemStorage)
- **Automatic Fallback:** When DATABASE_URL is not available (e.g., free tier Replit), the app automatically uses MemStorage instead
- **MemStorage Implementation:** In-memory Map-based storage implementing full IStorage interface for development and testing
- **Mock Data Seeding:** Gracefully skips database seeding when using in-memory storage

**UI/UX Decisions:**
The UI emphasizes clarity and efficiency, featuring improved layouts for customer details, compact scrollable tiles for subscription history, and clean label-value grids for contact information. Breadcrumb navigation dynamically displays customer full names for better usability.

**Technical Implementations:**
- **Authentication & Security:** Custom email/password authentication, Replit Auth integration, session-based authentication (PostgreSQL session store), configurable timeouts, account locking, and Two-Factor Authentication (TOTP). It includes CORS validation, CSP, HSTS headers, multi-tier rate limiting, secrets rotation, API key authentication, and comprehensive audit logging. Role-Based Access Control differentiates permissions across Customer, Agent, Reseller, Admin, and Super Admin roles.
- **Database Architecture:** Core tables include `users`, `customers`, `subscriptions`, `documents`, and `document_versions`. Supporting tables manage access logs, audit logs, failed login attempts, API keys, agents, resellers, physical card orders, customer notes, tags, email templates, notifications, data exports, report schedules, history, system settings, and saved searches.
- **Key Features:**
    - **Document Management:** Secure upload (PDF, DOCX) with versioning, audit logging, and a view feature (PDF, DOCX to HTML conversion, DOC download).
    - **Batch Operations:** Endpoints for bulk customer creation, subscription updates, document deletion, tag assignment, and email campaigns.
    - **Advanced Search:** Supports complex filter creation, full-text search, and saved search preferences.
    - **Accounting & Payment Ledger:** Comprehensive financial ledger with payment summaries and a searchable transaction table.
    - **API Key Authentication:** Secure token-based access with fine-grained permissions.
    - **System Settings:** Admin-configurable settings for various platform aspects.
- **Performance & Optimization:** In-memory caching with TTL, smart invalidation, and pattern-based clearing. Database query performance monitoring and rate limiting per user role.
- **API Design:** Features API versioning (`v2` current), OpenAPI/Swagger documentation (`/api/docs`), standardized error handling, and consistent JSON response formats.
- **Real-Time Features:** WebSocket integration for live dashboard metrics and an asynchronous email queue system.
- **Analytics & Reporting:** Admin dashboard metrics and automated, scheduled report generation.
- **File Management:** Document upload with versioning and GDPR/CCPA compliant data export in multiple formats.

## External Dependencies

-   **Database:** PostgreSQL (Neon serverless), Drizzle ORM, connect-pg-simple.
-   **Authentication:** Replit Auth, bcryptjs, speakeasy (for TOTP), QRCode.
-   **Payment Processing:** Stripe API integration, stripe-replit-sync.
-   **Email:** MockEmailService (SendGrid ready).
-   **Frontend Libraries:** React, TanStack Query, Wouter, shadcn/ui, React Hook Form, Zod, Tailwind CSS.
-   **Development Tools:** Vite, tsx, esbuild, Jest, Supertest, Replit Vite plugins.
-   **Security & Utilities:** express-rate-limit, cors, helmet, memoizee, nanoid, swagger-ui-express, swagger-jsdoc.
-   **Monitoring:** Custom logger, WebSocket.