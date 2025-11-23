# Shared Directory

This directory contains code shared between frontend and backend.

## Contents

- **schema.ts** - Database schema definitions using Drizzle ORM
- Zod validation schemas
- TypeScript types and interfaces used across the application

## Database Schema Organization

All database tables are defined in `schema.ts`:

- User Management Tables (users, customer_profiles, customer_tags)
- Document Management (documents, document_access_logs)
- Subscription Management (subscriptions, payments)
- Admin Features (audit_logs, email_templates, reports)
- Card Management (physical_card_orders)
- Workspace Features (agents, resellers)

## Zod Schemas

For each database table, we provide:
- Insert schema (for CREATE/POST operations)
- Select type (for READ/GET operations)
- Request/Response validation schemas
