# Reseller Details Schema & Structure

Complete documentation for Reseller profile fields, contact groups, and extended value fields.

---

## Overview

The Reseller Details page displays comprehensive information about a reseller partner, including contact information, organization details, and flexible extended value fields for custom attributes.

---

## Contact Detail Fields

### Contact Group Classification

| Field | Type | Required | Description | Options |
|-------|------|----------|-------------|---------|
| **Contact Group** | Enum | Optional | Customer/contact segment | - Event Registrants<br>- Info Seekers<br>- Pennies Peace of Mind |

### Personal Information

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| **First Name** | String | Optional | Reseller's first name | `Peralaine` |
| **Last Name** | String | Optional | Reseller's last name | `McCullough` |
| **E-mail** | String | Required | Email address (login credential) | `GJAM1111@aol.com` |
| **Title** | String | Optional | Professional title | `Miss`, `Mrs.`, `Mr.`, etc. |

### Organization Information

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| **Organization** | String | Optional | Company/organization name | (Optional) |

### Address Information

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| **Address 1** | String | Optional | Primary address line | `5131 13th Avenue South` |
| **Address 2** | String | Optional | Secondary address | (Optional) |
| **City** | String | Optional | City | `Gulfport` |
| **State/Province** | String | Optional | State/Province (2-letter) | `Florida` |
| **Zip/Postal Code** | String | Optional | Postal code | `33707` |
| **Country** | String | Optional | Country | `United States` |

### Contact Information

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| **Phone** | String | Optional | Primary phone number | `727-215-9400` |
| **Mobile Phone** | String | Optional | Mobile phone number | (Optional) |
| **Fax** | String | Optional | Fax number | (Optional) |

### Web & Industry

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| **Web Site URL** | String | Optional | Website URL | `https://example.com` |
| **Industry** | String | Optional | Industry classification | (Optional) |

### Extended Values (Flexible Custom Fields)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **Extended Value 1-10** | String (JSON Array) | Optional | Custom attributes (improved as flexible JSON array) |

**Extended Values** replace the rigid 10-column structure with a flexible JSON array that can store unlimited key-value pairs:

```json
{
  "extendedValues": [
    { "key": "custom_field_1", "value": "value1" },
    { "key": "custom_field_2", "value": "value2" },
    { "key": "additional_info", "value": "some data" }
  ]
}
```

This allows you to:
- ✅ Add custom fields without database migrations
- ✅ Store unlimited additional information
- ✅ Query and filter on extended values
- ✅ Keep data flexible and scalable

---

## API Endpoints

### Get Reseller Details

**Endpoint:** `GET /api/admin/resellers/:id`

**Response:**
```json
{
  "id": "reseller-123",
  "userId": "user-456",
  "contactGroup": "event_registrants",
  "firstName": "Peralaine",
  "lastName": "McCullough",
  "email": "GJAM1111@aol.com",
  "title": "Miss",
  "organization": null,
  "address1": "5131 13th Avenue South",
  "address2": null,
  "city": "Gulfport",
  "state": "Florida",
  "zipCode": "33707",
  "country": "United States",
  "phone": "727-215-9400",
  "mobilePhone": null,
  "fax": null,
  "webSiteUrl": null,
  "industry": null,
  "extendedValues": [
    { "key": "custom_info", "value": "additional data" }
  ],
  "commissionRate": "15.5",
  "totalCustomersReferred": 12,
  "totalRevenueGenerated": 78000,
  "status": "active",
  "createdAt": "2023-01-10T10:00:00Z",
  "updatedAt": "2024-11-24T10:00:00Z"
}
```

### Update Reseller Details

**Endpoint:** `PATCH /api/admin/resellers/:id`

**Request:**
```json
{
  "contactGroup": "event_registrants",
  "firstName": "Peralaine",
  "lastName": "McCullough",
  "title": "Miss",
  "organization": "Event Company",
  "address1": "5131 13th Avenue South",
  "city": "Gulfport",
  "state": "Florida",
  "zipCode": "33707",
  "country": "United States",
  "phone": "727-215-9400",
  "mobilePhone": "727-555-5555",
  "webSiteUrl": "https://example.com",
  "industry": "Event Management",
  "extendedValues": [
    { "key": "referral_source", "value": "conference_2024" },
    { "key": "vip_status", "value": "yes" },
    { "key": "preferred_contact_method", "value": "email" }
  ]
}
```

