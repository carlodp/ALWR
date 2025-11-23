# America Live REGIS (ALWR) System - Structural Sitemap & Functional Scope

## Document Overview
**Generated:** November 19, 2024  
**Purpose:** Complete structural analysis of the ALWR customer management system  
**System:** ColdFusion-based application (dotPUB CMS framework)  
**Database:** Microsoft SQL Server (`1092428_ALWR3`)  
**Admin Directory:** `/dotpub/`

---

## 1. System Architecture

### Application Configuration
- **Application Name:** ALWRApp
- **Framework:** dotPUB Content Management System
- **Database DSN:** 1092428_ALWR3
- **Admin Path:** `/dotpub/`
- **Primary Domain:** alwr.com

### Security Features
- SQL injection protection at application level
- Session management via CFID/CFTOKEN
- Input validation for special characters
- Admin group GUID: `69F1C2B2-50F2-C8AC-737AAD3395CCE4F0`

---

## 2. Core Functional Modules

### 2.1 Customer Management (`/dotpub/_customers/`)
**Primary Functions:**
- Create new customers
- Edit customer information
- View customer details
- Search customers
- Delete/archive customers
- Upload customer documents
- Manage customer subscriptions
- View customer history
- Customer pagination and navigation

**Sub-directories:**
- `/images/` - Customer-related imagery
- `/include/` - Reusable customer components
- `/queries/` - Database queries for customer operations
- `/script/` - JavaScript functionality
- `/style/` - CSS styling

**Known Issues (Phase 3 Fixed):**
- Document upload file paths (C: to D: drive migration)
- Subscription creation/deletion parameter scoping
- Search functionality parameter handling
- Pagination navigation
- Date picker functionality (replaced with Flatpickr)

---

### 2.2 User Management (`/dotpub/_users/`)
**Primary Functions:**
- User authentication (login/logout)
- User registration
- User profile management
- Password management
- User permissions and roles
- User activity tracking

**Sub-directories:**
- `/images/`
- `/include/`
- `/queries/`
- `/script/`
- `/style/`

---

### 2.3 Accounting/Financial (`/dotpub/_accounting/`)
**Primary Functions:**
- Financial transactions
- Invoice generation
- Payment processing
- Financial reporting
- Account statements
- Revenue tracking

**Sub-directories:**
- `/images/`
- `/include/`
- `/queries/`
- `/script/`
- `/style/`

---

### 2.4 Agents Management (`/dotpub/_agents/`)
**Primary Functions:**
- Agent registration
- Agent profiles
- Agent performance tracking
- Commission management
- Agent territories
- Agent reporting

**Sub-directories:**
- `/images/`
- `/include/`
- `/queries/`
- `/script/`
- `/style/`

---

### 2.5 Content Management (`/dotpub/_content/`)
**Primary Functions:**
- Create/edit web pages
- Manage site content
- Content publishing
- SEO management
- Content templates
- Media library

**Sub-directories:**
- `/images/`
- `/include/`
- `/queries/`
- `/script/`
- `/style/`

---

### 2.6 Articles/News (`/dotpub/_articles/`)
**Primary Functions:**
- Create/edit articles
- Article categories
- Article publishing
- Featured articles
- Article search
- Article archiving

**Sub-directories:**
- `/images/`
- `/include/`
- `/queries/`
- `/script/`
- `/style/`

---

### 2.7 Events Management (`/dotpub/_events/`)
**Primary Functions:**
- Create/manage events
- Event calendar
- Event registration
- Event attendee tracking
- Event notifications
- Event reporting

**Sub-directories:**
- `/images/`
- `/include/`
- `/queries/`
- `/script/`
- `/style/`

---

### 2.8 Newsletter System (`/dotpub/_newsletter/`)
**Primary Functions:**
- Newsletter creation
- Email campaign management
- Subscriber management
- Newsletter templates
- Newsletter scheduling
- Analytics/tracking

**Configuration:**
- Newsletter email: `info@dotpub.com`
- Support email: `support@dotpub.com`
- Admin email: `admin@dotpub.com`

