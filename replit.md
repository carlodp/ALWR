# America Living Will Registry (ALWR) - Rebuild 3.0 API

### Overview
The America Living Will Registry (ALWR) is a secure 24/7 online service for storing living wills and advance healthcare directives. This project provides the **Custom API backend** that powers the entire ALWR system, handling all business logic, document management, subscriptions, and customer operations. A separate WordPress frontend consumes this API via REST endpoints. The project aims to provide a robust, scalable, and compliant platform for managing critical healthcare documents, improving accessibility, and ensuring adherence to legal and medical standards, with a focus on HIPAA compliance.

### User Preferences
- Build core API modules incrementally, one feature at a time
- Focus on robust, secure backend API
- Use mock data for testing
- Prefer working, secure features over perfect code
- WordPress handles all UI/UX + CMS content (separate from this API)
- NO Strapi CMS - WordPress provides all content management

### System Architecture
This Replit instance hosts the custom API backend, which is an **Express.js** and **Node.js** application providing over 80 REST API endpoints. It integrates with a **PostgreSQL** database via **Drizzle ORM** for type-safe data interaction. The system is designed for a complete separation of UI (handled by a separate WordPress frontend) from business logic.

**Key Architectural Decisions & Features:**
- **Technology Stack**: Node.js, Express.js, PostgreSQL, Drizzle ORM, TypeScript.
- **Authentication & Authorization**: Custom email/password authentication, account locking, session management with PostgreSQL store, secure cookie-based sessions, and role-based access control (Super Admin, Admin, Agent, Reseller, Customer).
- **Core Modules**:
    - **User & Role Management**: Full CRUD for users, dynamic role assignment, and a protected Super Admin role.
    - **Document Management**: Upload, versioning, retrieval, and audit logging of medical documents.
    - **Emergency Access Lookup**: Public-facing, 3-step verification with HIPAA compliance and audit logging.
    - **Agent & Reseller Management**: Modules for managing agents and resellers, including customer assignment and referral tracking.
    - **Payment & Subscription**: Tracking, renewal reminders, and subscription modifications.
    - **Reporting & Analytics**: Admin dashboards with real-time WebSocket-based stats.
    - **ID Card Generation**: Digital and physical ID card ordering.
    - **Email Notification System**: Infrastructure for automated email notifications, including verification and password resets.
    - **Two-Factor Authentication (2FA)**: TOTP-based 2FA.
- **Security & Compliance**:
    - Rate limiting, security headers, Zod-based input validation, error sanitization.
    - File upload security (size/type limits).
    - Comprehensive audit logging for all critical actions, including login/logout and emergency access.
    - Session timeout (30-minute inactivity auto-logout) with user warning.
    - Secure password generation and bcrypt hashing.
- **Database Schema**: Includes tables for Users, Customers, Subscriptions, Documents, Emergency Access Logs, Customer Notes, Audit Logs, Physical Card Orders, Email Templates, Agents, Resellers, and their respective association tables.
- **UI/UX (WordPress Frontend Interaction)**: The API supports a single-page user creation flow on the frontend, dynamic field rendering based on user roles, and integrated password generation for administrators. All public pages and customer portals are managed by the external WordPress instance.

### External Dependencies
- **Replit Auth**: Used for initial user authentication (though custom email/password login is now primary).
- **PostgreSQL**: Primary relational database.
- **Drizzle ORM**: For type-safe database interactions.
- **Express.js**: Web application framework.
- **express-rate-limit**: Middleware for rate limiting.
- **Stripe**: Payment processing and subscription billing.
- **speakeasy**: For TOTP-based two-factor authentication.
- **ws (WebSocket)**: For real-time statistics streaming.
- **WordPress**: External CMS and frontend for the entire ALWR system, consuming this API.

## Quality of Life Improvements - Session 11 (Advanced Frontend Features)

### 6 New QoL Improvements Implemented (No New Dependencies!)