### List All Resellers

**Endpoint:** `GET /api/admin/resellers`

**Query Parameters:**
- `status` - Filter by reseller status (active, inactive, suspended)
- `contactGroup` - Filter by contact group (event_registrants, info_seekers, etc.)
- `search` - Search by name, organization, email, or phone

**Response:**
```json
[
  {
    "id": "reseller-123",
    "firstName": "Peralaine",
    "lastName": "McCullough",
    "email": "GJAM1111@aol.com",
    "organization": "Event Company",
    "contactGroup": "event_registrants",
    "city": "Gulfport",
    "state": "Florida",
    "phone": "727-215-9400",
    "totalCustomersReferred": 12,
    "totalRevenueGenerated": 78000,
    "status": "active"
  }
]
```

---

## Database Schema

### resellers table

```sql
CREATE TABLE resellers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  status VARCHAR DEFAULT 'active',
  
  -- Contact Group
  contact_group VARCHAR,  -- 'event_registrants', 'info_seekers', 'pennies_peace_of_mind'
  
  -- Personal Information
  first_name VARCHAR,
  last_name VARCHAR,
  title VARCHAR,
  organization VARCHAR,
  
  -- Address
  address_1 TEXT,
  address_2 TEXT,
  city VARCHAR,
  state VARCHAR,
  zip_code VARCHAR,
  country VARCHAR,
  
  -- Contact
  phone VARCHAR,
  mobile_phone VARCHAR,
  fax VARCHAR,
  
  -- Web & Industry
  web_site_url VARCHAR,
  industry VARCHAR,
  
  -- Extended Values (flexible JSON)
  extended_values JSONB,
  
  -- Legacy Fields
  company_name VARCHAR,
  company_phone VARCHAR,
  company_address TEXT,
  tax_id VARCHAR,
  partner_tier VARCHAR DEFAULT 'standard',
  
  -- Commission & Payment
  commission_rate VARCHAR,
  payment_terms VARCHAR,
  stripe_connect_id VARCHAR,
  
  -- Performance Metrics
  total_customers_referred INTEGER DEFAULT 0,
  total_documents_processed INTEGER DEFAULT 0,
  total_revenue_generated INTEGER DEFAULT 0,
  total_commission_earned INTEGER DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indices
  INDEX idx_reseller_user_id (user_id),
  INDEX idx_reseller_status (status),
  INDEX idx_reseller_contact_group (contact_group),
  INDEX idx_reseller_organization (organization),
  INDEX idx_reseller_city_state (city, state)
);
```

---

## Extended Values Implementation

### What Are Extended Values?

Extended Values are custom fields that allow you to store additional information about a reseller without requiring database schema changes.

### Structure

Instead of 10 rigid columns (Extended Value 1-10), use a flexible JSON array:

```json
{
  "extendedValues": [
    {
      "key": "field_name",
      "value": "field_value"
    }
  ]
}
```

### Examples

**Event Registrant:**
```json
{
  "extendedValues": [
    { "key": "event_name", "value": "Annual Conference 2024" },
    { "key": "event_date", "value": "2024-06-15" },
    { "key": "booth_number", "value": "B-42" },
    { "key": "contact_at_event", "value": "John Smith" }
  ]
}
```

**Info Seeker:**
```json
{
  "extendedValues": [
    { "key": "inquiry_topic", "value": "Estate Planning" },
    { "key": "follow_up_date", "value": "2024-12-15" },
    { "key": "interests", "value": "Living Wills, POA" },
    { "key": "lead_source", "value": "Website Form" }
  ]
}
```

**Pennies Peace of Mind Member:**
```json
{
  "extendedValues": [
    { "key": "membership_level", "value": "Gold" },
    { "key": "renewal_date", "value": "2025-01-31" },
    { "key": "referral_commission_tier", "value": "Premium" },
    { "key": "vip_status", "value": "yes" }
  ]
}
```