**Sub-directories:**
- `/images/`
- `/include/`
- `/queries/`
- `/script/`
- `/style/`

---

### 2.9 Reseller Management (`/dotpub/_resellers/`)
**Primary Functions:**
- Reseller registration
- Reseller accounts
- Reseller pricing
- Reseller reporting
- Commission tracking
- Reseller portal access

**Sub-directories:**
- `/images/`
- `/include/`
- `/queries/`
- `/script/`
- `/style/`

---

### 2.10 Workflow Management (`/dotpub/_workflow/`)
**Primary Functions:**
- Approval workflows
- Task management
- Status tracking
- Workflow automation
- Notification system
- Audit trails

**Sub-directories:**
- `/images/`
- `/include/`
- `/queries/`
- `/script/`
- `/style/`

---

### 2.11 Additional Modules

#### Organizations (`/dotpub/_organizations/`)
- Organization profiles
- Organization management
- Contact management

#### Products (`/dotpub/_products/`)
- Product catalog
- Product information
- Product images
- Pricing management

#### Contacts (`/dotpub/_contacts/`)
- Contact database
- Contact forms
- Contact management

#### Campaigns (`/dotpub/_campaigns/`)
- Marketing campaigns
- Campaign tracking
- Campaign analytics

#### Members (`/dotpub/_members/`)
- Membership management
- Member profiles
- Member benefits

#### Registrants (`/dotpub/_registrants/`)
- Event registrations
- Registration forms
- Registration tracking

#### Files (`/dotpub/_files/`)
- File management
- Document repository
- File uploads/downloads

#### Jobs (`/dotpub/_jobs/`)
- Job postings
- Application management
- Job board

#### Security (`/dotpub/_security/`)
- Security settings
- Access control
- Permission management

#### Setup (`/dotpub/_setup/`)
- System configuration
- Initial setup
- Settings management

#### Templates (`/dotpub/_templates/`)
- Page templates
- Email templates
- Design templates

#### Advertising (`/dotpub/_advertising/`)
- Ad management
- Banner ads
- Ad tracking

#### Root (`/dotpub/_root/`)
- Root-level administration
- System utilities

---

## 3. Support Directories

### 3.1 Shared Resources
```
/dotpub/
├── images/          - Shared images
├── include/         - Common include files
├── queries/         - Shared database queries
├── script/          - Shared JavaScript
└── style/           - Shared CSS
```

### 3.2 Public Resources
```
/images/             - Public images
├── date/            - Date picker images
/style/              - Public stylesheets
/script/             - Public JavaScript
/templates/          - Public templates
├── content/
├── images/
├── interface/
├── newsletter/
└── thumbnails/
```

### 3.3 Media Storage
```
/orgimages/          - Organization images
/productimages/      - Product images
/art/                - Artwork/graphics
```

### 3.4 Special Directories
```
/hippa/              - HIPAA compliance materials
/rss/                - RSS feed generation
/rsspublish/         - RSS publishing
/feedcontent/        - Feed content
/searchcontent/      - Search indexing
/rotary/             - Rotary-specific content
/tmp/                - Temporary files
/database/           - Database backups/scripts
/stats/              - Analytics data
```

---

## 4. CRUD Operations Matrix

### Customer Module Operations
| Operation | Endpoint Pattern | Functions |
|-----------|-----------------|-----------|
| **Create** | `_customers/add_customer.cfm` | New customer registration, form validation, database insert |
| **Read** | `_customers/view_customer.cfm` | Customer details, history, documents, subscriptions |
| **Update** | `_customers/edit_customer.cfm` | Modify customer info, update subscriptions, change status |
| **Delete** | `_customers/delete_customer.cfm` | Archive/remove customer, cascade deletions |
| **Search** | `_customers/search.cfm` | Multi-field search, filters, results pagination |
| **Upload** | `_customers/upload_document.cfm` | Document uploads, file validation, storage |
| **List** | `_customers/list_customers.cfm` | Customer listing, sorting, pagination |

