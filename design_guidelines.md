# ALWR Design Guidelines

## Design Approach

**Selected Approach:** Design System - Material Design 3 with Healthcare-Focused Adaptations

**Justification:** ALWR operates in the healthcare/legal document sector where trust, security, clarity, and accessibility are paramount. The system manages sensitive medical documents requiring a professional, stable, and highly functional interface. Material Design provides:
- Robust accessibility standards (critical for healthcare)
- Comprehensive component library for data-dense interfaces
- Professional, trustworthy aesthetic
- Excellent form and table patterns for admin dashboards
- Clear visual hierarchy for multi-role systems

**Key Design Principles:**
1. **Trust First:** Professional, medical-grade appearance that instills confidence
2. **Clarity Over Creativity:** Information hierarchy prioritizes comprehension
3. **Accessibility Compliance:** WCAG 2.1 AA minimum for healthcare requirements
4. **Role-Appropriate Interfaces:** Distinct visual treatments for public, customer, and admin areas

---

## Typography

**Font Families:**
- **Primary (UI/Body):** Inter or Roboto - 400, 500, 600, 700 weights
- **Headings:** Same as primary for consistency
- **Monospace (IDs/Codes):** JetBrains Mono for customer IDs, access codes

**Scale & Hierarchy:**
- **H1 (Page Titles):** 2.5rem (40px), font-weight: 700
- **H2 (Section Headers):** 2rem (32px), font-weight: 600
- **H3 (Subsections):** 1.5rem (24px), font-weight: 600
- **H4 (Card Titles):** 1.25rem (20px), font-weight: 600
- **Body Large:** 1.125rem (18px), font-weight: 400 - for marketing content
- **Body Regular:** 1rem (16px), font-weight: 400 - default
- **Body Small:** 0.875rem (14px), font-weight: 400 - metadata, captions
- **Label/Button:** 0.875rem (14px), font-weight: 500, uppercase tracking

**Line Heights:**
- Headings: 1.2
- Body text: 1.6 for readability
- Form labels: 1.4

---

## Layout System

**Spacing Primitives:** Use Tailwind units of **2, 4, 6, 8, 12, 16** for consistency
- **Micro spacing:** p-2, gap-2 (8px) - tight groupings
- **Standard spacing:** p-4, gap-4 (16px) - card padding, form field gaps
- **Section spacing:** py-8, gap-8 (32px) - between major sections
- **Large spacing:** py-16 (64px) - marketing page sections

**Container Widths:**
- **Marketing pages:** max-w-7xl (1280px)
- **Portal dashboards:** max-w-screen-2xl (1536px) for data tables
- **Forms/Content:** max-w-2xl (672px) for optimal reading/input
- **Emergency access:** max-w-xl (576px) for focused verification flow

**Grid Patterns:**
- Admin dashboards: 12-column grid for flexible data layouts
- Customer portal: 3-column responsive grid (1 col mobile, 2 tablet, 3 desktop)
- Marketing features: 3-4 column grids for feature showcases

---

## Component Library

### Navigation

**Public Site Header:**
- Full-width with max-w-7xl inner container
- Logo left, navigation center, CTA buttons right
- Sticky on scroll with subtle shadow
- Mobile: Hamburger menu with slide-out drawer

**Portal Navigation:**
- Left sidebar (240px wide) with role-based menu items
- Top bar with user profile dropdown, notifications icon
- Breadcrumbs below top bar for deep navigation

**Admin Navigation:**
- Persistent left sidebar with expanded icons + labels
- Grouped sections: Customers, Subscriptions, Documents, Reports, Settings
- Active state: filled background, bold text

### Forms

**Input Fields:**
- Full-width with clear labels above
- Height: h-12 (48px) for touch-friendly interaction
- Border: 1px with rounded-lg corners
- Focus state: outline ring
- Error state: red border with error message below
- Helper text: text-sm below field