### Querying Extended Values (PostgreSQL)

**Get all resellers with specific extended value:**
```sql
SELECT * FROM resellers 
WHERE extended_values @> '[{"key": "membership_level", "value": "Gold"}]'::jsonb;
```

**Get resellers with specific key in extended values:**
```sql
SELECT * FROM resellers 
WHERE extended_values @> '[{"key": "vip_status"}]'::jsonb;
```

---

## Contact Groups Explained

### Event Registrants
- Resellers/contacts from conferences, webinars, or event registrations
- Typically high engagement at specific events
- May have event-specific extended values (booth number, event date, etc.)

### Info Seekers
- Contacts who've expressed interest in information
- May be leads not yet converted to active resellers
- Good for nurture campaigns and follow-up

### Pennies Peace of Mind
- Premium or special partnership members
- Likely VIP or elite tier resellers
- May have special commission rates or benefits

---

## Field Requirements & Validation

### Required Fields
- `userId` - Reference to user account
- `email` - Email address (from users table)

### Optional Fields
- All other contact fields
- Extended values

### Field Constraints

| Field | Min Length | Max Length | Format |
|-------|-----------|-----------|--------|
| email | 5 | 255 | Valid email |
| zipCode | 3 | 10 | Alphanumeric |
| phone | 10 | 20 | Phone format |
| state | 2 | 2 | 2-letter code |
| commissionRate | - | - | Decimal (e.g., "15.5") |

---

## Performance Metrics

Each reseller profile tracks:

| Metric | Description |
|--------|-------------|
| **Total Customers Referred** | Number of customers this reseller has referred |
| **Total Documents Processed** | Cumulative documents handled |
| **Total Revenue Generated** | Total subscription revenue attributed to referrals (in cents) |
| **Total Commission Earned** | Commission earned from referrals (in cents) |

---

## Commission Structure

Commission is calculated based on:
- Reseller commission rate (e.g., "15.5" = 15.5%)
- Total customer subscription revenue
- Automatic Stripe Connect payouts

**Example:**
- Reseller commission rate: 15.5%
- Customer subscription: $65.00
- Reseller commission: $10.08 (15.5% of $65)

---

## Security Notes

- ✅ All reseller data is audited (creation/updates logged)
- ✅ Email addresses indexed for quick lookup
- ✅ Phone numbers can be masked in logs
- ✅ Extended values stored in JSON - queryable and filterable
- ✅ Commission rates stored as strings to prevent rounding errors

---

## Reseller Status Lifecycle

```
Active (normal operation)
  ↓
Inactive (temporarily not active)
  ↓
Suspended (under review/violation)
  ↓
Reactivated (back to Active)
```

---

## Benefits of Extended Values

### Before (10 Rigid Columns)
```
Extended Value 1: [field_a]
Extended Value 2: [field_b]
Extended Value 3: [field_c]
Extended Value 4: [empty]
Extended Value 5: [empty]
Extended Value 6: [empty]
Extended Value 7: [empty]
Extended Value 8: [empty]
Extended Value 9: [empty]
Extended Value 10: [empty]
```
Problem: Limited to 10 fields, wasteful storage, inflexible

### After (JSON Array)
```json
{
  "extendedValues": [
    { "key": "field_a", "value": "data" },
    { "key": "field_b", "value": "data" },
    { "key": "field_c", "value": "data" },
    { "key": "field_d", "value": "data" },
    { "key": "field_e", "value": "data" },
    ... unlimited fields
  ]
}
```
Benefits:
- ✅ Unlimited fields
- ✅ No database migrations needed
- ✅ Self-documenting (field names are explicit)
- ✅ Queryable and filterable
- ✅ Easy to add/remove fields

---

## Related Documentation

- [Customer Details Schema](./CUSTOMER_DETAILS_SCHEMA.md)
- [Agent Details Schema](./AGENT_DETAILS_SCHEMA.md)
- [Batch Operations & Advanced Search](./BATCH_OPERATIONS_AND_ADVANCED_SEARCH.md)
- [WordPress API Key Authentication](../integrations/WORDPRESS_API_KEY_AUTHENTICATION.md)
