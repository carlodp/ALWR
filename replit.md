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
-   **Advanced Rate Limiting**: Role-based rate limiting with per-user tracking and concurrent operation limits.
-   **Database Query Optimization**: Slow query logging, N+1 detection, and performance metrics tracking.

## Feature Completion Status

### #8 Advanced Rate Limiting - COMPLETED ✅

**Date Completed**: November 23, 2025  
**Components**: server/rate-limiter.ts, RATE_LIMITING.md  
**Admin Endpoints**:
- GET /api/admin/rate-limits/stats - Rate limit statistics
- POST /api/admin/rate-limits/clear - Clear all rate limits (emergency)

**Features**:
- ✅ Role-based tiers (Customer: 100/hr, Agent: 500/hr, Admin: 2000/hr)
- ✅ Per-user rate limiting (authenticated users)
- ✅ Concurrent operation tracking (uploads, exports)
- ✅ HTTP 429 with Retry-After headers
- ✅ X-RateLimit-* response headers
- ✅ In-memory tracking with automatic cleanup

### #9 Database Query Optimization - COMPLETED ✅

**Date Completed**: November 23, 2025  
**Components**: server/db-optimizer.ts, QUERY_OPTIMIZATION.md  
**Admin Endpoints**:
- GET /api/admin/db-metrics - Query execution metrics
- GET /api/admin/db-suggestions - Optimization recommendations
- GET /api/admin/db-n1-detection - N+1 query pattern detection

**Features**:
- ✅ Slow query logging (configurable threshold)
- ✅ Query metrics collection (duration, row count)
- ✅ N+1 query pattern detection
- ✅ Database indices on frequently queried columns
- ✅ Optimization suggestions engine
- ✅ Query execution analysis

**Database Indices Added**:
- Users: email, role, created_at, email+role composite
- Documents: created_at, type, customer_id+created_at composite
- Subscriptions: renewal_date, customer_id+status composite

---

### #10 Admin Analytics Dashboard - COMPLETED ✅

**Date Completed**: November 23, 2025  
**Components**: server/analytics.ts, ADMIN_ANALYTICS.md  
**Admin Endpoints**:
- GET /api/admin/analytics/dashboard - Complete dashboard metrics
- GET /api/admin/analytics/summary - Summary cards
- GET /api/admin/analytics/growth - 12-month growth trends
- GET /api/admin/analytics/subscriptions - Subscription breakdown
- GET /api/admin/analytics/revenue - Revenue metrics
- GET /api/admin/analytics/customers - Customer analytics
- GET /api/admin/analytics/documents - Document statistics

**Features**:
- ✅ Real-time subscription metrics
- ✅ Revenue tracking (MTD, YTD, quarterly)
- ✅ Customer growth and churn analysis
- ✅ Document upload statistics
- ✅ 12-month historical trends
- ✅ System health status
- ✅ Caching integration for performance

---

### #11 API Versioning - COMPLETED ✅

**Date Completed**: November 23, 2025  
**Components**: server/api-versioning.ts, API_VERSIONING.md  
**Features**:
- ✅ v1 (deprecated) and v2 (stable) support
- ✅ Automatic version detection from URL paths
- ✅ Deprecation warning headers (RFC 7231)
- ✅ Version information endpoint
- ✅ 12-month migration timeline
- ✅ Breaking changes documentation
- ✅ Backward compatibility

**Endpoints**:
- GET /api/version - Get version info
- GET /api/v1/version - Explicit v1 (deprecated)
- GET /api/v2/version - Explicit v2 (stable)

---

## Implementation Roadmap Status

**Completed**: #1 Swagger, #7 Audit Logging, #4 Data Export, Testing, #3 Email Queue, #5 Caching, #8 Rate Limiting, #9 Query Optimization, #10 Analytics, #11 API Versioning  
**Deferred**: #6 Webhooks (research needed)  
**Implementation Status**: 10 of 11 features complete (91%)

---

## Recent Fixes (November 23, 2025)

### ✅ Fixed White Screen Issue
**Problem**: Router returned `null` during auth loading, showing blank white screen
**Solution**: Added loading spinner component to App.tsx that displays "Loading..." message with spinner animation while auth check completes

### ✅ Fixed Auth Query Handling  
**Problem**: Auth query was throwing error on 401, causing infinite loading state
**Solution**: Modified `useAuth()` hook to use `getQueryFn({ on401: "returnNull" })` which properly handles 401 responses by returning null instead of throwing

### ✅ Fixed TypeScript Errors
**Problem**: 
- `server/replitAuth.ts` line 16: `user` property type mismatch
- `client/src/pages/login.tsx` lines 47-50: Invalid apiRequest call signature

**Solutions**:
- Changed Express Request interface to declare `user?: User | undefined`
- Fixed apiRequest call from `apiRequest("/api/auth/login", {...})` to `apiRequest("POST", "/api/auth/login", data)` with correct argument order

### ✅ Improved Form Accessibility
**Added**: `autoComplete` attributes to login form inputs:
- Email field: `autoComplete="email"`
- Password field: `autoComplete="current-password"`

**Result**: Eliminated DOM warnings and improved browser password manager integration

### ✅ Fixed Login Redirect Issue (November 23, 2025 - Final)
**Problem**: After successful login, toast showed "Logged in successfully" but page didn't redirect to dashboard
**Root Cause**: Auth query cache wasn't being invalidated after login, so app didn't refetch user data and stayed on login page
**Solution**: Modified login.tsx to invalidate auth query cache immediately after successful login
```typescript
// Invalidate auth query to refetch user data
await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
```
**Result**: After login succeeds, app refetches user data and redirects to admin dashboard correctly

---

## Current Status: **FULLY FUNCTIONAL** ✅

- Login page displays correctly with no white screen
- Loading indicator shows during initial auth check
- Login form submits properly with email/password authentication
- Successful login redirects to admin dashboard
- All TypeScript errors resolved
- Form accessibility improved
- Ready for production deployment