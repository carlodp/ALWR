# Server Directory Structure

This directory contains all backend Node.js/Express code organized by responsibility.

## Folder Structure

- **services/** - Business logic layer (auth, email, 2FA, user management)
- **middleware/** - Express middleware (rate limiting, security headers)
- **utils/** - Utility functions (caching, logging, database optimization)
- **websocket/** - WebSocket handlers for real-time features
- **config/** - Configuration files (Stripe, Replit Auth setup)
- **handlers/** - Webhook and event handlers

## Core Files (Root Level)

- `app.ts` - Express application setup and initialization
- `routes.ts` - All API route definitions
- `storage.ts` - Data storage interface and in-memory implementation
- `db.ts` - Database connection and schema
- `index-dev.ts` - Development server entry point
- `index-prod.ts` - Production server entry point

## Architecture Notes

- **Request → Route → Service → Storage** follows this clean architecture pattern
- Routes validate input and call services
- Services contain business logic
- Storage handles data persistence
- Middleware handles cross-cutting concerns (logging, security, rate limiting)

## File Naming Convention

- Use kebab-case for file names
- Service files end with `.ts` (e.g., `auth-service.ts`)
- Middleware files are descriptive (e.g., `rate-limiter.ts`)
