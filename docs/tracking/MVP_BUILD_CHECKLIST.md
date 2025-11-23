# ALWR MVP Build Checklist - Custom API Module

## Architecture (Confirmed)
- **This Replit** = Express.js Custom API (Business Logic)
- **WordPress** = Frontend + CMS (Content, Articles, Events, Newsletters, Pages)
- **NO Strapi** - WordPress provides all content management

---

## ✅ COMPLETED (57 Endpoints)

### Core Functionality
- ✅ Authentication (Replit Auth)
- ✅ Customer Management (CRUD)
- ✅ Subscriptions (Stripe integration)
- ✅ Documents (upload, versioning)
- ✅ Audit Logging
- ✅ 2FA (TOTP)
- ✅ Physical ID Cards
- ✅ Real-time Dashboard Stats (WebSocket)
- ✅ Global Search & Filtering
- ✅ Email Templates (CRUD)
- ✅ Session Management

---

## ❌ CRITICAL GAPS - MUST BUILD FOR MVP

### **TIER 1 - BLOCKING MVP (Required Before Launch)**

#### 1. Email Verification System
**Current:** ✅ COMPLETE  
**Status:**
- [x] Generate verification token on registration
- [x] Send verification email with token link
- [x] Token expiration (24 hours)
- [x] Verify endpoint to mark email as verified
- [x] Resend verification email option (via send-verification-email)
- [ ] Block login until email verified (ready, needs frontend integration)

**New Endpoints:**
- `POST /api/auth/send-verification-email` - Request email verification
- `POST /api/auth/verify-email/:token` - Verify with token

#### 2. Password Reset Flow
**Current:** ✅ COMPLETE  
**Status:**
- [x] Generate reset token on forgot password request
- [x] Send reset email with token & link
- [x] Token expiration (1 hour)
- [x] Validate token & reset password endpoint
- [x] Prevent expired token usage
- [x] Log password reset attempts

**New Endpoints:**
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Validate reset token

#### 3. Emergency Access - Full 3-Step Verification
**Current:** Basic verify endpoint only  
**Needed:**
- [ ] **Method 1: ID Card Verification**
  - Input: Last Name + First Name + ID Card Number
  - Search: Match against customers table
  - Output: Request facility/accessor info if found

- [ ] **Method 2: Personal Information Verification**
  - Input: Last Name + First Name + DOB + Last 4 Phone
  - Search: Match against customers table
  - Output: Request facility/accessor info if found

- [ ] **Method 3: Emergency Code Verification**
  - Input: Emergency Code (from ID card)
  - Search: Direct lookup
  - Output: Show documents directly

- [ ] **Facility/Accessor Information Capture**
  - Accessor Name
  - Accessor Role (Doctor, Nurse, EMT, Social Worker, etc.)
  - Facility Name
  - Facility Phone
  - Reason for Access

- [ ] **Document Retrieval & Logging**
  - List customer's documents
  - Generate signed URLs (1-hour expiration)
  - Log: who accessed, what, when, where, why
  - ZIP download of all documents
  - Individual document view/download

- [ ] **Customer Notification**
  - Email customer within 1 hour
  - Include: Date, time, accessor name, facility, reason

- [ ] **Rate Limiting**
  - 5 verification attempts per 15 minutes per IP
  - Log failed attempts

#### 4. Subscription Renewal Reminders
**Current:** Renewal endpoints exist, no automation  
**Needed:**
- [ ] Background job/cron: Check subscriptions expiring soon
- [ ] Send reminder at 30 days before expiration
- [ ] Send reminder at 7 days before expiration
- [ ] Send reminder at 1 day before expiration
- [ ] Send confirmation email on renewal
- [ ] Auto-renewal webhook handling from Stripe

#### 5. Email Notification System
**Current:** Mock email service in place  
**Needed:**
- [ ] SendGrid integration (or similar provider)
- [ ] Email templates for:
  - [x] Welcome email (done)
  - [ ] Email verification
  - [ ] Password reset
  - [ ] Password changed confirmation
  - [ ] Subscription created
  - [ ] Subscription renewal reminders (30/7/1 day)
  - [ ] Subscription renewed
  - [ ] Emergency access notification
  - [ ] Payment failed
  - [ ] Document uploaded confirmation

---

### **TIER 2 - HIGH PRIORITY (Phase 4 - For WordPress Portal)**

#### 6. Full Users Module
**Current:** Basic Replit Auth integration  
**Needed:**
- [ ] User roles: Admin, Customer, Agent, Support Staff
- [ ] User management (admin can CRUD users)
- [ ] User permissions per role
- [ ] User activity/session logging
- [ ] Account suspension/deactivation

#### 7. Agents Module (If Supporting Reseller Sales)
- [ ] Agent profiles & registration
- [ ] Agent territories
- [ ] Commission tracking
- [ ] Agent reporting

#### 8. Resellers Module (If Supporting Reseller Sales)
- [ ] Reseller accounts
- [ ] Custom pricing tiers
- [ ] Reseller reporting
- [ ] Commission management

#### 9. Advanced Accounting/Invoicing
**Current:** Basic PDF invoice generation  
**Needed:**
- [ ] Detailed invoice generation with proper formatting
- [ ] Invoice history & archival
- [ ] Transaction reporting
- [ ] Revenue analytics
- [ ] Refund handling

---

### **TIER 3 - NICE TO HAVE (Phase 5+)**

- Customer Notes & Internal Notes
- Document Sharing between family members
- Multi-language support (English/Spanish for emergency access)
- HIPAA compliance reporting
- Advanced audit trails

---

## **RECOMMENDED BUILD ORDER (For MVP)**

**Week 1:** 
1. Email Verification (1-2 days)
2. Password Reset (1 day)
3. Emergency Access Complete (3 days)

**Week 2:**
4. Subscription Reminders (1-2 days)
5. Email Integration with SendGrid (1 day)
6. Full Users Module (2-3 days)

**Week 3:**
7. Advanced Accounting (2-3 days)
8. Testing & Optimization (3-4 days)

---

## **MVP SUCCESS CRITERIA**

- ✅ Users can register with email verification
- ✅ Users can reset forgotten passwords
- ✅ Medical staff can access documents via 3-step verification
- ✅ Customers get notified of emergency access
- ✅ Subscriptions send renewal reminders at 30/7/1 days
- ✅ All emails send successfully
- ✅ Admin can manage all resources
- ✅ System is secure (HTTPS, rate limiting, validated input)
- ✅ Real-time admin dashboard works
- ✅ All endpoints tested

---

## **What We DON'T Need to Build in This API**

- ❌ Strapi CMS (WordPress provides this)
- ❌ Frontend UI (WordPress provides this)
- ❌ Articles/News/Blog (WordPress CMS)
- ❌ Events calendar (WordPress CMS)
- ❌ Newsletter campaigns (WordPress CMS)
- ❌ Content pages (WordPress CMS)
- ❌ Advertising management (WordPress CMS)
- ❌ Job postings (WordPress CMS)
- ❌ Product catalog (WordPress CMS)

---

**Last Updated:** November 23, 2024  
**Status:** Ready to build Tier 1 features
