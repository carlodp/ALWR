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

### Core Features & Implementations:
- **Emergency Access Lookup**: Public-facing, 3-step verification for document retrieval, including audit logging and HIPAA compliance notices.
- **Admin Customer Management**: Full CRUD operations for customer profiles, including internal notes.
- **Admin Subscription Management**: View, filter, search, and modify customer subscriptions, with audit logging.
- **Customer Payment History**: Users can view payment history and download PDF invoices.
- **Customer Profile Completion**: Customers can edit personal info, emergency contacts, medical notes, change passwords, and upload profile pictures, all with audit logging.
- **Renewal Reminders**: Admin dashboard for managing and sending subscription renewal notifications.
- **Admin Reports Dashboard**: Visual analytics for revenue trends, subscription status, document upload trends, and key financial metrics.
- **User Role Management**: Admins can view and manage user roles (customer, agent, admin) with audit logging.
- **Customer Segments/Tags**: Many-to-many relationship for categorizing customers.
- **Physical Card Orders**: System for customers to order physical ID cards with shipping tracking and status management.
- **Email Templates Management**: CRUD interface for managing automated email templates with HTML content support.
- **Referral Tracking System**: Tracks customer referrals with unique codes.
- **API Routes**: Over 35 endpoints covering customer-facing, admin-only, and public functionalities.

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