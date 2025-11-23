# ALWR System Architecture - Visual Diagrams

## System Architecture Overview

```mermaid
graph TB
    subgraph "Public Interface"
        PUB[Public Website<br/>alwr.com]
    end
    
    subgraph "Admin System /dotpub/"
        LOGIN[Login System<br/>_security]
        DASH[Admin Dashboard<br/>_root]
    end
    
    subgraph "Core Business Modules"
        CUST[Customers<br/>_customers]
        AGENT[Agents<br/>_agents]
        RESELL[Resellers<br/>_resellers]
        ACCT[Accounting<br/>_accounting]
    end
    
    subgraph "Content Management"
        CONT[Content<br/>_content]
        ART[Articles<br/>_articles]
        NEWS[Newsletter<br/>_newsletter]
        EVENTS[Events<br/>_events]
    end
    
    subgraph "Supporting Modules"
        USERS[Users<br/>_users]
        WORK[Workflow<br/>_workflow]
        ORG[Organizations<br/>_organizations]
        PROD[Products<br/>_products]
        CONTACT[Contacts<br/>_contacts]
        CAMP[Campaigns<br/>_campaigns]
        MEM[Members<br/>_members]
        REG[Registrants<br/>_registrants]
        FILES[Files<br/>_files]
        JOBS[Jobs<br/>_jobs]
        TEMP[Templates<br/>_templates]
        ADV[Advertising<br/>_advertising]
        SETUP[Setup<br/>_setup]
    end
    
    subgraph "Database"
        DB[(MS SQL Server<br/>1092428_ALWR3)]
    end
    
    subgraph "External Services"
        EMAIL[Email System<br/>MAILSERVERNAME]
        RSS[RSS Feeds]
        SEARCH[Search Engine]
    end
    
    PUB --> LOGIN
    LOGIN --> DASH
    DASH --> CUST
    DASH --> AGENT
    DASH --> RESELL
    DASH --> ACCT
    DASH --> CONT
    DASH --> ART
    DASH --> NEWS
    DASH --> EVENTS
    DASH --> USERS
    DASH --> WORK
    
    CUST --> DB
    AGENT --> DB
    RESELL --> DB
    ACCT --> DB
    CONT --> DB
    ART --> DB
    NEWS --> DB
    EVENTS --> DB
    USERS --> DB
    WORK --> DB
    ORG --> DB
    PROD --> DB
    
    NEWS --> EMAIL
    EVENTS --> EMAIL
    ART --> RSS
    CONT --> SEARCH
    
    style CUST fill:#90EE90
    style AGENT fill:#FFE4B5
    style RESELL fill:#FFE4B5
    style ACCT fill:#FFE4B5
```

## Customer Management Module - Detailed Flow

```mermaid
graph LR
    subgraph "Customer Module Entry Points"
        SEARCH[Search Customers]
        LIST[List All Customers]
        ADD[Add New Customer]
    end
    
    subgraph "Customer Detail View"
        VIEW[View Customer]
        INFO[Customer Info]
        SUBS[Subscriptions]
        DOCS[Documents]
        HIST[History]
    end
    
    subgraph "Customer Operations"
        EDIT[Edit Customer]
        DEL[Delete Customer]
        ADDSUB[Add Subscription]
        DELSUB[Delete Subscription]
        UPLOAD[Upload Document]
        DELDOC[Delete Document]
    end
    
    subgraph "Database Operations"
        SELECT[(SELECT Queries)]
        INSERT[(INSERT Queries)]
        UPDATE[(UPDATE Queries)]
        DELETE[(DELETE Queries)]
    end
    
    SEARCH --> VIEW
    LIST --> VIEW
    ADD --> INSERT
    VIEW --> INFO
    VIEW --> SUBS
    VIEW --> DOCS
    VIEW --> HIST
    INFO --> EDIT
    EDIT --> UPDATE
    VIEW --> DEL
    DEL --> DELETE
    SUBS --> ADDSUB
    ADDSUB --> INSERT
    SUBS --> DELSUB
    DELSUB --> DELETE
    DOCS --> UPLOAD
    UPLOAD --> INSERT
    DOCS --> DELDOC
    DELDOC --> DELETE
    
    SELECT --> VIEW
    INSERT --> VIEW
    UPDATE --> VIEW
    DELETE --> LIST
    
    style VIEW fill:#90EE90
    style EDIT fill:#FFD700
    style DEL fill:#FF6B6B
    style UPLOAD fill:#87CEEB
```

## Module Dependency Map

```mermaid
graph TD
    USERS[Users Module<br/>Authentication]
    SEC[Security Module<br/>Permissions]
    CUST[Customers]
    SUBS[Subscriptions]
    DOCS[Documents]
    AGENT[Agents]
    RESELL[Resellers]
    ACCT[Accounting]
    TRANS[Transactions]
    ORG[Organizations]
    CONT[Contacts]
    PROD[Products]
    WORK[Workflow]
    NEWS[Newsletter]
    EVENTS[Events]
    
    USERS --> SEC
    SEC --> CUST
    SEC --> AGENT
    SEC --> RESELL
    SEC --> ACCT
    
    CUST --> SUBS
    CUST --> DOCS
    CUST --> ORG
    CUST --> CONT
    
    AGENT --> CUST
    RESELL --> CUST
    
    ACCT --> TRANS
    ACCT --> CUST
    
    SUBS --> PROD
    
    WORK --> CUST
    WORK --> AGENT
    
    NEWS --> CONT
    EVENTS --> CONT
    
    style USERS fill:#FF6B6B
    style SEC fill:#FF6B6B
    style CUST fill:#90EE90
```