**Form Layout:**
- Single column for most forms
- Two-column for related pairs (First Name | Last Name)
- Spacing: gap-6 between fields
- Action buttons: right-aligned, primary + secondary pattern

### Cards

**Dashboard Cards:**
- Rounded-lg borders with subtle shadow
- Padding: p-6
- Header with icon + title
- Body content with appropriate data visualization
- Optional footer with actions

**Document Cards:**
- Preview thumbnail (if applicable)
- Document name + file type icon
- Metadata: upload date, file size
- Actions: View, Download, Delete icons (right-aligned)

### Tables

**Admin Data Tables:**
- Full-width with horizontal scroll on mobile
- Sticky header row
- Row hover states for interactivity
- Alternating row backgrounds for readability
- Action column (right): icon buttons for Edit, View, Delete
- Pagination at bottom: 10/25/50 items per page

### Buttons

**Primary Actions:** Filled, medium height (h-10), rounded-md, font-medium
**Secondary Actions:** Outlined variant
**Tertiary/Text Actions:** Text-only for less important actions
**Icon Buttons:** Square (h-10 w-10) for tables and toolbars
**Floating Action Button:** Bottom-right for primary mobile actions (Document upload)

### Alerts & Notifications

**Success/Error/Warning/Info:** Full-width banners with icons, dismissible
**Toast Notifications:** Bottom-right, auto-dismiss after 5s
**Emergency Access Alerts:** Prominent red banner when document accessed

### Emergency Access Portal

**Verification Flow:**
- Single-column centered layout (max-w-xl)
- Large step indicators (1 → 2 → 3)
- Clear instructions at each step
- Prominent "Submit" buttons
- Security badges/trust indicators visible

---

## Page-Specific Guidance

### Marketing/Landing Pages

**Hero Section:**
- Full-width with large background image (medical professional or secure document imagery)
- Centered content overlay with semi-transparent background
- H1 headline + supporting paragraph + dual CTAs (Get Started, Learn More)
- Height: 80vh minimum

**Features Section:**
- 3-column grid showcasing core benefits
- Icons representing each feature
- Brief description under each

**Trust Section:**
- Security badges, HIPAA compliance indicators
- Testimonials in 2-column layout
- Statistics (24/7 access, X customers served)

**CTA Section:**
- Full-width with contrasting background
- Large, clear call-to-action
- Secondary support text

### Customer Portal

**Dashboard:**
- Welcome header with customer name
- 4-card grid: My Documents (count), Subscription Status, ID Card Preview, Recent Activity
- Quick actions: Upload Document, View ID Card, Manage Subscription
- Recent documents list below cards

**My Documents Page:**
- Upload area at top (drag-drop zone)
- Grid/list view toggle
- Document cards with thumbnails
- Filter/search functionality

**My Subscription Page:**
- Current plan details in prominent card
- Payment method display
- Billing history table
- Renewal/upgrade CTAs

### Admin Dashboard

**Customer Management:**
- Search bar with filters (status, subscription type, date range)
- Data table with sortable columns
- Bulk actions toolbar
- Customer detail side panel (slides in on row click)

**Analytics Overview:**
- Top metrics cards (Total Customers, Active Subscriptions, Revenue, Documents Stored)
- Charts: Line graph for growth, pie chart for subscription types
- Date range picker for filtering

---

## Images

**Hero Images:**
- Use professional medical/healthcare imagery: trusted doctor, secure vault, peaceful patient
- Dimensions: 1920x1080, optimized for web
- Placement: Full-width background with overlay gradient for text readability

**Feature Icons:**
- Use Material Symbols (via Google Fonts CDN) for consistency
- Size: 48px for feature showcases, 24px for inline icons

**Document Thumbnails:**
- Placeholder for PDF previews (generic document icon)
- Actual thumbnails if possible for uploaded documents

**Trust Badges:**
- HIPAA compliance logo
- Security certifications
- Professional association badges