### Subscription Management
| Operation | Function | Description |
|-----------|----------|-------------|
| Add | `add_subscription.cfm` | Create new subscription, validate dates |
| Edit | `edit_subscription.cfm` | Modify subscription details |
| Delete | `delete_subscription.cfm` | Remove subscription |
| Renew | `renew_subscription.cfm` | Extend subscription period |
| View | `view_subscriptions.cfm` | List customer subscriptions |

### Document Management
| Operation | Function | Description |
|-----------|----------|-------------|
| Upload | `upload_document.cfm` | Upload files to customer record |
| Download | `download_document.cfm` | Retrieve customer documents |
| Delete | `delete_document.cfm` | Remove documents |
| List | `list_documents.cfm` | Show customer documents |

---

## 5. Common Patterns Across Modules

### Standard Module Structure
Each module (`_modulename/`) follows this pattern:
```
/dotpub/_modulename/
├── index.cfm              - Module home/dashboard
├── add_*.cfm              - Create new records
├── edit_*.cfm             - Edit existing records
├── delete_*.cfm           - Delete records
├── view_*.cfm             - View details
├── list_*.cfm             - List/search records
├── /queries/
│   ├── select_*.cfm       - SELECT queries
│   ├── insert_*.cfm       - INSERT queries
│   ├── update_*.cfm       - UPDATE queries
│   └── delete_*.cfm       - DELETE queries
├── /include/
│   ├── header.cfm         - Module header
│   ├── footer.cfm         - Module footer
│   └── navigation.cfm     - Module navigation
├── /script/
│   └── module.js          - JavaScript functions
└── /style/
    └── module.css         - Module-specific styles
```

### Common Parameter Handling Issues (Migration-Related)
**Root Causes Identified:**
1. **Path Changes:** C: drive → D: drive on Hostway servers
2. **Parameter Scoping:** Generic variables instead of `url.parameter` or `form.parameter`
3. **Session Management:** CFID/CFTOKEN validation issues

**Standard Fixes Applied:**
- `<cfparam>` for all parameters with defaults
- `<cfqueryparam>` for SQL injection protection
- Proper scope specification (url., form., session.)
- Path updates from C: to D: drive

---

## 6. Database Structure (Inferred)

### Primary Tables (Based on Modules)
```
- tbl_customers           - Customer master records
- tbl_subscriptions       - Customer subscriptions
- tbl_documents           - Uploaded documents
- tbl_users               - System users
- tbl_agents              - Sales agents
- tbl_resellers           - Reseller accounts
- tbl_organizations       - Organization profiles
- tbl_products            - Product catalog
- tbl_articles            - News/articles
- tbl_events              - Event calendar
- tbl_newsletters         - Newsletter campaigns
- tbl_contacts            - Contact database
- tbl_members             - Membership records
- tbl_registrants         - Event registrations
- tbl_campaigns           - Marketing campaigns
- tbl_transactions        - Financial transactions
- tbl_workflow            - Workflow tracking
- tbl_content             - Page content
- tbl_templates           - Template definitions
```

### Common Table Fields Pattern
```sql
- guid                    - Unique identifier (GUID)
- date_created            - Creation timestamp
- date_modified           - Last modification
- created_by              - User who created
- modified_by             - User who modified
- status                  - Active/inactive/deleted
- sort_order              - Display ordering
```

---

## 7. User Flows

### Customer Management Flow
```
Login → Dashboard → Customers → Search/List
                              ↓
                         Select Customer
                              ↓
          ┌──────────────────┼──────────────────┐
          ↓                  ↓                  ↓
    View Details      Edit Customer      Manage Documents
          ↓                  ↓                  ↓
   View History       Save Changes      Upload/Delete
          ↓                  ↓                  ↓
  Subscriptions      Return to List      Return to Customer
```

### Subscription Management Flow
```
Customer Details → Subscriptions → Add/Edit/Delete
                                        ↓
                              Validate Dates
                                        ↓
                              Save to Database
                                        ↓
                              Return to Customer
```

### Document Upload Flow
```
Customer Details → Upload Document → Select File
                                        ↓
                              Validate File Type/Size
                                        ↓
                              Move to D:/uploads/
                                        ↓
                              Save to Database
                                        ↓
                              Return to Customer
```

---

## 8. Integration Points

