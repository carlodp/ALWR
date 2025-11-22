# America Living Will Registry (ALWR) - MVP Development

## Overview
The America Living Will Registry (ALWR) is a secure 24/7 online service designed for storing living wills and advance healthcare directives. Its primary purpose is to provide an accessible and reliable platform for individuals to manage their end-of-life documents, while also offering emergency access for authorized personnel. The project includes comprehensive customer and subscription management, robust document storage, and dedicated portals for both customers and administrators. ALWR aims to simplify the process of securing and accessing critical healthcare directives, offering peace of mind to users and their families.

## User Preferences
- Build Tier 1 features incrementally, one feature at a time
- Focus on backend + frontend in parallel when possible
- Use mock data for testing
- Prefer working features over perfect code

## System Architecture
ALWR is built with a modern web stack. The frontend utilizes **React** for dynamic user interfaces, **Wouter** for efficient routing, **TailwindCSS** for utility-first styling, and **shadcn/ui** components for a consistent design system. The backend is powered by **Express.js** and **Node.js**, providing a robust API layer. Data persistence is managed with **PostgreSQL** coupled with the **Drizzle ORM**. User authentication is integrated via **Replit Auth (OpenID Connect)**. The entire application is designed for seamless deployment and publishing on Replit.

### TIER 1 - Core Features (Complete):
- **Emergency Access Lookup**: Public-facing, 3-step verification for document retrieval, including audit logging and HIPAA compliance notices.
- **Admin Customer Management**: Full CRUD operations for customer profiles, including internal notes.
- **Admin Subscription Management**: View, filter, search, and modify customer subscriptions, with audit logging.
- **Customer Payment History**: Users can view payment history and download PDF invoices.
- **Renewal Reminders**: Admin dashboard for managing and sending subscription renewal notifications.
- **Admin Reports Dashboard**: Visual analytics for revenue trends, subscription status, document upload trends, and key financial metrics.
- **User Role Management**: Admins can view and manage user roles (customer, agent, admin) with audit logging.
- **Customer Segments/Tags**: Many-to-many relationship for categorizing customers.
- **Physical Card Orders**: System for customers to order physical ID cards with shipping tracking and status management.
- **Email Templates Management**: CRUD interface for managing automated email templates with HTML content support.
- **Referral Tracking System**: Tracks customer referrals with unique codes.
- **API Routes**: Over 35 endpoints covering customer-facing, admin-only, and public functionalities.

### TIER 2 - Customer Features (In Progress):
#### ✅ **Feature #1: Customer Profile Editing** (COMPLETE)
- ✅ Edit personal information (phone, address, city, state, zip)
- ✅ Update emergency contact details
- ✅ Add/edit medical notes for personnel
- ✅ Change password with 8-char minimum validation
- ✅ Upload/change profile picture
- ✅ All changes fully audited and logged

#### ✅ **Feature #2: Document Versioning** (COMPLETE)
- ✅ Upload new versions of existing documents
- ✅ Automatic version numbering (v1, v2, v3...)
- ✅ Add change notes to document versions
- ✅ View complete version history with timestamps
- ✅ Restore any previous version with one click
- ✅ All version operations audited and logged

#### ✅ **Feature #3: ID Card Generator** (COMPLETE)
- ✅ Digital ID card display with customer info
- ✅ Download as PNG image
- ✅ Download as PDF document
- ✅ Print functionality
- ✅ Emergency access information
- ✅ Physical card delivery tracking
- ✅ Instructions for emergency personnel

**Admin Print Module Enhancement:**
- ✅ Admins can preview, download, and print customer ID cards
- ✅ Preview modal with ID card display
- ✅ Download PNG/PDF for batch printing
- ✅ Direct print functionality for each card
- ✅ Integrated with "Ready to Print" customer list
- ✅ Batch operations support
- ✅ **Search modal** - Click "Print Cards" button to open modal
- ✅ **Search by name or card ID** - Real-time filtering as you type
- ✅ **"No customers found"** message when search yields no results
- ✅ **Quick actions** - Print or Preview directly from search results

#### ✅ **Feature #4: Audit Filters** (COMPLETE)
- ✅ Backend API enhanced with query parameters for action, status, date range, resource type
- ✅ Storage layer updated with `listAuditLogsFiltered` method supporting multiple filter types
- ✅ Server-side filtering for improved performance and security
- ✅ Resource type filter UI with options: Document, Customer, Subscription, User, Emergency Access
- ✅ Combined filtering for action + status + date range + resource type
- ✅ CSV export respects all active filters
- ✅ Reset filters button to clear all filters at once
- ✅ Search functionality integrated with all filters

#### ✅ **Feature #5: Global Search** (COMPLETE)
- ✅ Unified search interface accessible from `/search` route for all authenticated users
- ✅ Searches across customers (by phone, ID card number), documents (by title, file name), and audit logs (by action, actor, resource)
- ✅ Results ranked by recency with type badges (Customer, Document, Audit Log)
- ✅ Real-time search results as user types
- ✅ One-click navigation to relevant resource details
- ✅ Responsive design with mobile support
- ✅ No results messaging for empty searches
- ✅ Limit of 50 results per search to optimize performance

### UI/UX Decisions:
- Utilizes **shadcn/ui** for consistent, accessible components.
- Responsive design for optimal viewing on mobile and desktop devices.
- Admin sidebar menu structured to match legacy REGIS system for intuitive navigation (VIEW, LIST, CREATE, REVIEW, RECONCILE, PROCESS, PRINT sections).

### Database Schema Highlights:
- **Users**: Replit auth integration for user authentication and role management.
- **Customers**: Stores detailed customer profiles, including contact information, referral data, and tags.
- **Subscriptions**: Manages subscription details, status, and renewal information.
- **Documents**: Stores medical documents, with plans for versioning.
- **Emergency Access Logs**: Records all emergency document access attempts for auditing.
- **Customer Notes**: Stores internal administrative notes related to customers.
- **Audit Logs**: Comprehensive logging of all system activities and changes.
- **PhysicalCardOrders**: Tracks physical ID card orders and their shipping status.
- **EmailTemplates**: Stores various email templates for automated communications.

## External Dependencies
- **Replit Auth**: Used for user authentication (OpenID Connect).
- **PostgreSQL**: Relational database for all application data.
- **Drizzle ORM**: Object-Relational Mapper for interacting with PostgreSQL.
- **React**: Frontend JavaScript library.
- **TailwindCSS**: CSS framework for styling.
- **Wouter**: Small routing library for React.
- **shadcn/ui**: Reusable UI components.
- **Express.js**: Backend web application framework for Node.js.