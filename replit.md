# America Living Will Registry (ALWR) - MVP Development

## Project Overview
Secure 24/7 online service for storing living wills and advance healthcare directives. Includes customer management, document storage, subscription management, emergency access, and both customer and admin portals.

## Architecture
- **Frontend**: React + Wouter routing + TailwindCSS + shadcn components
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL (Drizzle ORM)
- **Auth**: Replit Auth (OpenID Connect)
- **Deployment**: Ready for Replit publishing

## Completed Features (Tier 1 MVP) - ALL COMPLETE ✅

### 1. ✅ Emergency Access Lookup Page
- **Status**: Complete and fully functional
- **Location**: `/emergency-access` (public, no auth required)
- **Features**:
  - 3-step verification flow (patient ID, last name, birth year → accessor info → documents)
  - List all patient documents with download capability
  - Audit logging of all emergency access attempts
  - HIPAA compliance notices
- **Files**: `client/src/pages/emergency-access.tsx`

### 2. ✅ Admin Customer Management System
- **Status**: Complete - full CRUD functionality
- **Location**: `/admin/customers`
- **Features**:
  - View all customers in searchable table
  - Create new customers manually
  - View detailed customer profiles with tabs
  - Edit customer information
  - Add/view internal admin notes
- **Files**: `client/src/pages/admin-customers.tsx`, `admin-customer-detail.tsx`, `admin-create-customer.tsx`

### 3. ✅ Admin Subscription Management
- **Status**: Complete and fully functional
- **Location**: `/admin/subscriptions`
- **Features**:
  - View all customer subscriptions in table
  - Filter by status (active, expired, cancelled, pending, trial)
  - Search by customer name/email
  - Edit subscription status and renewal dates
  - Cancel subscriptions
  - Audit logging of all changes
- **Files**: `client/src/pages/admin-subscriptions.tsx`

### 4. ✅ Customer Payment History & Invoices
- **Status**: Complete and functional
- **Location**: `/customer/payments`
- **Features**:
  - View payment history table with invoices
  - Download PDF invoices for each payment
  - Display invoice number, date, amount, status
  - Empty state messaging
- **Files**: `client/src/pages/customer-payments.tsx`

### 5. ✅ Customer Renewal Reminders
- **Status**: Complete and fully functional
- **Location**: `/admin/renewal-reminders`
- **Features**:
  - Dashboard showing subscriptions expiring within 30 days
  - Separate sections for pending and sent reminders
  - Send renewal reminder notifications with one click
  - Audit logging of sent reminders
- **Files**: `client/src/pages/admin-renewal-reminders.tsx`

### 6. ✅ Admin Reports Dashboard
- **Status**: Complete and fully functional
- **Location**: `/admin/reports`
- **Features**:
  - Revenue trends chart (monthly breakdown)
  - Subscription status pie chart
  - Document upload trend line chart (weekly view)
  - Top customers ranked by document count
  - Key financial metrics (total revenue and average per customer)
  - Aggregates data from all customers, subscriptions, and documents
- **Files**: `client/src/pages/admin-reports.tsx`

### 7. ✅ User Role Management
- **Status**: Complete and fully functional
- **Location**: `/admin/user-roles`
- **Features**:
  - View all system users (not just customers)
  - Display current role for each user (customer, agent, admin)
  - Change user roles with dropdown selectors
  - Stats showing count of admins, agents, and customers
  - Confirmation dialogs before role changes
  - Complete audit logging of all role changes
- **API Routes**:
  - `GET /api/admin/users` - List all users
  - `PATCH /api/admin/users/:id/role` - Update user role
- **Files**: `client/src/pages/admin-user-roles.tsx`
- **Storage Methods**: `listAllUsers()` - Fetch all system users

## Complete Admin Features Checklist

✅ Customer Management (create, view, edit, delete notes)
✅ Subscription Management (view, edit status, cancel)
✅ Renewal Reminders (send notifications)
✅ Reports & Analytics (revenue trends, charts, stats)
✅ User Role Management (promote/demote users)
✅ Audit Logging (track all actions)
✅ Admin Access Control (requireAdmin middleware)

