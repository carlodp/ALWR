# ALWR MVP Development Guide for Replit AI

**Project:** America Living Will Registry (ALWR) System Rebuild - MVP Phase  
**Timeline:** 3 months  
**Platform:** Replit  
**Date:** November 22, 2025

---

## Table of Contents

1. [Business Context](#1-business-context)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [MVP Modules Overview](#4-mvp-modules-overview)
5. [Module 1: Authentication & User Management](#module-1-authentication--user-management)
6. [Module 2: Customer Management](#module-2-customer-management)
7. [Module 3: Subscription Management](#module-3-subscription-management)
8. [Module 4: Document Management](#module-4-document-management)
9. [Module 5: Emergency Access System](#module-5-emergency-access-system)
10. [Module 6: Content Management (Strapi)](#module-6-content-management-strapi)
11. [Module 7: Customer Portal Frontend](#module-7-customer-portal-frontend)
12. [Module 8: Public Website Frontend](#module-8-public-website-frontend)
13. [Database Architecture](#database-architecture)
14. [API Design Guidelines](#api-design-guidelines)
15. [Security Requirements](#security-requirements)
16. [Email Notifications](#email-notifications)
17. [Testing Requirements](#testing-requirements)

---

## 1. Business Context

### What is ALWR?

America Living Will Registry (ALWR) is a 24/7 online service that stores living wills and advance health care directives securely in the cloud. The business provides:

- **Secure document storage** for critical medical documents
- **24/7 emergency access** for medical personnel to retrieve documents
- **ID cards** with emergency access information for customers
- **Peace of mind** for customers knowing their medical wishes are accessible anytime

### Current System

The existing system runs on Adobe ColdFusion with dotPUB CMS, hosted on Hostway servers. It has 28 functional modules with 200-250 distinct functions. The system needs a complete rebuild using modern technologies.

### MVP Goal

Build a functional system in 3 months that handles the core business operations:
- User authentication
- Customer registration and management
- Document upload and storage
- Subscription management
- Emergency document access
- Public marketing website
- Customer portal

### Key Stakeholders

- **Customers (Registrants):** People who upload their living wills
- **Admins (Staff):** Manage customers, subscriptions, and content
- **Agents (Sales):** Sell subscriptions and manage client relationships
- **Medical Personnel:** Emergency access to retrieve documents
- **Content Editors (Marketing):** Update website content

---

## 2. System Architecture

### Hybrid Architecture Approach

The system uses three separate services working together:

```
┌─────────────────────────────────────────────────────────┐
│              FRONTEND (Next.js/React)                    │
│                                                          │
│  Public Website + Customer Portal + Admin Interface     │
└────────────┬─────────────────────────┬──────────────────┘
             │                         │
             │                         │
    ┌────────▼────────┐       ┌───────▼──────────┐
    │  STRAPI CMS     │       │  CUSTOM API      │
    │  (Content)      │       │  (Business)      │
    └────────┬────────┘       └───────┬──────────┘
             │                         │
    ┌────────▼────────┐       ┌───────▼──────────┐
    │ CMS Database    │       │ Business Database│
    │ (Pages/Content) │       │ (Customers/Docs) │
    └─────────────────┘       └──────────────────┘
```

### Why Three Services?

**1. Strapi CMS (Content Management)**
- Handles all marketing pages and educational content
- Gives marketing team a user-friendly interface (like WordPress)
- Manages menus, pages, blog articles
- Has its own database for content

**2. Custom API (Business Logic)**
- Handles all business-specific functionality
- User authentication and authorization
- Customer and subscription management
- Document storage and retrieval
- Payment processing
- Emergency access verification
- Has its own database for business data

**3. Next.js Frontend (User Interface)**
- Single frontend application for all interfaces
- Public marketing website (pulls content from Strapi)
- Customer portal (pulls data from Custom API)
- Admin dashboard (manages customers via Custom API)
- Responsive, mobile-friendly design

### Service Responsibilities

**Strapi CMS Manages:**
- Homepage content
- About Us, FAQs, Education pages
- Marketing page images and media
- Navigation menus
- Blog/articles
- SEO settings

**Custom API Manages:**
- User accounts and authentication
- Customer records
- Subscriptions and billing
- Document uploads and storage
- Emergency access requests
- Email notifications
- Audit logs

**Frontend Displays:**
- All public pages (using Strapi content)
- Customer portal interface
- Admin dashboard
- Forms and user interactions
- Document viewing

---

## 3. Technology Stack

### Frontend Service (Next.js)

**Framework:**
- Next.js 14 with React 18
- Server-side rendering for SEO (marketing pages)
- Client-side rendering for portals (customer/admin)

**Styling:**
- Tailwind CSS for utility-first styling
- shadcn/ui or Material-UI for pre-built components

**Key Libraries:**
- React Hook Form (form handling)
- React Query (data fetching and caching)
- Axios (HTTP requests)
- React Dropzone (file uploads)
- React PDF (document viewing)
- Chart.js (admin dashboards)

### Backend Service (Custom API)

**Runtime:**
- Node.js 18+ with Express.js
- (Alternative: Python with FastAPI)

**Database:**
- PostgreSQL 15+ for business data

**Authentication:**
- JSON Web Tokens (JWT) for session management
- bcrypt for password hashing

**File Storage:**
- AWS S3 or compatible cloud storage
- Encrypted document storage

**Email:**
- SendGrid or AWS SES for transactional emails

**Payment:**
- Stripe for subscription billing

### CMS Service (Strapi)

**Platform:**
- Strapi v4.x (open-source headless CMS)

**Database:**
- PostgreSQL (separate from business database)

**Features:**
- Built-in admin panel
- REST and GraphQL APIs
- Media library
- Role-based access control

### Deployment on Replit

**Three Separate Replits:**

1. **Frontend Repl** (alwr-frontend)
   - Next.js application
   - Connects to both Strapi and Custom API

2. **API Repl** (alwr-api)
   - Custom Node.js/Express server
   - PostgreSQL database (Replit's built-in DB)

3. **CMS Repl** (alwr-cms)
   - Strapi application
   - PostgreSQL database (Replit's built-in DB)

---

## 4. MVP Modules Overview

The MVP consists of 8 core modules that must be completed:

### Priority Modules (Must Build First)

1. **Authentication & User Management** ⭐⭐⭐
   - Foundation for everything
   - User registration, login, password reset
   - Role-based access (Customer, Admin, Agent)

2. **Customer Management** ⭐⭐⭐
   - Create/edit/view customer profiles
   - Search and list customers
   - Customer notes and history

3. **Subscription Management** ⭐⭐⭐
   - Create and manage subscriptions
   - Process payments
   - Track expiration dates
   - Send renewal reminders

4. **Document Management** ⭐⭐⭐
   - Upload documents securely
   - View and download documents
   - Store in cloud storage
   - Track document access

5. **Emergency Access System** ⭐⭐⭐
   - Public lookup page (no login required)
   - Verify identity and retrieve documents
   - Log all access for HIPAA compliance
   - Send notification to customer

### Supporting Modules

6. **Content Management (Strapi)** ⭐⭐
   - Marketing pages (Home, About, FAQs, etc.)
   - Menu management
   - Media library

7. **Customer Portal Frontend** ⭐⭐
   - Dashboard
   - My Documents page
   - My Profile page
   - My Subscription page
   - ID Card display

8. **Public Website Frontend** ⭐⭐
   - Homepage
   - Registration flow
   - Login page
   - Information pages

---

## Module 1: Authentication & User Management

### Purpose
Foundation for all secure operations. Every user (customer, admin, agent) needs to authenticate before accessing the system.

### User Roles

**Customer (Registrant):**
- Can upload and manage their own documents
- Can update their profile
- Can manage their subscription
- Can view their ID card

**Admin (Staff):**
- Can manage all customers
- Can create/edit/delete customer records
- Can manage subscriptions
- Can view audit logs
- Can update website content

**Agent (Sales):**
- Can create customer accounts
- Can view assigned customers
- Can process new registrations
- Limited access compared to Admin

**Content Editor:**
- Can edit website content in Strapi
- No access to customer data

### Features to Build

#### User Registration
- Multi-step registration form
- Email/password input with validation
- Password strength requirements (min 8 chars, 1 uppercase, 1 number)
- Email verification (send confirmation email with link)
- Terms and conditions acceptance
- Welcome email after account activation

#### User Login
- Email and password authentication
- "Remember me" checkbox (7-day vs 1-day session)
- JWT token generation on successful login
- Failed login attempt tracking (lock after 5 failed attempts)
- Session expiration after inactivity (30 minutes)

#### Password Reset
- "Forgot Password" link on login page
- Email input to request reset
- Send password reset email with secure token
- Reset token expires after 1 hour
- New password form with confirmation
- Success message after password changed

#### User Profile Management
- View current profile information
- Edit personal details
- Change email (requires re-verification)
- Change password (requires current password)
- Update notification preferences

### Database Tables Needed

**users table:**
- id (UUID primary key)
- email (unique, not null)
- password_hash (bcrypt hashed, not null)
- role (enum: customer, admin, agent, editor)
- email_verified (boolean, default false)
- verification_token (string, nullable)
- reset_token (string, nullable)
- reset_token_expires (timestamp, nullable)
- failed_login_attempts (integer, default 0)
- locked_until (timestamp, nullable)
- last_login (timestamp)
- created_at (timestamp)
- updated_at (timestamp)

**sessions table:**
- id (UUID primary key)
- user_id (foreign key to users.id)
- token (string, unique)
- expires_at (timestamp)
- created_at (timestamp)

### API Endpoints to Create

**Authentication:**
- POST `/api/auth/register` - Create new user account
- POST `/api/auth/login` - Authenticate user and return JWT token
- POST `/api/auth/logout` - Invalidate JWT token
- POST `/api/auth/verify-email` - Verify email with token
- POST `/api/auth/forgot-password` - Send password reset email
- POST `/api/auth/reset-password` - Reset password with token
- POST `/api/auth/refresh-token` - Refresh expired JWT token

**User Management:**
- GET `/api/users/me` - Get current logged-in user profile
- PUT `/api/users/me` - Update current user profile
- PUT `/api/users/me/password` - Change current user password
- PUT `/api/users/me/email` - Change current user email

### Security Considerations

**Password Security:**
- Hash passwords using bcrypt with salt rounds of 12
- Never store plain text passwords
- Never return password hashes in API responses

**JWT Tokens:**
- Sign tokens with secret key stored in environment variables
- Include user_id and role in token payload
- Set expiration: 1 day for normal, 7 days for "remember me"
- Verify token on every protected API request

**Email Verification:**
- Generate random verification token (UUID)
- Send verification link via email
- Token expires after 24 hours
- Mark email as verified when token validated

**Rate Limiting:**
- Limit login attempts to 5 per 15 minutes per IP
- Limit password reset requests to 3 per hour per email

### Email Templates Needed

1. **Welcome Email** - Sent after registration
2. **Email Verification** - Sent to verify new email address
3. **Password Reset** - Sent when user requests password reset
4. **Password Changed** - Confirmation when password is changed
5. **Account Locked** - Notification when account is locked due to failed logins

---

## Module 2: Customer Management

### Purpose
Manage customer records, personal information, and account status. This is the core business function that tracks all registrants.

### Features to Build

#### Create Customer
**From Admin Interface:**
- Admin can manually create customer account
- Fill in customer information form
- Assign customer to an agent (optional)
- Generate unique customer ID
- Create linked user account automatically
- Send welcome email to customer

**From Public Registration:**
- Customer self-registers through public website
- Payment processed
- Customer record auto-created
- User account auto-created
- Welcome email sent

#### View Customer Profile
- Display all customer information in organized layout
- Show subscription status
- Show document count
- Display emergency contact information
- Show account creation date and last activity
- Display ID card number
- List all linked subscriptions
- Show payment history

#### Edit Customer
- Update personal information fields
- Modify emergency contact details
- Update address information
- Change account status (active/inactive)
- Track modification history (who changed what and when)
- Send notification to customer if email changed

#### Search Customers
**Search Options:**
- Search by name (first or last)
- Search by email address
- Search by customer ID
- Search by phone number
- Search by ID card number

**Filters:**
- Filter by status (active, inactive, expired)
- Filter by subscription status (active, expired, cancelled)
- Filter by registration date range
- Filter by state/location

#### List All Customers
- Paginated table view (20 customers per page)
- Sort by any column (name, email, date registered, status)
- Quick filters for common views
- Bulk actions (export, send email, deactivate)
- Export to CSV functionality

#### Customer Notes
- Add internal notes to customer record
- View note history
- Track who added each note and when
- Search notes

### Database Tables Needed

**customers table:**
- id (UUID primary key)
- user_id (foreign key to users.id)
- customer_number (unique string, auto-generated)
- first_name (string, not null)
- last_name (string, not null)
- date_of_birth (date)
- phone (string)
- address_line1 (string)
- address_line2 (string)
- city (string)
- state (string)
- zip_code (string)
- country (string, default 'USA')
- emergency_contact_name (string)
- emergency_contact_phone (string)
- emergency_contact_relationship (string)
- status (enum: active, inactive, deceased)
- assigned_agent_id (foreign key to users.id, nullable)
- notes (text)
- created_at (timestamp)
- updated_at (timestamp)
- created_by (foreign key to users.id)

**customer_notes table:**
- id (UUID primary key)
- customer_id (foreign key to customers.id)
- user_id (foreign key to users.id)
- note_text (text, not null)
- created_at (timestamp)

**customer_audit_log table:**
- id (UUID primary key)
- customer_id (foreign key to customers.id)
- user_id (foreign key to users.id)
- action (enum: created, updated, deleted, status_changed)
- field_changed (string)
- old_value (text)
- new_value (text)
- created_at (timestamp)

### API Endpoints to Create

**Customer CRUD:**
- POST `/api/customers` - Create new customer
- GET `/api/customers/:id` - Get customer by ID
- PUT `/api/customers/:id` - Update customer information
- DELETE `/api/customers/:id` - Delete/deactivate customer
- GET `/api/customers` - List all customers (with pagination, filters, search)
- GET `/api/customers/search?q=query` - Search customers by keyword

**Customer Notes:**
- POST `/api/customers/:id/notes` - Add note to customer
- GET `/api/customers/:id/notes` - Get all notes for customer
- PUT `/api/notes/:id` - Update note
- DELETE `/api/notes/:id` - Delete note

**Customer Actions:**
- POST `/api/customers/:id/deactivate` - Deactivate customer account
- POST `/api/customers/:id/reactivate` - Reactivate customer account
- GET `/api/customers/:id/audit-log` - Get customer change history

**Exports:**
- GET `/api/customers/export?format=csv` - Export customer list to CSV

### Admin Interface Pages

**Customer List Page:**
- Table with columns: Name, Email, Phone, Status, Subscription Status, Registered Date
- Search bar at top
- Filter dropdowns (status, subscription status, date range)
- "Create New Customer" button
- Pagination controls
- Export button

**Customer Detail Page:**
- Customer information section
- Subscription information section
- Documents uploaded section
- Notes section
- Audit log section
- Action buttons (Edit, Deactivate, Send Email)

**Create/Edit Customer Form:**
- Personal Information section
- Contact Information section
- Emergency Contact section
- Address Information section
- Agent Assignment dropdown
- Status selector
- Save/Cancel buttons

---

## Module 3: Subscription Management

### Purpose
Track customer subscriptions, renewal dates, payment history, and automate billing. This ensures customers maintain active service and generates revenue.

### Subscription Types

**Individual Plan:**
- Single person coverage
- One set of documents
- Annual or monthly billing
- Price: $29.95/year or $3.95/month

**Family Plan:**
- Up to 4 family members
- Separate documents for each
- Annual or monthly billing
- Price: $79.95/year or $8.95/month

**Organization Plan:**
- Custom pricing
- Bulk registration
- Corporate/facility accounts
- Negotiated terms

### Features to Build

#### Create Subscription
- Link to customer account
- Select plan type
- Choose billing cycle (monthly/annual)
- Set start date (default: today)
- Calculate end date automatically
- Capture payment method
- Process initial payment
- Generate invoice
- Send confirmation email

#### View Subscription
- Display subscription details
- Show plan type and pricing
- Display billing cycle
- Show start and end dates
- List payment history
- Show invoice history
- Display auto-renew status
- Calculate days until expiration

#### Edit Subscription
- Update plan type (with prorated billing)
- Change billing cycle
- Update payment method
- Enable/disable auto-renewal
- Set custom expiration date
- Add subscription notes

#### Cancel Subscription
- Require cancellation reason
- Set end date (immediate or at period end)
- Stop auto-renewal
- Send cancellation confirmation email
- Offer retention incentive popup

#### Renew Subscription
- Manual renewal by admin
- Automatic renewal for auto-renew subscriptions
- Process payment
- Extend end date by billing cycle period
- Generate new invoice
- Send renewal confirmation email

#### Automatic Processing

**Daily Cron Job Tasks:**
- Check for subscriptions expiring in 30 days → send reminder email
- Check for subscriptions expiring in 7 days → send urgent reminder
- Check for subscriptions expiring in 1 day → send final reminder
- Check for subscriptions expiring today → send expiration notice
- Check for subscriptions with auto-renew enabled → process renewal
- Check for failed renewal payments → retry payment
- Mark expired subscriptions as "expired" status

#### Payment Processing
- Integrate with Stripe API
- Save payment method securely (tokenized)
- Process one-time payments
- Process recurring payments
- Handle payment failures
- Retry failed payments (3 attempts)
- Send payment receipt emails

### Database Tables Needed

**subscriptions table:**
- id (UUID primary key)
- customer_id (foreign key to customers.id)
- plan_type (enum: individual, family, organization, custom)
- billing_cycle (enum: monthly, annual)
- start_date (date, not null)
- end_date (date, not null)
- status (enum: active, expired, cancelled, suspended)
- price (decimal, not null)
- auto_renew (boolean, default true)
- payment_method_id (string, Stripe token)
- cancellation_reason (text)
- cancelled_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)

**payments table:**
- id (UUID primary key)
- subscription_id (foreign key to subscriptions.id)
- customer_id (foreign key to customers.id)
- amount (decimal, not null)
- currency (string, default 'USD')
- payment_method (enum: credit_card, paypal, check, wire)
- transaction_id (string, from Stripe)
- status (enum: pending, completed, failed, refunded)
- processed_at (timestamp)
- created_at (timestamp)

**invoices table:**
- id (UUID primary key)
- invoice_number (string, unique, auto-generated)
- customer_id (foreign key to customers.id)
- subscription_id (foreign key to subscriptions.id)
- amount (decimal, not null)
- status (enum: pending, paid, overdue, cancelled)
- issue_date (date, not null)
- due_date (date, not null)
- paid_date (date)
- pdf_url (string, S3 URL)
- created_at (timestamp)

**payment_methods table:**
- id (UUID primary key)
- customer_id (foreign key to customers.id)
- stripe_payment_method_id (string)
- card_brand (string)
- card_last4 (string)
- expiry_month (integer)
- expiry_year (integer)
- is_default (boolean)
- created_at (timestamp)

### API Endpoints to Create

**Subscription Management:**
- POST `/api/subscriptions` - Create new subscription
- GET `/api/subscriptions/:id` - Get subscription details
- PUT `/api/subscriptions/:id` - Update subscription
- DELETE `/api/subscriptions/:id` - Cancel subscription
- POST `/api/subscriptions/:id/renew` - Manually renew subscription
- GET `/api/customers/:id/subscriptions` - Get all subscriptions for customer

**Payment Processing:**
- POST `/api/payments/process` - Process a payment
- POST `/api/payments/refund/:id` - Refund a payment
- GET `/api/payments/:id` - Get payment details
- GET `/api/subscriptions/:id/payments` - Get payment history

**Invoice Management:**
- GET `/api/invoices/:id` - Get invoice details
- GET `/api/invoices/:id/download` - Download invoice PDF
- GET `/api/customers/:id/invoices` - Get all invoices for customer
- POST `/api/invoices/:id/send` - Email invoice to customer

**Payment Methods:**
- POST `/api/customers/:id/payment-methods` - Add payment method
- GET `/api/customers/:id/payment-methods` - Get customer payment methods
- PUT `/api/payment-methods/:id/set-default` - Set default payment method
- DELETE `/api/payment-methods/:id` - Remove payment method

**Admin Reports:**
- GET `/api/reports/subscriptions/expiring` - Get subscriptions expiring soon
- GET `/api/reports/subscriptions/expired` - Get expired subscriptions
- GET `/api/reports/revenue/monthly` - Get monthly revenue report

### Stripe Integration

**Setup:**
- Create Stripe account
- Get API keys (publishable and secret)
- Store in environment variables
- Install Stripe SDK

**Payment Flow:**
1. Customer enters card details on frontend
2. Frontend sends card info to Stripe (client-side)
3. Stripe returns payment method token
4. Frontend sends token to API
5. API creates payment intent with Stripe
6. API confirms payment
7. API records payment in database
8. API sends confirmation email

**Webhook Handling:**
- Set up webhook endpoint in API
- Listen for Stripe events:
  - `payment_intent.succeeded` - Payment successful
  - `payment_intent.failed` - Payment failed
  - `customer.subscription.updated` - Subscription changed
  - `invoice.payment_succeeded` - Recurring payment succeeded

### Email Notifications

1. **Subscription Created** - Confirmation of new subscription
2. **Subscription Renewed** - Confirmation of renewal
3. **Subscription Expiring (30 days)** - First reminder
4. **Subscription Expiring (7 days)** - Second reminder
5. **Subscription Expiring (1 day)** - Final reminder
6. **Subscription Expired** - Notice of expiration
7. **Subscription Cancelled** - Cancellation confirmation
8. **Payment Successful** - Receipt of payment
9. **Payment Failed** - Notice of failed payment
10. **Auto-Renew Failed** - Notice when auto-renewal fails

---

## Module 4: Document Management

### Purpose
Allow customers to upload, store, and manage their living will and advance directive documents securely. Provide secure cloud storage with encryption and access logging for HIPAA compliance.

### Document Types Supported

1. **Living Will** - Primary advance directive
2. **Healthcare Power of Attorney** - Designates healthcare proxy
3. **Healthcare Proxy** - Similar to power of attorney
4. **DNR (Do Not Resuscitate)** - Resuscitation preferences
5. **POLST (Physician Orders for Life-Sustaining Treatment)**
6. **Other Advance Directives** - Any other related documents

### Features to Build

#### Document Upload
- Drag-and-drop file upload interface
- Click to browse and select files
- Multiple file upload at once
- File type validation (PDF, DOC, DOCX, JPG, PNG only)
- File size limit: 10MB per document
- Virus/malware scanning before storage
- Progress indicator during upload
- Upload success/error notifications

#### Document Storage
- Store files in AWS S3 or compatible cloud storage
- Generate unique filename (UUID + original extension)
- Organize by customer: `/customers/{customer-id}/{document-id}.pdf`
- Encrypt files at rest using AES-256
- Create automatic backups
- Generate thumbnail for preview (if PDF/image)
- Store metadata in database

#### Document Viewing
- List all customer documents in table/grid view
- Show document thumbnail
- Display document metadata (name, type, size, upload date)
- In-browser PDF viewer for preview
- Zoom controls for PDF viewing
- Download original file button
- Print document button
- Generate temporary signed URL (expires in 1 hour)

#### Document Management
- Replace document (upload new version)
- Delete document (soft delete with confirmation)
- Version history (keep previous versions)
- Download all documents as ZIP file
- Share document via secure link (optional)

#### Document Access Logging
- Log every document access (view, download, print)
- Record who accessed (user_id, name, role)
- Record when accessed (timestamp)
- Record access method (portal, emergency access, admin)
- Record IP address
- Record user agent (browser info)
- Available for audit and HIPAA compliance

#### Document Security
- Only customer can view their own documents
- Admin can view all documents
- Emergency access requires verification
- Generate temporary signed URLs (no direct access)
- Encrypt files at rest and in transit
- Secure file deletion (overwrite before deleting)

### Database Tables Needed

**documents table:**
- id (UUID primary key)
- customer_id (foreign key to customers.id)
- document_type (enum: living_will, healthcare_poa, healthcare_proxy, dnr, polst, other)
- original_filename (string)
- stored_filename (string, UUID-based)
- file_url (string, S3 URL)
- file_size (integer, bytes)
- mime_type (string)
- thumbnail_url (string, S3 URL, nullable)
- version (integer, default 1)
- parent_document_id (foreign key to documents.id, nullable)
- status (enum: active, replaced, deleted)
- uploaded_by (foreign key to users.id)
- uploaded_at (timestamp)
- deleted_at (timestamp, nullable)
- deleted_by (foreign key to users.id, nullable)

**document_access_logs table:**
- id (UUID primary key)
- document_id (foreign key to documents.id)
- customer_id (foreign key to customers.id)
- accessed_by (foreign key to users.id, nullable)
- accessor_name (string, for emergency access without login)
- access_type (enum: viewed, downloaded, printed, deleted, replaced)
- access_method (enum: portal, emergency_access, admin, api)
- ip_address (string)
- user_agent (text)
- accessed_at (timestamp)

### API Endpoints to Create

**Document Upload & Management:**
- POST `/api/documents/upload` - Upload new document
- GET `/api/documents/:id` - Get document metadata
- GET `/api/documents/:id/download` - Generate signed URL for download
- PUT `/api/documents/:id/replace` - Replace document with new version
- DELETE `/api/documents/:id` - Delete document (soft delete)
- GET `/api/customers/:id/documents` - Get all documents for customer
- POST `/api/customers/:id/documents/download-all` - Generate ZIP of all documents

**Document Access Logging:**
- POST `/api/documents/:id/log-access` - Log document access
- GET `/api/documents/:id/access-logs` - Get access logs for document
- GET `/api/customers/:id/access-logs` - Get all access logs for customer

**Document Sharing (Optional for MVP):**
- POST `/api/documents/:id/share` - Generate shareable link
- GET `/api/documents/shared/:token` - Access document via shared link

### AWS S3 Configuration

**Bucket Structure:**
```
s3://alwr-documents/
  ├── customers/
  │   ├── {customer-id}/
  │   │   ├── {doc-id}_living_will.pdf
  │   │   ├── {doc-id}_healthcare_poa.pdf
  │   │   └── thumbnails/
  │   │       ├── {doc-id}_thumb.jpg
```

**S3 Bucket Settings:**
- Private bucket (no public access)
- Server-side encryption enabled (AES-256)
- Versioning enabled
- Lifecycle rules: Move to Glacier after 2 years
- CORS configured for browser uploads
- Access restricted to API server only

**Signed URLs:**
- Generate temporary URLs with 1-hour expiration
- Use AWS SDK to create signed URL
- Include security token
- URL expires automatically

### File Upload Flow

1. Customer selects file in browser
2. Frontend validates file type and size
3. Frontend sends file to API via multipart form
4. API validates file again (security)
5. API scans file for viruses (ClamAV or similar)
6. API generates unique filename
7. API uploads file to S3
8. API generates thumbnail (if PDF/image)
9. API saves metadata to database
10. API returns success response
11. Frontend displays success message

### Document Deletion Flow

1. Customer clicks delete button
2. Frontend shows confirmation dialog
3. Customer confirms deletion
4. Frontend sends DELETE request to API
5. API marks document as "deleted" in database
6. API does NOT immediately delete from S3 (soft delete)
7. API logs deletion in audit log
8. After 30 days, scheduled job permanently deletes from S3

---

## Module 5: Emergency Access System

### Purpose
Provide 24/7 public access for medical personnel to retrieve patient documents during emergencies. This is the core value proposition of ALWR - making living wills accessible when they're needed most.

### Key Requirements

- **No login required** - Medical personnel don't have accounts
- **Available 24/7** - Must be highly reliable
- **HIPAA compliant** - All access must be logged
- **Secure verification** - Multiple methods to verify identity
- **Fast retrieval** - Documents must load quickly
- **Mobile-friendly** - Works on any device
- **Multi-language** - Instructions in English and Spanish

### Features to Build

#### Public Emergency Access Page

**URL:** `/emergency-access`

**Page Layout:**
- Large, clear headline: "Emergency Document Access"
- Prominent toll-free phone number
- Simple lookup form
- Instructions in plain language
- Available 24/7 notice
- HIPAA compliance notice
- Help/FAQ link

#### Patient Lookup Methods

**Method 1: ID Card Information**
- Input fields:
  - Patient Last Name
  - Patient First Name
  - ID Card Number (8-12 digits)
- Click "Verify" button

**Method 2: Personal Information**
- Input fields:
  - Patient Last Name
  - Patient First Name
  - Date of Birth (MM/DD/YYYY)
  - Last 4 digits of phone number
- Click "Verify" button

**Method 3: Emergency Access Code**
- Input fields:
  - Emergency Access Code (unique code on ID card)
- Click "Retrieve Documents" button

#### Verification Process

1. User enters patient information
2. System searches database for matching customer
3. If found, request additional verifying information:
   - Requestor's name
   - Requestor's role (Doctor, Nurse, EMT, Social Worker, etc.)
   - Facility name (Hospital, Clinic, etc.)
   - Reason for access
   - Phone number
4. Display documents if verification successful
5. Log all access details

#### Document Retrieval Page

**After Successful Verification:**
- Display patient name (confirm identity)
- List all available documents
- Document thumbnails (if available)
- View button for each document
- Download individual document button
- Download all documents (ZIP) button
- Print all documents button
- Send documents via fax option
- Clear instructions

#### Document Display
- In-browser PDF viewer
- Zoom controls
- Print button
- Download button
- Return to list button
- Help information

#### Access Logging
**Every access logs:**
- Patient customer ID
- Accessor name and role
- Facility name and phone
- Access method used
- Which documents were viewed/downloaded
- IP address
- Timestamp
- Browser information

#### Customer Notification
- Send email to customer within 1 hour
- Subject: "Your Documents Were Accessed"
- Include: Date, time, accessor name, facility
- Provide contact info if customer has concerns

### Database Tables Needed

**emergency_access_logs table:**
- id (UUID primary key)
- customer_id (foreign key to customers.id)
- accessor_name (string, not null)
- accessor_role (string, not null)
- facility_name (string)
- facility_phone (string)
- access_reason (text)
- verification_method (enum: id_card, personal_info, emergency_code)
- documents_accessed (array of document IDs)
- ip_address (string)
- user_agent (text)
- accessed_at (timestamp)
- customer_notified_at (timestamp)

**id_cards table:**
- id (UUID primary key)
- customer_id (foreign key to customers.id)
- card_number (string, unique, 10 digits)
- emergency_code (string, unique, 16 chars)
- issued_date (date)
- status (enum: active, inactive, lost, replaced)
- deactivated_at (timestamp)
- replacement_for (foreign key to id_cards.id, nullable)

### API Endpoints to Create

**Emergency Access:**
- POST `/api/emergency-access/verify-id-card` - Verify using ID card number
- POST `/api/emergency-access/verify-personal-info` - Verify using personal information
- POST `/api/emergency-access/verify-emergency-code` - Verify using emergency code
- POST `/api/emergency-access/log-and-retrieve` - Log access and return documents
- GET `/api/emergency-access/document/:id` - Get document with temporary signed URL
- POST `/api/emergency-access/download-all` - Generate ZIP of all documents
- POST `/api/emergency-access/fax` - Fax documents to facility

**ID Card Management:**
- POST `/api/customers/:id/id-card` - Generate ID card
- GET `/api/customers/:id/id-card` - Get customer's ID card info
- PUT `/api/id-cards/:id/deactivate` - Deactivate lost/stolen card
- POST `/api/id-cards/:id/replace` - Issue replacement card

### ID Card Generation

**Physical ID Card (Printed and Mailed):**
- Customer name
- Card number (10 digits)
- Emergency phone number (toll-free)
- Website: www.alwr.com/emergency-access
- QR code (links to emergency access with customer ID)
- Instructions in English and Spanish

**Digital ID Card (PDF Download):**
- Same information as physical card
- Printable format
- Include in welcome email
- Available in customer portal

### Emergency Access Flow

1. Medical personnel arrives at `/emergency-access` page
2. Enters patient name and ID card number
3. System searches database for customer
4. If found, request facility and accessor information
5. System displays form for facility details
6. Medical personnel enters their information
7. System logs the access request
8. System displays list of available documents
9. Medical personnel views/downloads needed documents
10. System logs each document access
11. System sends email notification to customer
12. Medical personnel prints or downloads documents

### Security Measures

- Rate limiting on verification attempts (5 per 10 minutes per IP)
- Log all failed verification attempts
- Alert admins of suspicious patterns
- No indication if customer exists or not (prevent fishing)
- Temporary signed URLs expire in 1 hour
- No caching of documents
- HTTPS enforced
- Monitor for scraping/abuse

### HIPAA Compliance

- Every access is logged with full details
- Audit logs are immutable (cannot be edited/deleted)
- Customer notified of all access
- Access logs retained for 6 years
- Regular audit reports generated
- Suspicious access flagged for review

### Multi-Language Support

**English and Spanish translations needed for:**
- Page instructions
- Form labels
- Button text
- Error messages
- Help documentation
- Email notifications

---

## Module 6: Content Management (Strapi)

### Purpose
Provide a user-friendly interface for the marketing team to manage website content without needing developer assistance. This keeps the business logic (Custom API) separate from the content (Strapi CMS).

### Why Strapi?

- **Headless CMS** - API-first, works with any frontend
- **User-friendly** - WordPress-like interface
- **Open-source** - Free and customizable
- **Built-in features** - Media library, roles, API generation
- **Self-hosted** - Full control over data

### Features to Build

#### Page Management

**Page Creation:**
- Create new page with form
- Enter page title
- Generate URL slug automatically (editable)
- Select page template (default, landing, full-width)
- Write content in rich text editor
- Add featured image
- Set SEO metadata
- Save as draft or publish immediately
- Schedule future publishing (optional)

**Page Editing:**
- Edit page content in rich text editor
- Change page title and slug
- Update featured image
- Modify SEO settings
- Preview before publishing
- View revision history
- Restore previous version

**Page Organization:**
- Set parent page (create hierarchy)
- Reorder pages in list
- Bulk actions (publish, unpublish, delete)
- Filter by status (draft, published, archived)
- Search pages by title

#### Rich Text Editor

**Built-in Editing Tools:**
- Text formatting (bold, italic, underline, strikethrough)
- Headings (H1, H2, H3, H4, H5, H6)
- Paragraphs and line breaks
- Lists (bulleted, numbered)
- Text alignment (left, center, right, justify)
- Insert links (internal pages, external URLs)
- Insert images from media library
- Insert videos (YouTube, Vimeo embed codes)
- Insert tables
- Insert horizontal rules
- Block quotes
- Code blocks (for developers)
- Undo/Redo
- HTML view (for advanced users)

#### Menu Management

**Create Menus:**
- Create menu (Header Menu, Footer Menu, etc.)
- Set menu location
- Add menu items (pages, custom links)
- Create nested structure (parent/child items)
- Reorder items with drag-and-drop
- Set link target (same window, new window)
- Toggle item visibility

**Menu Item Types:**
- Link to internal page
- Link to external URL
- Link to custom URL
- Dropdown parent (contains children)

#### Media Library

**File Upload:**
- Drag-and-drop file upload
- Browse and select files
- Multiple file upload at once
- Supported types: JPG, PNG, GIF, WebP, PDF, DOC, DOCX
- Auto-generate multiple sizes for images
- Display file preview

**File Management:**
- View all uploaded files in grid or list
- Create folders for organization
- Search files by name
- Filter by file type
- View file details (size, dimensions, upload date)
- Replace file
- Delete file
- Copy file URL

**Image Editing:**
- Crop image
- Resize image
- Add alt text (accessibility)
- Add caption
- Set focal point

#### SEO Management (Per Page)

**SEO Fields:**
- Meta title (60 chars max)
- Meta description (160 chars max)
- Keywords (comma-separated)
- Open Graph title (social sharing)
- Open Graph description (social sharing)
- Open Graph image (social sharing)
- Twitter Card settings
- Canonical URL
- Robots meta (index/noindex)

**SEO Tools:**
- Character count indicators
- Preview how page appears in search results
- Preview social sharing cards
- SEO score/recommendations

### Content Types to Create in Strapi

#### 1. Page Content Type

**Fields:**
- title (Text, required)
- slug (UID, auto-generated from title, required)
- content (Rich Text, required)
- excerpt (Textarea, optional)
- featured_image (Media, single image)
- status (Enumeration: draft, published, archived)
- publish_date (DateTime, optional)
- template (Enumeration: default, landing, fullwidth)
- parent_page (Relation: Page, optional)
- order (Number, for sorting)
- seo_title (Text, 60 chars max)
- seo_description (Textarea, 160 chars max)
- seo_keywords (Text)
- og_title (Text)
- og_description (Textarea)
- og_image (Media, single image)
- created_at (DateTime, auto)
- updated_at (DateTime, auto)

#### 2. Menu Content Type

**Fields:**
- name (Text, required) - e.g., "Header Menu", "Footer Menu"
- location (Enumeration: header, footer, sidebar)
- items (Component, repeatable: MenuItem)

**MenuItem Component:**
- label (Text, required) - Display text
- url (Text, optional) - Custom URL
- page (Relation: Page, optional) - Link to internal page
- target (Enumeration: self, blank) - Link target
- order (Number) - Sort order
- parent_id (Number, optional) - For nested menus
- children (Component, repeatable: MenuItem) - Nested items

#### 3. Site Settings Content Type (Single Type)

**Fields:**
- site_title (Text)
- site_tagline (Text)
- logo (Media, single image)
- favicon (Media, single image)
- footer_text (Text)
- copyright_text (Text)
- social_links (Component, repeatable: SocialLink)
- contact_email (Email)
- contact_phone (Text)
- emergency_phone (Text)
- address (Rich Text)

**SocialLink Component:**
- platform (Enumeration: facebook, twitter, instagram, linkedin, youtube)
- url (Text)
- icon (Text, optional)

#### 4. Blog Article Content Type (Optional for MVP)

**Fields:**
- title (Text, required)
- slug (UID, auto-generated)
- content (Rich Text, required)
- excerpt (Textarea)
- featured_image (Media)
- author (Relation: User)
- category (Relation: Category)
- tags (Relation: Tag, multiple)
- status (Enumeration: draft, published)
- publish_date (DateTime)
- seo fields (same as Page)

### Pages to Create in Strapi

**From the website sitemap, create these pages:**

1. **Homepage** - Hero, benefits, how it works, testimonials
2. **About Us** - Company information
3. **Company Background** - History and mission
4. **Links** - Useful resources
5. **Privacy Policy** - Privacy information
6. **Terms of Service** - Terms and conditions
7. **How It Works** - Step-by-step process
8. **Registration Fees** - Pricing information
9. **About Advance Directives** - Educational content
10. **Library** - Resource library
11. **Educational Resources** - Articles and guides
12. **State Forms** - State-specific forms
13. **Religious Forms** - Religious directive forms
14. **Canadian Forms** - Canadian forms
15. **HIPAA Release Forms** - HIPAA forms
16. **FAQs** - Frequently asked questions
17. **Seminars** - Seminar information
18. **Rotary Clubs** - Rotary club partnership info
19. **Testimonials** - Customer testimonials
20. **Request Information** - Contact form page

### Strapi Admin Interface

**User Roles:**
- **Super Admin** - Full access to everything
- **Content Editor** - Can create/edit/publish content
- **Content Writer** - Can create/edit but not publish
- **Media Manager** - Can upload/manage media only

### API Integration with Frontend

**How Frontend Gets Content from Strapi:**

1. Frontend makes API request to Strapi
   - Example: `GET https://cms.alwr.com/api/pages?filters[slug][$eq]=about-us`

2. Strapi returns JSON data
   - Page title, content, images, SEO metadata

3. Frontend renders the page
   - Displays content from Strapi
   - Applies styling
   - Shows navigation from Strapi menus

**Example API Response:**
```json
{
  "data": {
    "id": 1,
    "attributes": {
      "title": "About Us",
      "slug": "about-us",
      "content": "<h2>Our Story</h2><p>Founded in 1995...</p>",
      "featured_image": {
        "url": "/uploads/about_hero.jpg"
      },
      "seo_title": "About ALWR - America Living Will Registry",
      "seo_description": "Learn about ALWR's mission..."
    }
  }
}
```

### Strapi Setup Steps

1. Create new Strapi project in Replit
2. Configure PostgreSQL database
3. Set admin credentials
4. Create content types (Page, Menu, Site Settings)
5. Configure API permissions (allow public read access)
6. Add sample pages
7. Configure media upload settings
8. Set up CORS to allow frontend access
9. Generate API tokens for frontend
10. Document API endpoints for frontend team

---

## Module 7: Customer Portal Frontend

### Purpose
Provide a self-service interface for customers to manage their account, documents, and subscription without contacting support.

### Portal Pages to Build

#### 1. Dashboard Page

**URL:** `/dashboard`

**Page Layout:**
- Welcome message with customer name
- Account status banner (subscription active/expired)
- Quick stats cards:
  - Subscription expiration date
  - Documents uploaded
  - ID card status
  - Last login date
- Quick action buttons:
  - Upload Document
  - Download ID Card
  - Renew Subscription
  - Update Profile
- Recent activity feed
- Renewal reminder (if expiring soon)

**Features:**
- Responsive design (mobile-friendly)
- Loading states
- Error handling
- Real-time data updates

#### 2. My Documents Page

**URL:** `/dashboard/documents`

**Page Layout:**
- Upload button (prominent)
- Document list/grid view toggle
- Filter by document type
- Search documents
- Sort options (date, name, type)

**Document Display (Grid View):**
- Document thumbnail
- Document name
- Document type badge
- Upload date
- File size
- Action menu (view, download, replace, delete)

**Document Display (List View):**
- Table with columns: Name, Type, Size, Uploaded, Actions
- Checkbox for bulk actions
- Select all option

**Document Upload:**
- Click "Upload Document" button
- Drag-and-drop area appears
- Or click to browse files
- Select document type from dropdown
- Progress bar during upload
- Success/error notification
- Automatically adds to list

**Document Actions:**
- **View:** Opens PDF viewer modal
- **Download:** Downloads file to computer
- **Replace:** Upload new version
- **Delete:** Shows confirmation, then deletes

**Empty State:**
- "No documents uploaded yet" message
- Large upload button
- Instructions
- Link to help documentation

#### 3. My Profile Page

**URL:** `/dashboard/profile`

**Sections:**

**Personal Information:**
- First Name (editable)
- Last Name (editable)
- Date of Birth (editable)
- Phone Number (editable)
- Edit/Save buttons

**Address Information:**
- Address Line 1 (editable)
- Address Line 2 (editable)
- City (editable)
- State (dropdown)
- ZIP Code (editable)
- Country (dropdown)
- Edit/Save buttons

**Emergency Contact:**
- Contact Name (editable)
- Relationship (editable)
- Phone Number (editable)
- Edit/Save buttons

**Account Settings:**
- Email Address (editable, requires verification)
- Change Password button (opens modal)
- Email Preferences checkboxes:
  - Renewal reminders
  - Product updates
  - Newsletter
- Save Preferences button

**Change Password Modal:**
- Current Password field
- New Password field
- Confirm New Password field
- Password strength indicator
- Save/Cancel buttons

#### 4. My Subscription Page

**URL:** `/dashboard/subscription`

**Current Subscription Section:**
- Plan name (Individual/Family/Organization)
- Status badge (Active/Expired/Cancelled)
- Start date
- End date
- Days remaining (if active)
- Billing cycle (Monthly/Annual)
- Price per cycle
- Auto-renew status
- Payment method (last 4 digits)
- Renew Now button
- Cancel Subscription button

**Billing History:**
- Table of past payments
- Columns: Date, Amount, Status, Invoice
- Download invoice PDF button

**Payment Method:**
- Current card ending in XXXX
- Expiration date
- Update Payment Method button
- Opens Stripe payment form modal

**Manage Subscription:**
- Change Plan button (upgrade/downgrade)
- Enable/Disable Auto-Renew toggle
- Update Billing Cycle button

**Cancel Subscription:**
- Opens confirmation modal
- Requires reason selection
- Final confirmation
- Send cancellation email

#### 5. ID Card Page

**URL:** `/dashboard/id-card`

**Digital ID Card Display:**
- Card design with customer name
- Card number (10 digits)
- Emergency phone number
- QR code (links to emergency access)
- Website URL

**Actions:**
- Download PDF button
- Print button
- Email to Me button
- Order Physical Card button

**Instructions:**
- "Keep this card in your wallet"
- "Share emergency number with family"
- "Show card to medical personnel if needed"

**Card Status:**
- If active: Green "Active" badge
- If lost/stolen: Red "Deactivated" badge
- Report Lost/Stolen button

#### 6. Help Page

**URL:** `/dashboard/help`

**Sections:**
- Frequently Asked Questions
- Contact Support form
- Help articles
- Video tutorials
- Emergency contact info

### Shared Portal Components

**Navigation Bar:**
- ALWR logo (links to public homepage)
- Navigation links: Dashboard, Documents, Profile, Subscription, ID Card, Help
- User menu dropdown:
  - Account Settings
  - Logout

**Mobile Navigation:**
- Hamburger menu
- Slide-out drawer with navigation
- User info at top

**Loading States:**
- Skeleton screens for content loading
- Spinner for actions
- Progress bars for uploads

**Error Handling:**
- Toast notifications for errors
- Inline validation errors
- Error boundary for crashes
- Retry buttons

**Notifications:**
- Toast notifications (top-right)
- Success messages (green)
- Error messages (red)
- Info messages (blue)
- Warning messages (orange)

### Mobile Responsiveness

All portal pages must be fully responsive:
- Mobile-first design
- Touch-friendly buttons (min 44x44px)
- Readable text (min 16px font)
- Simplified navigation for mobile
- Optimized images
- Fast load times

---

## Module 8: Public Website Frontend

### Purpose
Provide a professional marketing website to attract new customers, explain the service, and facilitate registration. This is the first impression for potential customers.

### Website Pages to Build

#### 1. Homepage

**URL:** `/`

**Sections:**

**Hero Section:**
- Large headline: "Your Living Will, Available 24/7 When It Matters Most"
- Subheadline: "Secure online storage of your advance directives with guaranteed access in emergencies"
- Two prominent buttons:
  - "Register Now" (primary button, blue)
  - "Login" (secondary button, white/outline)
- Hero image or video background

**Value Proposition (3 Columns):**
- **Secure Storage** - Icon + Title + Description
  - "Your documents are encrypted and backed up daily"
- **24/7 Emergency Access** - Icon + Title + Description
  - "Medical personnel can retrieve your documents anytime, anywhere"
- **Peace of Mind** - Icon + Title + Description
  - "Your healthcare wishes will be known when it matters most"

**How It Works (3 Steps):**
- **Step 1: Register & Upload**
  - Icon with number 1
  - "Create your account and upload your documents in minutes"
  
- **Step 2: Receive ID Card**
  - Icon with number 2
  - "Get your ID card with emergency access information"
  
- **Step 3: Emergency Access**
  - Icon with number 3
  - "Medical personnel can access your documents 24/7"

**Statistics Section:**
- Years in Service: "30+ Years"
- Registrants Protected: "100,000+"
- States Covered: "All 50 States"
- Customer Satisfaction: "99.2%"

**Testimonials:**
- Carousel with 3-5 customer testimonials
- Customer name, photo (optional), location, date
- Star rating
- Testimonial text

**Trust Indicators:**
- HIPAA Compliant badge
- Secure Storage icon
- 24/7 Support badge
- Money-back guarantee

**Final Call-to-Action:**
- "Ready to Protect Your Healthcare Wishes?"
- Register Now button
- Pricing information link

**Footer:**
- Company logo
- Quick links (About, FAQs, Contact)
- Legal links (Privacy Policy, Terms)
- Social media icons
- Copyright notice

#### 2. Registration Flow

**URL:** `/register`

**Multi-Step Form:**

**Step 1: Choose Plan**
- Display pricing cards side-by-side
- Individual Plan: $29.95/year
  - Single person
  - Unlimited documents
  - 24/7 access
  - ID card included
- Family Plan: $79.95/year
  - Up to 4 people
  - Unlimited documents per person
  - 24/7 access
  - 4 ID cards included
- Highlight recommended plan
- Continue button

**Step 2: Create Account**
- Email address field
- Create password field
- Confirm password field
- Password strength meter
- "I agree to Terms & Conditions" checkbox
- Continue button
- Already have account? Login link

**Step 3: Personal Information**
- First name field
- Last name field
- Date of birth (date picker)
- Phone number field
- Address line 1
- Address line 2 (optional)
- City field
- State dropdown
- ZIP code field
- Country dropdown (default: USA)
- Emergency Contact section (optional):
  - Name field
  - Relationship field
  - Phone number field
- Continue button
- Back button

**Step 4: Payment**
- Order summary sidebar:
  - Plan name
  - Price
  - Billing cycle
  - Subtotal
  - Tax (if applicable)
  - Total
- Promo code field
- Apply button
- Credit card fields (Stripe Elements):
  - Card number
  - Expiration date
  - CVC
  - ZIP code
- Billing address checkbox:
  - "Same as personal address"
  - If unchecked, show billing address fields
- Secure checkout badges
- Complete Registration button
- Back button

**Step 5: Confirmation**
- Success icon/animation
- "Welcome to ALWR!" headline
- Order confirmation message
- What's next:
  - Check your email for confirmation
  - Upload your documents
  - Access your digital ID card
- Action buttons:
  - Go to Dashboard (primary)
  - Upload Documents Now (secondary)
- Order details summary

#### 3. Login Page

**URL:** `/login`

**Page Layout:**
- ALWR logo at top
- "Welcome Back" headline
- Login form card:
  - Email address field
  - Password field
  - Remember me checkbox
  - Forgot password link
  - Login button
- Don't have an account? Register link
- Or separator
- Emergency Access button (different color)

**Forgot Password Modal:**
- Email address field
- "We'll send you a reset link" message
- Send Reset Link button
- Back to Login link

#### 4. Information Pages

These pages pull content from Strapi CMS:

**About Us** (`/about`)
- Company history
- Mission statement
- Team information
- Contact information

**Registration Fees** (`/pricing`)
- Detailed pricing breakdown
- Plan comparison table
- FAQs about pricing
- Register button

**How It Works** (`/how-it-works`)
- Detailed explanation of service
- Step-by-step process
- Video tutorial
- Screenshots
- Register button

**About Advance Directives** (`/education/advance-directives`)
- What is a living will
- Healthcare power of attorney
- Why they're important
- How to create them
- Download free templates

**Library** (`/education/library`)
- Resource articles
- Educational videos
- Downloadable guides
- State-specific information

**FAQs** (`/faqs`)
- Accordion-style FAQ list
- Categories: Service, Documents, Billing, Emergency Access
- Search functionality
- Contact support link

**Testimonials** (`/testimonials`)
- Full list of customer testimonials
- Filter by date, location
- Submit your testimonial form

**Privacy Policy** (`/privacy`)
- Full privacy policy text
- HIPAA compliance info
- Last updated date

**Terms of Service** (`/terms`)
- Full terms and conditions
- Service agreement
- Last updated date

#### 5. Emergency Access Page

**URL:** `/emergency-access`

**This is a standalone page (covered in Module 5)**

Linked prominently from main navigation

### Website Navigation

**Header Navigation (Desktop):**
- ALWR Logo (links to homepage)
- About
- How It Works
- Pricing
- Education (dropdown):
  - About Advance Directives
  - Library
  - FAQs
- Login button
- Register button (prominent, blue)

**Header Navigation (Mobile):**
- Hamburger menu
- Slide-out menu with same links
- Login button
- Register button

**Footer Navigation:**
- About Us
- How It Works
- Pricing
- FAQs
- Contact
- Privacy Policy
- Terms of Service
- Emergency Access

### Design Guidelines

**Color Scheme:**
- Primary: Blue (#0066CC) - Trust, healthcare
- Secondary: Green (#00AA55) - Safety, security
- Accent: Orange (#FF6600) - Call-to-action
- Neutral: Gray scale

**Typography:**
- Headings: Montserrat or Roboto (bold, clean)
- Body: Open Sans or Lato (readable)
- Font sizes: Responsive (16px base, scale up)

**Imagery:**
- Professional healthcare photos
- Diverse people (all ages, backgrounds)
- Families together
- Healthcare settings
- Peaceful, comforting mood

**Buttons:**
- Primary: Blue background, white text
- Secondary: White background, blue border
- Hover states
- Min height: 44px (touch-friendly)

**Forms:**
- Clear labels
- Inline validation
- Error messages in red
- Success messages in green
- Helper text in gray

**Loading States:**
- Skeleton screens for content
- Spinners for buttons
- Progress bars for multi-step

**Responsive Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## Database Architecture

### Overview

The system uses **two separate PostgreSQL databases**:

1. **Business Database** - Custom API's database
   - Users, customers, subscriptions
   - Documents metadata
   - Payments, invoices
   - Emergency access logs

2. **CMS Database** - Strapi's database
   - Pages, menus, media
   - Blog articles (if added)
   - Site settings

### Why Two Databases?

- **Separation of concerns** - Business logic separate from content
- **Independent scaling** - Scale each database independently
- **Security** - Different access controls
- **Backup strategies** - Different backup schedules

### Business Database Schema

#### Core Tables

**users**
- id (UUID, primary key)
- email (varchar, unique)
- password_hash (varchar)
- role (enum: customer, admin, agent, editor)
- email_verified (boolean)
- verification_token (varchar)
- reset_token (varchar)
- reset_token_expires (timestamp)
- failed_login_attempts (integer)
- locked_until (timestamp)
- last_login (timestamp)
- created_at (timestamp)
- updated_at (timestamp)

**customers**
- id (UUID, primary key)
- user_id (UUID, foreign key → users.id)
- customer_number (varchar, unique)
- first_name (varchar)
- last_name (varchar)
- date_of_birth (date)
- phone (varchar)
- address_line1 (varchar)
- address_line2 (varchar)
- city (varchar)
- state (varchar)
- zip_code (varchar)
- country (varchar)
- emergency_contact_name (varchar)
- emergency_contact_phone (varchar)
- emergency_contact_relationship (varchar)
- status (enum: active, inactive, deceased)
- assigned_agent_id (UUID, foreign key → users.id)
- created_at (timestamp)
- updated_at (timestamp)
- created_by (UUID, foreign key → users.id)

**subscriptions**
- id (UUID, primary key)
- customer_id (UUID, foreign key → customers.id)
- plan_type (enum: individual, family, organization)
- billing_cycle (enum: monthly, annual)
- start_date (date)
- end_date (date)
- status (enum: active, expired, cancelled)
- price (decimal)
- auto_renew (boolean)
- payment_method_id (varchar)
- cancellation_reason (text)
- cancelled_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)

**documents**
- id (UUID, primary key)
- customer_id (UUID, foreign key → customers.id)
- document_type (enum: living_will, healthcare_poa, etc.)
- original_filename (varchar)
- stored_filename (varchar)
- file_url (varchar)
- file_size (integer)
- mime_type (varchar)
- thumbnail_url (varchar)
- version (integer)
- parent_document_id (UUID, foreign key → documents.id)
- status (enum: active, replaced, deleted)
- uploaded_by (UUID, foreign key → users.id)
- uploaded_at (timestamp)
- deleted_at (timestamp)
- deleted_by (UUID, foreign key → users.id)

**payments**
- id (UUID, primary key)
- subscription_id (UUID, foreign key → subscriptions.id)
- customer_id (UUID, foreign key → customers.id)
- amount (decimal)
- currency (varchar)
- payment_method (enum: credit_card, paypal)
- transaction_id (varchar)
- status (enum: pending, completed, failed)
- processed_at (timestamp)
- created_at (timestamp)

**invoices**
- id (UUID, primary key)
- invoice_number (varchar, unique)
- customer_id (UUID, foreign key → customers.id)
- subscription_id (UUID, foreign key → subscriptions.id)
- amount (decimal)
- status (enum: pending, paid, overdue)
- issue_date (date)
- due_date (date)
- paid_date (date)
- pdf_url (varchar)
- created_at (timestamp)

**emergency_access_logs**
- id (UUID, primary key)
- customer_id (UUID, foreign key → customers.id)
- accessor_name (varchar)
- accessor_role (varchar)
- facility_name (varchar)
- facility_phone (varchar)
- access_reason (text)
- verification_method (enum)
- documents_accessed (jsonb)
- ip_address (varchar)
- user_agent (text)
- accessed_at (timestamp)
- customer_notified_at (timestamp)

**id_cards**
- id (UUID, primary key)
- customer_id (UUID, foreign key → customers.id)
- card_number (varchar, unique)
- emergency_code (varchar, unique)
- issued_date (date)
- status (enum: active, inactive, lost)
- deactivated_at (timestamp)
- replacement_for (UUID, foreign key → id_cards.id)

**document_access_logs**
- id (UUID, primary key)
- document_id (UUID, foreign key → documents.id)
- customer_id (UUID, foreign key → customers.id)
- accessed_by (UUID, foreign key → users.id)
- accessor_name (varchar)
- access_type (enum: viewed, downloaded, printed)
- access_method (enum: portal, emergency_access, admin)
- ip_address (varchar)
- user_agent (text)
- accessed_at (timestamp)

**customer_notes**
- id (UUID, primary key)
- customer_id (UUID, foreign key → customers.id)
- user_id (UUID, foreign key → users.id)
- note_text (text)
- created_at (timestamp)

**customer_audit_log**
- id (UUID, primary key)
- customer_id (UUID, foreign key → customers.id)
- user_id (UUID, foreign key → users.id)
- action (enum: created, updated, deleted)
- field_changed (varchar)
- old_value (text)
- new_value (text)
- created_at (timestamp)

### Database Indexes

**For Performance:**
- users.email (unique index)
- customers.user_id (index)
- customers.customer_number (unique index)
- subscriptions.customer_id (index)
- subscriptions.end_date (index for expiration checks)
- documents.customer_id (index)
- emergency_access_logs.customer_id (index)
- emergency_access_logs.accessed_at (index)

### Database Migrations

Use database migration tool (e.g., Knex, Sequelize, Prisma) to:
- Create tables incrementally
- Version control schema changes
- Apply migrations in production
- Rollback if needed

---

## API Design Guidelines

### RESTful API Principles

**Resource-Based URLs:**
- Use nouns, not verbs
- Good: `/api/customers`
- Bad: `/api/getCustomers`

**HTTP Methods:**
- GET - Retrieve data
- POST - Create new resource
- PUT - Update entire resource
- PATCH - Update partial resource
- DELETE - Delete resource

**Response Codes:**
- 200 OK - Successful GET/PUT/PATCH
- 201 Created - Successful POST
- 204 No Content - Successful DELETE
- 400 Bad Request - Validation error
- 401 Unauthorized - Not authenticated
- 403 Forbidden - Authenticated but not authorized
- 404 Not Found - Resource doesn't exist
- 500 Internal Server Error - Server error

### Request/Response Format

**Request Body (POST/PUT):**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com"
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "created_at": "2025-11-22T10:00:00Z"
  },
  "message": "Customer created successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email address",
    "fields": {
      "email": "Email must be a valid email address"
    }
  }
}
```

### Authentication

**JWT Token in Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Payload:**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "role": "customer",
  "iat": 1700000000,
  "exp": 1700086400
}
```

### Pagination

**Query Parameters:**
```
GET /api/customers?page=1&limit=20&sort=created_at&order=desc
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Filtering & Search

**Query Parameters:**
```
GET /api/customers?status=active&search=john&state=CA
```

### Rate Limiting

- Implement rate limiting per IP/user
- Login: 5 attempts per 15 minutes
- API calls: 100 per minute per user
- Return 429 Too Many Requests when exceeded

### API Documentation

- Document all endpoints
- Include request/response examples
- List required/optional parameters
- Document error codes
- Provide cURL examples
- Consider using Swagger/OpenAPI

---

## Security Requirements

### Authentication Security

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- Cannot be common password
- Cannot be same as email

**Password Storage:**
- Hash using bcrypt
- Salt rounds: 12
- Never store plain text
- Never log passwords

**JWT Tokens:**
- Sign with strong secret (min 32 chars)
- Store secret in environment variable
- Set reasonable expiration (1-7 days)
- Include user_id, role, email in payload
- Verify signature on every request
- Invalidate on logout

**Session Management:**
- Expire sessions after 30 minutes inactivity
- Allow "remember me" for 7 days
- Track active sessions in database
- Allow users to view/revoke sessions

### Data Security

**Database Security:**
- Never expose database credentials
- Use environment variables
- Restrict database access to API only
- Enable SSL for database connections
- Regular automated backups
- Encrypt backups

**File Storage Security:**
- Store files in private S3 bucket
- Enable encryption at rest
- Use signed URLs (1-hour expiration)
- Never expose direct S3 URLs
- Scan uploads for viruses
- Limit file types and sizes

**API Security:**
- HTTPS only (enforce SSL)
- CORS configuration (whitelist domains)
- Rate limiting
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitize inputs)
- CSRF tokens for forms

### HIPAA Compliance

**Access Logging:**
- Log all document access
- Record who, what, when, where
- Immutable audit logs
- Retain logs for 6 years
- Regular audit reviews

**Data Encryption:**
- Encrypt data at rest (AES-256)
- Encrypt data in transit (TLS 1.2+)
- Encrypt backups
- Secure key management

**User Privacy:**
- Customer notification of access
- Allow customers to view access logs
- Secure data deletion
- Data export capability (GDPR)

### Frontend Security

**Input Validation:**
- Validate on both client and server
- Sanitize user inputs
- Prevent XSS attacks
- Escape HTML in user content

**Secure Communication:**
- HTTPS everywhere
- Secure cookies (HttpOnly, Secure flags)
- No sensitive data in URLs
- No sensitive data in localStorage

**Content Security Policy:**
- Restrict script sources
- Prevent inline scripts
- Restrict image sources
- Restrict iframe sources

---

## Email Notifications

### Email Service Setup

**Provider Options:**
- SendGrid (recommended)
- AWS SES
- Mailgun
- Postmark

**Configuration:**
- Set up sender domain
- Verify domain with DNS records
- Configure SPF/DKIM/DMARC
- Set up email templates
- Handle bounces and complaints

### Email Templates Needed

**Authentication Emails:**

1. **Welcome Email**
   - Subject: "Welcome to ALWR!"
   - Sent: After registration
   - Content: Welcome message, next steps, login link

2. **Email Verification**
   - Subject: "Verify Your Email Address"
   - Sent: After registration or email change
   - Content: Verification link, expires in 24 hours

3. **Password Reset**
   - Subject: "Reset Your Password"
   - Sent: After password reset request
   - Content: Reset link, expires in 1 hour

4. **Password Changed**
   - Subject: "Your Password Was Changed"
   - Sent: After successful password change
   - Content: Confirmation, contact support if not you

**Subscription Emails:**

5. **Subscription Created**
   - Subject: "Thank You for Subscribing!"
   - Sent: After payment processed
   - Content: Plan details, invoice, next steps

6. **Subscription Expiring (30 days)**
   - Subject: "Your Subscription Expires in 30 Days"
   - Sent: 30 days before expiration
   - Content: Expiration date, renewal link

7. **Subscription Expiring (7 days)**
   - Subject: "Your Subscription Expires in 7 Days"
   - Sent: 7 days before expiration
   - Content: Urgent reminder, renewal link

8. **Subscription Expiring (1 day)**
   - Subject: "Your Subscription Expires Tomorrow!"
   - Sent: 1 day before expiration
   - Content: Final reminder, renewal link

9. **Subscription Expired**
   - Subject: "Your Subscription Has Expired"
   - Sent: On expiration date
   - Content: Renewal link, grace period info

10. **Subscription Renewed**
    - Subject: "Your Subscription Has Been Renewed"
    - Sent: After renewal processed
    - Content: New expiration date, invoice

11. **Subscription Cancelled**
    - Subject: "Your Subscription Has Been Cancelled"
    - Sent: After cancellation
    - Content: Effective date, feedback request

**Payment Emails:**

12. **Payment Successful**
    - Subject: "Payment Received - $XX.XX"
    - Sent: After payment processed
    - Content: Amount, date, invoice download

13. **Payment Failed**
    - Subject: "Payment Failed - Action Required"
    - Sent: After payment failure
    - Content: Reason, update payment method link

**Document Emails:**

14. **Document Uploaded**
    - Subject: "Document Uploaded Successfully"
    - Sent: After document upload
    - Content: Document name, type, view link

**Emergency Access Emails:**

15. **Emergency Access Notification**
    - Subject: "Your Documents Were Accessed"
    - Sent: After emergency access
    - Content: Date, time, accessor info, facility

### Email Design

**Best Practices:**
- Mobile-responsive templates
- Plain text version for accessibility
- Company branding (logo, colors)
- Clear call-to-action buttons
- Unsubscribe link (for marketing emails)
- Contact information
- Social media links

---

## Testing Requirements

### Types of Testing

**Unit Tests:**
- Test individual functions
- Test API endpoints
- Test database queries
- Test utility functions
- Aim for 80%+ code coverage

**Integration Tests:**
- Test API + database together
- Test authentication flow
- Test payment processing
- Test email sending
- Test file uploads

**End-to-End Tests:**
- Test complete user flows
- Registration to document upload
- Login to profile update
- Emergency access flow
- Admin customer management

**Security Tests:**
- SQL injection attempts
- XSS attempts
- CSRF attempts
- Authentication bypass attempts
- Authorization checks

### Testing Tools

**Backend:**
- Jest (unit tests)
- Supertest (API tests)
- Faker (fake data generation)

**Frontend:**
- Jest (unit tests)
- React Testing Library (component tests)
- Cypress (E2E tests)

**Manual Testing:**
- Test all user flows
- Test on multiple browsers
- Test on mobile devices
- Test error handling
- Test edge cases

### Test Checklist

**Authentication:**
- ✓ User can register
- ✓ User receives verification email
- ✓ User can verify email
- ✓ User can login
- ✓ User can logout
- ✓ User can request password reset
- ✓ User can reset password
- ✓ Invalid login fails
- ✓ Expired token fails

**Customer Management:**
- ✓ Admin can create customer
- ✓ Admin can view customer
- ✓ Admin can edit customer
- ✓ Admin can search customers
- ✓ Admin can delete customer
- ✓ Pagination works
- ✓ Filters work
- ✓ Export works

**Document Management:**
- ✓ Customer can upload document
- ✓ Customer can view documents
- ✓ Customer can download document
- ✓ Customer can delete document
- ✓ File size limit enforced
- ✓ File type validation works
- ✓ Access logged correctly

**Subscription:**
- ✓ Payment processing works
- ✓ Subscription created correctly
- ✓ Expiration reminders sent
- ✓ Auto-renewal works
- ✓ Cancellation works
- ✓ Invoice generated

**Emergency Access:**
- ✓ Lookup by ID card works
- ✓ Lookup by personal info works
- ✓ Document retrieval works
- ✓ Access logged correctly
- ✓ Customer notified

---

## Final Notes for Replit AI

### Development Approach

1. **Start Small** - Build one module at a time
2. **Test Often** - Test each feature before moving on
3. **Iterate** - Build basic version first, then enhance
4. **Document** - Comment code, document decisions
5. **Ask Questions** - If anything is unclear, ask

### Priority Order

**Week 1-2: Foundation**
1. Set up three Repls (API, Frontend, CMS)
2. Configure databases
3. Build authentication (Module 1)
4. Test login/register

**Week 3-4: Core Business**
5. Build customer management (Module 2)
6. Build subscription basics (Module 3)
7. Test customer creation and subscription

**Week 5-6: Documents**
8. Set up file storage (Module 4)
9. Build document upload
10. Test document management

**Week 7-8: Emergency Access**
11. Build emergency access page (Module 5)
12. Test verification and retrieval
13. Implement access logging

**Week 9-10: CMS**
14. Set up Strapi (Module 6)
15. Create content types
16. Add sample pages

**Week 11-12: Frontend**
17. Build customer portal (Module 7)
18. Build public website (Module 8)
19. Connect everything together
20. End-to-end testing

### Success Criteria

The MVP is complete when:
- ✓ Users can register and login
- ✓ Admins can manage customers
- ✓ Customers can upload documents
- ✓ Subscriptions can be created and renewed
- ✓ Emergency access works without login
- ✓ Marketing team can edit website content
- ✓ All emails send correctly
- ✓ System is secure (HTTPS, authentication)
- ✓ Mobile-responsive
- ✓ Basic tests passing

### Important Reminders

- **Don't over-engineer** - Build MVP first, optimize later
- **Focus on core features** - Skip nice-to-haves for now
- **Security first** - Never compromise on security
- **User experience matters** - Make it simple and intuitive
- **Test continuously** - Catch bugs early
- **Document as you go** - Future you will thank you

### Getting Help

If stuck on any part:
1. Review this guide section again
2. Check documentation for the technology
3. Search for similar examples
4. Ask specific questions about what's unclear
5. Break the problem into smaller pieces

### Good Luck!

You have everything you need to build the ALWR MVP. Take it one step at a time, test thoroughly, and remember the goal: help people ensure their healthcare wishes are accessible when it matters most.

---

**End of MVP Development Guide**
