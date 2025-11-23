# Guide Documentation

This folder contains the core project documentation and design guidelines.

## Files

### [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)
Complete system architecture, technology stack, and feature overview. Start here to understand the ALWR system.

**Includes:**
- Project overview and goals
- User preferences and guidelines
- System architecture and design decisions
- Technology stack details
- External dependencies
- All implemented features

### [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md)
UI/UX design standards, typography, colors, and component guidelines for the WordPress frontend.

**Includes:**
- Design approach and philosophy
- Typography standards
- Layout system and spacing
- Color palette (light & dark modes)
- Component library overview
- Accessibility guidelines

---

## Quick Reference

### System Architecture
- **Backend:** Express.js + Node.js + TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Frontend:** WordPress (external)
- **Real-time:** WebSocket for live updates
- **API Docs:** OpenAPI/Swagger at `/api/docs`

### Key Technologies
- Express.js - HTTP server
- PostgreSQL - Database
- Drizzle ORM - Type-safe queries
- TypeScript - Type safety
- Zod - Data validation
- bcryptjs - Password hashing
- speakeasy - 2FA (TOTP)
- Stripe - Payment processing
- ws - WebSocket

### Roles
- **Customer** - End users managing documents
- **Agent** - Sales representatives
- **Reseller** - Partners managing customers
- **Admin** - System administration
- **Super Admin** - Full system control

### Security Measures (10 Implemented)
1. CORS validation
2. Content Security Policy headers
3. HSTS headers
4. User-based rate limiting
5. Request payload size limits
6. Secrets rotation policy
7. Column-level PII encryption
8. API key authentication
9. Enhanced audit logging
10. IP whitelisting for admins

---

## Navigation

- **[Back to README](../../README.md)**
- **[Features Documentation](../features/INDEX.md)**
- **[Quick Start Guides](../quickstart/INDEX.md)**
- **[Security Documentation](../security/INDEX.md)**
- **[Tracking & Progress](../tracking/INDEX.md)**