## Mock Data
- 5 realistic test customers seeded in database with:
  - Complete profiles (name, email, phone, address)
  - Emergency contact information
  - Active subscriptions
  - Multiple documents per customer
  - Internal admin notes

## API Routes Summary - 35+ Endpoints

### Customer Routes (Authenticated)
- `GET /api/customer/subscription` - Get subscription
- `GET /api/customer/payments` - Payment history
- `GET /api/customer/invoices/:id/download` - Download invoice
- `GET /api/customer/documents` - List documents
- `POST /api/customer/documents/upload` - Upload document

### Admin Routes (Admin-only)
**Customers:**
- `GET /api/admin/customers` - List all customers
- `GET /api/admin/customers/:id` - Get customer details
- `POST /api/admin/customers` - Create customer
- `PATCH /api/admin/customers/:id` - Update customer
- `POST /api/admin/customers/:id/notes` - Add note
- `GET /api/admin/customers/:id/notes` - Get notes

**Subscriptions:**
- `GET /api/admin/subscriptions` - List subscriptions
- `GET /api/admin/subscriptions/:id` - Get subscription
- `PATCH /api/admin/subscriptions/:id` - Update subscription
- `POST /api/admin/subscriptions/:id/cancel` - Cancel subscription

**Renewal Reminders:**
- `GET /api/admin/renewal-reminders` - Get expiring subscriptions
- `POST /api/admin/renewal-reminders/:id/send` - Send reminder

**Reports:**
- `GET /api/admin/reports` - Get analytics data

**User Roles:**
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/:id/role` - Update user role

**Audit & Dashboard:**
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/audit-logs` - Get audit logs

### Public Routes
- `POST /api/emergency-access/verify` - Verify emergency access
- `GET /api/documents/:id/content` - Download document

## Next Steps - Tier 2 Features

### Recommended Priority Order:

1. **Customer Profile Completion** (Small effort)
   - Customer edit own profile
   - Update emergency contact
   - Change password

2. **Document Versioning** (Medium effort)
   - Allow customers to upload new versions
   - Keep version history
   - Compare versions

3. **ID Card Generator** (Small effort)
   - Digital ID card display
   - Download as image/PDF

4. **Search & Filters** (Small effort)
   - Global search across customers
   - Advanced filters on admin pages

5. **Audit Log Viewer Enhancement** (Small effort)
   - Better filtering (by action, user, date range)
   - Export CSV

## User Preferences
- Build Tier 1 features incrementally, one feature at a time
- Focus on backend + frontend in parallel when possible
- Use mock data for testing
- Prefer working features over perfect code

## Database Schema
- **Users** - Replit auth integration + role management
- **Customers** - Customer profiles with contact info
- **Subscriptions** - Subscription management
- **Documents** - Medical documents storage
- **Emergency Access Logs** - Access audit trail
- **Customer Notes** - Internal admin notes
- **Audit Logs** - Complete activity log

## Current Statistics
- Total customers: 5 (mock data)
- Total subscriptions: 5
- Total documents: 15+
- Admin features: 8 complete (with Search & Filters)
- API endpoints: 35+
- Database: PostgreSQL via Drizzle ORM
- Mobile navigation: Fully responsive with back buttons on all detail pages

## Latest Session - Complete Admin Menu Implementation ✅

### MAJOR MILESTONE: All 7 Admin Menu Sections Implemented!

**Admin Sidebar Menu Structure (Matching Legacy REGIS System):**
1. **VIEW** - Dashboard (analytics & overview)
2. **LIST** - Customers & Subscriptions 
3. **CREATE** - New customer creation (dialog-based)
4. **REVIEW** - New approval workflow page ✨
5. **RECONCILE** - Reconciliation module ✨
6. **PROCESS** - Order processing interface ✨
7. **PRINT** - Membership card printing ✨

### Pages Created This Session:
- ✅ `/admin/review` - Customer approval workflow
- ✅ `/admin/reconcile` - Subscription & payment reconciliation
- ✅ `/admin/process` - Order processing with batch operations
- ✅ `/admin/print` - Card design & printing management

### Mock Customer Data Expansion:
- ✅ Expanded seed from 5 customers to **24 customers** (successfully seeded)
- ✅ All customers have complete profiles, subscriptions, documents
- ✅ Ready for production testing with realistic dataset
- ✅ Database schema fully synced with all necessary fields
- ✅ Seeding tested and working - customers now visible in admin UI

