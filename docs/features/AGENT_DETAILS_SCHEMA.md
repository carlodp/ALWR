# Agent Details Schema & Structure

Complete documentation for Agent profile fields, configuration, and management.

---

## Overview

The Agent Details page displays comprehensive information about a sales/referral agent who manages customers and subscriptions.

---

## Agent Information Fields

### Personal Information

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| **PIN Number** | String | Optional | Agent's personal identification number (unique) | `10575` |
| **First Name** | String | Required | Agent's first name | `James` |
| **Last Name** | String | Required | Agent's last name | `Dixon` |
| **Password** | String | Required | Login password | (stored hashed) |
| **E-mail** | String | Required | Email address (used for login) | `autheirgroup@yahoo.com` |

### Professional Information

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| **Title** | String | Optional | Professional title | `Agent`, `Senior Agent`, `Director` |
| **Organization** | String | Optional | Company or organization name | `Autheim & Associates` |
| **Type of Agent** | Enum | Optional | Classification of agent | `Individual Agent` or `Organizational Agent` |

### Address Information

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| **Address 1** | String | Required | Primary address line | `7551 Callaghan Rd` |
| **Address 2** | String | Optional | Secondary address (suite, apt, etc.) | `#205` |
| **City** | String | Required | City | `San Antonio` |
| **State** | String | Required | State/Province (2-letter) | `TX` |
| **Zip Code** | String | Required | Postal/Zip code | `78229` |
| **Country** | String | Optional | Country | `United States` |

### Phone Information

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| **Phone 1** | String | Required | Primary phone number | `210 340-1285` |
| **Phone 1 Extension** | String | Optional | Extension for phone 1 | `ext` |
| **Phone 2** | String | Optional | Secondary phone number | `210 241-4322` |
| **Phone 2 Extension** | String | Optional | Extension for phone 2 | `ext` |
| **Fax** | String | Optional | Fax number | (optional) |

---

## Agent Type Options

### Individual Agent
- Single person agent
- Direct personal responsibility for customer management
- Can manage up to specified customer limit

### Organizational Agent
- Agent representing an organization/company
- Company name required
- Multiple people may work under this organizational agent
- Aggregated customer management and metrics

---

## API Endpoints

### Get Agent Details

**Endpoint:** `GET /api/admin/agents/:id`

**Response:**
```json
{
  "id": "agent-123",
  "userId": "user-456",
  "pinNumber": "10575",
  "firstName": "James",
  "lastName": "Dixon",
  "email": "autheirgroup@yahoo.com",
  "title": "Senior Agent",
  "organization": "Autheim & Associates",
  "agentType": "individual_agent",
  "address1": "7551 Callaghan Rd",
  "address2": "#205",
  "city": "San Antonio",
  "state": "TX",
  "zipCode": "78229",
  "country": "United States",
  "phone1": "210 340-1285",
  "phone1Ext": "ext",
  "phone2": "210 241-4322",
  "phone2Ext": "ext",
  "fax": null,
  "licenseNumber": "ABC123456",
  "licenseExpiresAt": "2026-01-15",
  "commissionRate": "10.5",
  "totalCustomersAssigned": 42,
  "totalDocumentsProcessed": 156,
  "totalRevenueGenerated": 125000,
  "status": "active",
  "createdAt": "2023-01-10T10:00:00Z",
  "updatedAt": "2024-11-24T10:00:00Z"
}
```

### Update Agent Details

**Endpoint:** `PATCH /api/admin/agents/:id`

**Request:**
```json
{
  "title": "Senior Agent",
  "organization": "Autheim & Associates",
  "agentType": "individual_agent",
  "address1": "7551 Callaghan Rd",
  "address2": "#205",
  "city": "San Antonio",
  "state": "TX",
  "zipCode": "78229",
  "country": "United States",
  "phone1": "210 340-1285",
  "phone1Ext": "ext",
  "phone2": "210 241-4322",
  "phone2Ext": "ext",
  "fax": null,
  "licenseNumber": "ABC123456",
  "commissionRate": "10.5"
}
```

### List All Agents

**Endpoint:** `GET /api/admin/agents`

**Query Parameters:**
- `status` - Filter by agent status (active, inactive, suspended)
- `type` - Filter by agent type (individual_agent, organizational_agent)
- `search` - Search by name, organization, or email

**Response:**
```json
[
  {
    "id": "agent-123",
    "pinNumber": "10575",
    "firstName": "James",
    "lastName": "Dixon",
    "email": "autheirgroup@yahoo.com",
    "organization": "Autheim & Associates",
    "agentType": "individual_agent",
    "city": "San Antonio",
    "state": "TX",
    "totalCustomersAssigned": 42,
    "totalRevenueGenerated": 125000,
    "status": "active"
  }
]
```

---

## Database Schema

### agents table