All improvements use existing modules: `next-themes`, `lucide-react`, `wouter`, shadcn components, TanStack Query.

#### 1. **Dark/Light Mode Theme Toggle** 🌓
- **Components**: `theme-provider.tsx` (wrapper), `theme-toggle.tsx` (button)
- **Location**: Mobile header (top-right) + Sidebar footer (next to Sign Out)
- **Features**:
  - Moon/Sun icon toggle button
  - Persists user preference via localStorage
  - Auto-detects system dark mode preference
  - Smooth theme transitions across entire app
- **Data testid**: `button-theme-toggle`

#### 2. **Live Session Timer Display** ⏱️
- **Component**: `SessionTimer` in `session-timer.tsx`
- **Location**: Sidebar footer + Mobile header
- **Features**:
  - Shows remaining session time (mm:ss format)
  - Only displays during final 5 minutes (doesn't clutter UI)
  - Badge turns red as warning when < 5 min
  - Auto-updates every second
  - Hidden when session is healthy
- **Data testid**: `session-timer`

#### 3. **Global Keyboard Shortcuts** ⌨️
- **Hook**: `useKeyboardShortcuts` in `hooks/useKeyboardShortcuts.ts`
- **Shortcuts**:
  - `Cmd+K` (Mac) / `Ctrl+K` (Windows) → Open Global Search (`/search`)
  - `Cmd+/` / `Ctrl+/` → Navigate to Dashboard
- **UX**: Non-intrusive, only works when app has focus
- **Implementation**: Global window event listener with cleanup

#### 4. **Auto-Extend Session on Activity** 🔄
- **Hook**: `useAutoExtendSession` in `hooks/useAutoExtendSession.ts`
- **Features**:
  - Automatically extends session TTL on user activity
  - Tracks: mouse clicks, keyboard input, scrolling, touch events
  - Prevents unwanted logouts during active use
  - Silent operation (no user feedback needed)
  - Uses TanStack Query to refetch `/api/auth/user` endpoint
- **Events Monitored**: `mousedown`, `keydown`, `scroll`, `touchstart`, `click` (passive listeners)

#### 5. **Breadcrumb Navigation** 🗺️
- **Component**: `BreadcrumbNav` in `components/breadcrumb-nav.tsx`
- **Location**: Between mobile header and main content (desktop-only, hidden on mobile)
- **Features**:
  - Auto-generates from current URL path
  - Clickable links to parent pages (faster navigation)
  - Current page shown as non-clickable text
  - Auto-hidden on home page
  - Example: Home > Admin > Customers > Detail
- **Data testids**: `breadcrumb-*` for each navigation segment

#### 6. **Complete App Integration** 🎯
- **Updated Files**:
  - `client/src/App.tsx`: ThemeProvider wrapper, all hooks integrated
  - `client/src/components/app-sidebar.tsx`: Theme toggle + session timer in footer
  - `client/src/components/mobile-header.tsx`: Theme toggle + session timer in mobile header
  - `client/src/components/breadcrumb-nav.tsx`: Navigation breadcrumb display

### Why These Improvements Matter

**User Experience**:
- ✅ Dark mode reduces eye strain for evening use
- ✅ Session timer prevents confusion about unexpected logouts
- ✅ Keyboard shortcuts enable power users
- ✅ Auto-extend keeps productive sessions alive
- ✅ Breadcrumbs help navigate complex dashboards

**Code Quality**:
- ✅ Zero new dependencies (uses already-installed packages)
- ✅ Modular hooks for reusability
- ✅ Performance optimized (minimal re-renders)
- ✅ Accessibility first (keyboard shortcuts, theme detection)
- ✅ Mobile-responsive design

**Developer Friendly**:
- ✅ All components have `data-testid` for testing
- ✅ Clear separation of concerns (hooks vs components)
- ✅ Well-documented code
- ✅ Easy to extend or customize