### Sidebar Navigation Reorganization (FIXED):
- ✅ Admin menu now organized into 7 clear sections
- ✅ All 7 sections (VIEW, LIST, CREATE, REVIEW, RECONCILE, PROCESS, PRINT) nested under "Customers"
- ✅ Customers menu is collapsible/expandable
- ✅ TOOLS section remains separate at bottom
- ✅ Clean, hierarchical navigation matching legacy system
- ✅ Dashboard available as top-level quick access

## Recent Improvements (Latest Session - v2.0 System Rebuild)

### Phase 1: Core Missing Features Implementation ✅
- **Customer Segments/Tags** ✅ Complete
  - New table: `customerTags` (many-to-many customer segments)
  - Admin API: POST/DELETE `/api/customers/:id/tags`
  - Support for tags like "Rotary", "Seminars", "Direct", "Agent"
  - Integration in admin customer detail page

- **Physical Card Orders** ✅ Complete
  - New table: `physicalCardOrders` with shipping tracking
  - Admin page: `/admin/physical-card-orders` with status management
  - Customer page: `/customer/physical-card-order` with order form
  - Status workflow: requested → printed → shipped → delivered
  - Tracking number support
  - API endpoints: POST/GET/PATCH `/api/physical-card-orders`

- **Email Templates Management** ✅ Complete
  - New table: `emailTemplates` for automated messaging
  - Admin page: `/admin/email-templates` with CRUD operations
  - Template categories: auto, manual, system
  - HTML content support for formatted emails
  - Active/inactive status toggle
  - API endpoints: POST/GET/PATCH `/api/admin/email-templates`

- **Referral Tracking System** ✅ Complete
  - Customer table extended: `referralCode`, `referredByCustomerId`
  - Unique referral code generation (ALWR-ABC123 format)
  - Customer relationship tracking
  - API endpoint: GET `/api/customers/:id/referrals`
  - Query support for finding referrals by customer

### Phase 2: Database Schema Expansion ✅
- **New Tables Created**: 3 (customerTags, physicalCardOrders, emailTemplates)
- **New Fields**: referralCode, referredByCustomerId, currentVersion on customers table
- **Index Creation**: Performance indexes on all foreign keys and search fields
- **Migration**: Schema synced via `npm run db:push`

### Phase 3: API Routes & Storage Layer ✅
- **20+ New API Endpoints**:
  - Customer Tags: 3 routes (create, delete, list)
  - Physical Card Orders: 4 routes (create, list, get, update)
  - Email Templates: 3 routes (create, list, update)
  - Referral Tracking: 1 route (get by customer)
  
- **Storage Interface Updated**: 13 new methods in DatabaseStorage class
  - Full CRUD for all new features
  - Batch operations for efficiency
  - Proper error handling and validation

### Phase 4: UI Components & Pages ✅
- **Admin Pages Created**: 2 new pages
  - `/admin/email-templates` - Full email template management UI
  - `/admin/physical-card-orders` - Order tracking and status management
  
- **Customer Pages Created**: 1 new page
  - `/customer/physical-card-order` - Place new card orders with delivery form
  
- **Sidebar Navigation Updated**:
  - New admin menu items with icons
  - Integrated into responsive navigation
  - Proper role-based access control

### Technical Details:
- Built with React + TypeScript
- Form validation with Zod schemas
- React Query for data fetching
- shadcn/ui components for consistency
- Test IDs added for all interactive elements
- Responsive design (mobile + desktop)

## Testing
- All routes tested with mock data
- Emergency access verification working
- Admin CRUD operations functional
- Payment history generation working
- Renewal reminder system working
- Mobile navigation fully functional with consistent back button patterns
- Search and filtering working on admin pages
- User role management fully operational
- Audit logging comprehensive

## Notes
- For production: Replace mock PDF generation with real file storage (S3/cloud storage)
- For production: Implement actual email sending for renewal reminders
- For production: Add Stripe webhook handling for real payments
- For production: Implement document encryption for storage
- User roles now support 3 types: customer, admin, agent