```sql
CREATE TABLE agents (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  status VARCHAR DEFAULT 'active',
  
  -- PIN & Agent Type
  pin_number VARCHAR UNIQUE,
  agent_type VARCHAR,  -- 'individual_agent' or 'organizational_agent'
  
  -- Professional
  title VARCHAR,
  organization VARCHAR,
  
  -- Address
  address_1 TEXT,
  address_2 TEXT,
  city VARCHAR,
  state VARCHAR,
  zip_code VARCHAR,
  country VARCHAR,
  
  -- Phone
  phone_1 VARCHAR,
  phone_1_ext VARCHAR,
  phone_2 VARCHAR,
  phone_2_ext VARCHAR,
  fax VARCHAR,
  
  -- Legacy Fields (kept for backward compatibility)
  agency_name VARCHAR,
  agency_phone VARCHAR,
  agency_address TEXT,
  
  -- License/Credentials
  license_number VARCHAR,
  license_expires_at TIMESTAMP,
  
  -- Commission & Payment
  commission_rate VARCHAR,
  stripe_connect_id VARCHAR,
  
  -- Performance Metrics
  total_customers_assigned INTEGER DEFAULT 0,
  total_documents_processed INTEGER DEFAULT 0,
  total_revenue_generated INTEGER DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indices
  INDEX idx_agent_user_id (user_id),
  INDEX idx_agent_status (status),
  INDEX idx_agent_pin_number (pin_number),
  INDEX idx_agent_type (agent_type),
  INDEX idx_agent_organization (organization),
  INDEX idx_agent_city_state (city, state)
);
```

### agentCustomerAssignments table (related)

```sql
CREATE TABLE agent_customer_assignments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id VARCHAR NOT NULL REFERENCES agents(id),
  customer_id VARCHAR NOT NULL REFERENCES customers(id),
  
  assigned_at TIMESTAMP DEFAULT NOW(),
  unassigned_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  
  document_count INTEGER DEFAULT 0,
  last_contact_at TIMESTAMP,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_assignment_agent_id (agent_id),
  INDEX idx_assignment_customer_id (customer_id),
  INDEX idx_assignment_is_active (is_active)
);
```

---

## Field Requirements & Validation

### Required Fields
- `firstName` - Agent first name
- `lastName` - Agent last name
- `email` - Agent email address
- `password` - Account password (hashed)
- `address1` - Primary address
- `city` - City
- `state` - State (2-letter code)
- `zipCode` - Postal code

### Optional Fields
- `pinNumber` - Unique agent identifier
- `title` - Professional title
- `organization` - Organization name
- `agentType` - Individual or Organizational
- `address2` - Secondary address
- `country` - Country
- `phone1`, `phone1Ext` - Primary phone
- `phone2`, `phone2Ext` - Secondary phone
- `fax` - Fax number
- `licenseNumber`, `licenseExpiresAt` - License information
- `commissionRate` - Commission percentage
- `notes` - Internal notes

### Field Constraints

| Field | Min Length | Max Length | Format |
|-------|-----------|-----------|--------|
| pinNumber | 1 | 20 | Alphanumeric |
| email | 5 | 255 | Valid email |
| zipCode | 3 | 10 | Alphanumeric + special |
| phone1 | 10 | 20 | Phone format |
| state | 2 | 2 | 2-letter code |
| commissionRate | - | - | Decimal (e.g., "10.5") |

---

## Agent Roles & Permissions

### Agent Role Abilities

Agents can:
- ✅ View their assigned customers
- ✅ Manage customer documents
- ✅ Update subscription information
- ✅ Generate reports for their customers
- ✅ Track commission earnings

Agents cannot:
- ❌ Create other agents
- ❌ Delete customers
- ❌ Access all customers (only assigned ones)
- ❌ Change payment settings
- ❌ View system settings

---

## Performance Metrics

Each agent profile tracks:

| Metric | Description |
|--------|-------------|
| **Total Customers Assigned** | Number of customers this agent manages |
| **Total Documents Processed** | Cumulative documents handled |
| **Total Revenue Generated** | Total subscription revenue attributed to agent (in cents) |

These metrics are updated automatically as agents manage customers and process documents.

---

## Commission Structure

Commission is calculated based on:
- Agent commission rate (e.g., "10.5" = 10.5%)
- Total customer subscription revenue
- Automatic Stripe Connect payouts

**Example:**
- Agent commission rate: 10.5%
- Customer subscription: $65.00
- Agent commission: $6.83 (10.5% of $65)

---

## License Management

Agents can have licenses that expire:

| Field | Description |
|-------|-------------|
| **License Number** | Unique license identifier |
| **License Expires At** | When license expires (date) |

When license expires, agent status should be reviewed and may need to be suspended.

---

## Security Notes

- ✅ PIN numbers are unique per agent
- ✅ All agent data is audited (creation/updates logged)
- ✅ Email addresses indexed for quick lookup
- ✅ Phone numbers can be masked in logs
- ✅ Commission rates stored as strings to prevent rounding errors

---

## Agent Status Lifecycle

```
Active (normal operation)
  ↓
Inactive (temporarily not working)
  ↓
Suspended (pending review/violation)
  ↓
Reactivated (back to Active)
```

---

## Related Documentation

- [Customer Details Schema](./CUSTOMER_DETAILS_SCHEMA.md)
- [Batch Operations & Advanced Search](./BATCH_OPERATIONS_AND_ADVANCED_SEARCH.md)
- [Audit Logging](./AUDIT_LOGGING.md)
- [WordPress API Key Authentication](../integrations/WORDPRESS_API_KEY_AUTHENTICATION.md)
