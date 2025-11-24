# ALWR - America Living Will Registry

## Overview

The America Living Will Registry (ALWR) is a 24/7 online service for securely storing and managing living wills and advance healthcare directives. It features an Express.js and Node.js API backend with 90+ REST API endpoints for document management, subscription handling, emergency access, batch operations, advanced search, and administrative functions. The platform supports multiple user roles (customers, agents, resellers, admins, super admins) with role-based access control and ensures HIPAA-compliant security for sensitive healthcare documents. Recent enhancements include improved UI with modal details for user types, a comprehensive accounting page, and advanced batch operations for increased administrative efficiency.

## User Preferences

Preferred communication style: Simple, everyday language.

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