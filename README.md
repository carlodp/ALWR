# America Living Will Registry (ALWR) - Backend API

A secure, HIPAA-compliant backend API for managing living wills and advance healthcare directives. Built with Express.js, Node.js, PostgreSQL, and TypeScript.

## Quick Links

### For Getting Started
- **[Project Overview](docs/guide/PROJECT_OVERVIEW.md)** - Complete system architecture and features
- **[Design Guidelines](docs/guide/DESIGN_GUIDELINES.md)** - UI/UX design system and standards

### For Feature Documentation
- [Email Queue System](docs/features/EMAIL_QUEUE.md)
- [Caching Strategy](docs/features/CACHING_STRATEGY.md)
- [Rate Limiting](docs/features/RATE_LIMITING.md)
- [Admin Analytics Dashboard](docs/features/ADMIN_ANALYTICS.md)
- [API Versioning](docs/features/API_VERSIONING.md)
- [Query Optimization](docs/features/QUERY_OPTIMIZATION.md)

### For Quick Start Guides
- [Email Queue Quick Start](docs/quickstart/EMAIL_QUEUE.md)
- [Caching Quick Start](docs/quickstart/CACHING.md)

### For Security & Authentication
- [Authentication Verification](docs/security/AUTH_VERIFICATION.md)
- [Secrets Rotation Policy](docs/security/SECRETS_ROTATION.md)

### For Project Tracking
- [MVP Build Checklist](docs/tracking/MVP_BUILD_CHECKLIST.md)
- [Improvements Roadmap](docs/tracking/IMPROVEMENTS_ROADMAP.md)
- [Completion Summary](docs/tracking/COMPLETION_SUMMARY.md)
- [File Structure](docs/tracking/FILE_STRUCTURE.md)

---

## Documentation Structure

```
docs/
├── guide/                    # Project overview and design
│   ├── PROJECT_OVERVIEW.md
│   └── DESIGN_GUIDELINES.md
├── features/                 # Feature-specific documentation
│   ├── EMAIL_QUEUE.md
│   ├── CACHING_STRATEGY.md
│   ├── RATE_LIMITING.md
│   ├── ADMIN_ANALYTICS.md
│   ├── API_VERSIONING.md
│   └── QUERY_OPTIMIZATION.md
├── quickstart/              # Quick start guides
│   ├── EMAIL_QUEUE.md
│   └── CACHING.md
├── security/                # Security and authentication
│   ├── AUTH_VERIFICATION.md
│   └── SECRETS_ROTATION.md
└── tracking/                # Project tracking and progress
    ├── MVP_BUILD_CHECKLIST.md
    ├── IMPROVEMENTS_ROADMAP.md
    ├── COMPLETION_SUMMARY.md
    └── FILE_STRUCTURE.md
```

---

## Key Features

✅ **Security (10 Measures Implemented)**
- CORS validation & CSP headers
- HSTS headers for HTTPS enforcement
- User-based rate limiting
- Payload size limits
- Secrets rotation policy
- Column-level PII encryption (AES-256-GCM)
- API key authentication
- Enhanced audit logging (35+ actions)
- IP whitelisting for admin endpoints

✅ **Authentication & Authorization**
- Custom email/password authentication
- Account locking after failed attempts
- Session management with PostgreSQL store
- Two-factor authentication (TOTP)
- Role-based access control (Super Admin, Admin, Agent, Reseller, Customer)

✅ **Core Features**
- Document management with versioning
- Emergency access lookup (HIPAA compliant)
- Subscription management with Stripe integration
- Admin analytics dashboard (real-time WebSocket)
- Email queue system with retry logic
- Advanced caching strategy (5 cache layers)
- API versioning (v1 deprecated, v2 stable)

---

## Quick Start

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

Server runs on `http://localhost:5000`

### API Documentation
Interactive OpenAPI/Swagger docs: `http://localhost:5000/api/docs`

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Session
SESSION_SECRET=<random_32_byte_hex_string>

# Security
ADMIN_IPS=192.168.1.100,203.0.113.45  # Comma-separated IPs for admin access
ENCRYPTION_MASTER_KEY=<random_32_byte_hex_string>

# Payment
STRIPE_SECRET_KEY=sk_...

# Email (if configured)
SENDGRID_API_KEY=SG_...
```

---

## API Endpoints

**Authentication**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `GET /auth/user` - Get current user
- `POST /auth/logout` - Logout

**Customers**
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer

**Documents**
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/:id` - Get document
- `DELETE /api/documents/:id` - Delete document

**Admin**
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/customers` - List all customers
- `GET /api/admin/subscriptions` - List all subscriptions
- `GET /api/admin/analytics` - System analytics

See full API documentation at `/api/docs`

---

## Development Guidelines

### Code Style
- TypeScript for type safety
- Zod for input validation
- Express.js for HTTP handling
- Drizzle ORM for database operations

### Directory Structure
```
server/
├── app.ts                   # Express app setup
├── routes.ts                # API route definitions
├── storage.ts               # Database operations
├── security.ts              # Security middleware
├── encryption.ts            # PII encryption service
├── api-key-service.ts       # API key management
├── audit-logging-helper.ts  # Audit logging
├── ip-whitelist-middleware.ts # IP whitelist validation
└── ...

shared/
└── schema.ts               # Drizzle schema & types

client/src/
├── pages/                  # React pages
├── components/             # Reusable components
└── lib/                    # Utilities & hooks
```

---

## Support & Documentation

For detailed information about specific features, see the relevant documentation in the `docs/` folder.

- Questions? Check the [Project Overview](docs/guide/PROJECT_OVERVIEW.md)
- Need to rotate secrets? See [Secrets Rotation Policy](docs/security/SECRETS_ROTATION.md)
- Building a new feature? Check [Design Guidelines](docs/guide/DESIGN_GUIDELINES.md)

---

## License

Proprietary - America Living Will Registry