### Email System
- **Server:** MAILSERVERNAME (configured)
- **From Addresses:**
  - Newsletter: `info@dotpub.com`
  - Support: `support@dotpub.com`
  - Admin: `admin@dotpub.com`

### Search/RSS
- News collection: `newscollection`
- Page collection: `pagecollection`
- RSS keywords: 7 configurable keywords
- RSS article group GUID configured

### External Services
- Payment processing (via accounting module)
- Email campaigns (newsletter module)
- RSS feeds (rss/rsspublish)
- Analytics (stats directory)

---

## 9. Known Technical Debt & Issues

### Phase 3 Fixes Completed
✅ Document upload file paths  
✅ Subscription creation parameter scoping  
✅ Subscription deletion functionality  
✅ Customer search parameter handling  
✅ Pagination navigation  
✅ Date picker replacement (Calendar.js → Flatpickr)  

### Potential Areas for Review
- [ ] All 28 modules for similar parameter scoping issues
- [ ] File upload functionality across all modules
- [ ] Search functionality in other modules
- [ ] Date handling in other modules
- [ ] Session management consistency
- [ ] Error handling standardization
- [ ] Input validation across all forms

---

## 10. Scope Assessment

### Large Modules (40K+ directory size)
- Articles (`/dotpub/_articles/`) - High complexity
- Events (`/dotpub/_events/`) - High complexity  
- Newsletter (`/dotpub/_newsletter/`) - High complexity

### Medium Modules (24K directory size)
- Customers (`/dotpub/_customers/`) - **Primary focus, Phase 3 complete**
- Accounting (`/dotpub/_accounting/`)
- Agents (`/dotpub/_agents/`)
- Resellers (`/dotpub/_resellers/`)
- Users (`/dotpub/_users/`)
- Workflow (`/dotpub/_workflow/`)

### Small Modules (12K directory size)
- Advertising, Campaigns, Contacts, Files, Jobs, Members, Organizations, Products, Registrants, Root, Security, Setup, Templates

### Estimated Total Functionality
- **28 functional modules**
- **~200-300 estimated CFM pages** (based on typical module patterns)
- **~100-150 database tables** (estimated from modules)
- **Multiple CRUD operations per module**
- **Extensive reporting and search capabilities**

---

## 11. Migration Impact Analysis

### Server Migration Changes (HostMySite → Hostway)
1. **File System:** C: drive → D: drive
2. **Permissions:** File/directory permission resets
3. **Database:** Connection string updates
4. **Email:** Mail server configuration

### Common Issues from Migration
- File upload paths broken
- File permission errors
- Parameter validation failures
- Session management inconsistencies
- Missing include files
- Broken file references

### Systematic Fix Pattern
```coldfusion
<!-- Before (Broken) -->
<cfif IsDefined("customerID")>

<!-- After (Fixed) -->
<cfparam name="url.customerID" default="0">
<cfparam name="form.customerID" default="0">
<cfset customerID = IIF(url.customerID GT 0, url.customerID, form.customerID)>
```

---

## 12. Recommendations for Future Phases

### Phase 4 Priority Modules
1. **Users Module** - Authentication and security critical
2. **Agents Module** - Business operations dependency
3. **Resellers Module** - Revenue impact
4. **Accounting Module** - Financial integrity

### Phase 5+ Considerations
1. Review all remaining modules systematically
2. Standardize error handling across application
3. Implement comprehensive logging
4. Update documentation for all modules
5. Consider modernization (ColdFusion version update)
6. Security audit (SQL injection, XSS prevention)
7. Performance optimization
8. Mobile responsiveness review

### Testing Strategy
- Systematic module-by-module testing
- Cross-module integration testing
- User acceptance testing with Karen and Kacy
- Load testing for production readiness

---

## Document Version History
- **v1.0** - November 19, 2024 - Initial comprehensive sitemap based on directory structure analysis

---

## Notes
- This analysis is based on directory structure and configuration files
- Actual CFM file contents not available in provided files
- Database structure inferred from module names and common patterns
- Some estimates based on typical dotPUB CMS implementations
- Phase 3 work focused primarily on customer management module