## Data Flow - Customer Subscription Creation

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant AddSub as add_subscription.cfm
    participant Validate as Validation Logic
    participant Query as insert_subscription.cfm
    participant DB as Database
    participant View as view_customer.cfm
    
    User->>Browser: Click "Add Subscription"
    Browser->>AddSub: GET/POST customerID
    AddSub->>AddSub: CFPARAM url.customerID
    AddSub->>AddSub: CFPARAM form.subscriptionType
    AddSub->>Validate: Validate dates & data
    
    alt Validation Fails
        Validate-->>Browser: Error message
        Browser-->>User: Show errors
    else Validation Succeeds
        Validate->>Query: Pass validated data
        Query->>DB: INSERT INTO tbl_subscriptions
        DB-->>Query: Success/GUID
        Query->>View: Redirect with customerID
        View->>DB: SELECT customer & subscriptions
        DB-->>View: Return data
        View-->>Browser: Display updated customer
        Browser-->>User: Show success message
    end
```

## File Upload Flow (Phase 3 Fix)

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Upload as upload_document.cfm
    participant FileSystem as D:/uploads/
    participant Query as insert_document.cfm
    participant DB as Database
    
    User->>Browser: Select file & submit
    Browser->>Upload: POST file + customerID
    Upload->>Upload: CFPARAM url.customerID
    Upload->>Upload: CFPARAM form.customerID
    Upload->>Upload: Validate file type/size
    
    alt Invalid File
        Upload-->>Browser: Error message
    else Valid File
        Upload->>FileSystem: CFFILE action="upload"<br/>destination="D:/uploads/"
        FileSystem-->>Upload: File saved
        Upload->>Query: Save file metadata
        Query->>DB: INSERT INTO tbl_documents
        DB-->>Query: Success
        Query-->>Browser: Success message
        Browser-->>User: File uploaded
    end
    
    Note over Upload,FileSystem: Phase 3 Fix:<br/>Changed C:/ to D:/
```

## Common Bug Pattern (Migration Issues)

```mermaid
graph TB
    subgraph "Before Migration - HostMySite"
        OLD_PATH[File Path: C:/uploads/]
        OLD_PARAM[Parameter: customerID<br/>No scope specified]
        OLD_VAR[Variable Check:<br/>IsDefined 'customerID']
    end
    
    subgraph "After Migration - Hostway"
        NEW_PATH[File Path: D:/uploads/]
        NEW_PARAM[Parameter: url.customerID<br/>form.customerID]
        NEW_VAR[Variable Check:<br/>CFPARAM with defaults]
        SCOPE[Proper Scoping:<br/>url. form. session.]
    end
    
    subgraph "Issues"
        ERROR1[File Not Found<br/>Wrong drive]
        ERROR2[Undefined Variable<br/>Wrong scope]
        ERROR3[SQL Injection Risk<br/>No CFQUERYPARAM]
    end
    
    OLD_PATH -.->|Migration| ERROR1
    OLD_PARAM -.->|Migration| ERROR2
    OLD_VAR -.->|Migration| ERROR3
    
    NEW_PATH -->|Fix| ERROR1
    NEW_PARAM -->|Fix| ERROR2
    SCOPE -->|Fix| ERROR3
    NEW_VAR -->|Fix| ERROR2
    
    style ERROR1 fill:#FF6B6B
    style ERROR2 fill:#FF6B6B
    style ERROR3 fill:#FF6B6B
    style NEW_PATH fill:#90EE90
    style NEW_PARAM fill:#90EE90
    style NEW_VAR fill:#90EE90
    style SCOPE fill:#90EE90
```

## Module Size & Complexity Matrix

```mermaid
quadrantChart
    title Module Complexity vs Size
    x-axis Small --> Large
    y-axis Simple --> Complex
    quadrant-1 High Priority Review
    quadrant-2 Phase 4 Focus
    quadrant-3 Quick Fixes
    quadrant-4 Maintenance Mode
    
    Customers: [0.6, 0.7]
    Articles: [0.8, 0.8]
    Events: [0.8, 0.7]
    Newsletter: [0.8, 0.9]
    Agents: [0.6, 0.6]
    Resellers: [0.6, 0.6]
    Accounting: [0.6, 0.8]
    Users: [0.6, 0.7]
    Workflow: [0.6, 0.6]
    Organizations: [0.3, 0.4]
    Products: [0.3, 0.4]
    Contacts: [0.3, 0.3]
    Campaigns: [0.3, 0.4]
    Members: [0.3, 0.4]
    Jobs: [0.3, 0.3]
    Files: [0.3, 0.3]
    Security: [0.3, 0.7]
    Setup: [0.3, 0.5]
```

## Testing Flow Phases

```mermaid
graph LR
    subgraph "Phase 3 - Completed"
        P3A[Customer Module]
        P3B[Subscriptions]
        P3C[Documents]
        P3D[Search]
        P3E[Pagination]
    end
    
    subgraph "Phase 4 - Proposed"
        P4A[Users Module]
        P4B[Agents Module]
        P4C[Resellers Module]
        P4D[Accounting Module]
    end
    
    subgraph "Phase 5+ - Future"
        P5A[Content Modules]
        P5B[Newsletter/Events]
        P5C[Supporting Modules]
        P5D[Security Audit]
    end
    
    P3A --> P3B
    P3B --> P3C
    P3C --> P3D
    P3D --> P3E
    P3E --> P4A
    P4A --> P4B
    P4B --> P4C
    P4C --> P4D
    P4D --> P5A
    P5A --> P5B
    P5B --> P5C
    P5C --> P5D
    
    style P3A fill:#90EE90
    style P3B fill:#90EE90
    style P3C fill:#90EE90
    style P3D fill:#90EE90
    style P3E fill:#90EE90
    style P4A fill:#FFD700
    style P4B fill:#FFD700
    style P4C fill:#FFD700
    style P4D fill:#FFD700
```
