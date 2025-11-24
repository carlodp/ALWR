# Customer Details Schema & Structure

Complete documentation for the Customer Details page structure, fields, and related accounts, subscriptions, and documents sections.

---

## Overview

The Customer Details page displays comprehensive information about a customer, organized into 4 main sections:

1. **Customer Information** - Personal and professional details
2. **Customer Accounts** - User accounts associated with the customer
3. **Customer Subscriptions** - Active and past subscriptions
4. **Customer Documents** - Healthcare directives and documents

---

## Customer Information Section

### Personal Details

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| **PRN Number** | String | Optional | Personal Reference Number (unique identifier) | `15920` |
| **First Name** | String | Required | Customer's first name | `Donald` |
| **Last Name** | String | Required | Customer's last name | `Cummings` |
| **Date of Birth** | Date | Optional | Birth date (MM/DD/YYYY) | `10/30/1945` |
| **Password** | String | Required | Login password | `DCummings` |

### Contact Information

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| **E-mail** | Email | Required | Email address (used for login) | `donaldthebach45@gmail.com` |
| **Title** | String | Optional | Professional title | `Dr.`, `Mr.`, `Ms.`, `Rev.` |
| **Organization** | String | Optional | Company or organization name | `Brittany Drive South #603` |

### Address Information

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| **Address 1** | String | Optional | Primary address line | `4900 Brittany Drive South #603` |
| **Address 2** | String | Optional | Secondary address (apt, suite, etc.) | `Apartment 603` |
| **City** | String | Optional | City | `St. Petersburg` |
| **State** | String | Optional | State/Province (2-letter) | `FL` |
| **Zip Code** | String | Optional | Postal/Zip code | `33715` |
| **Country** | String | Optional | Country | `United States` |

### Phone Information

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| **Phone 1** | String | Optional | Primary phone number | `(617) 245-6009` |
| **Phone 1 Extension** | String | Optional | Extension for phone 1 | `ext` |
| **Phone 2** | String | Optional | Secondary phone number | `(617) 506-6879` |
| **Phone 2 Extension** | String | Optional | Extension for phone 2 | `ext` |
| **Fax** | String | Optional | Fax number | `(555) 123-4567` |

### Additional Information

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| **Referral Code** | String | Optional | Code for referral tracking (who referred this customer) | `10520` |
| **Enter Notes** | Text | Optional | Internal notes about customer | `Currently: Karen Keaton` |

---

## Customer Accounts Section

Shows all user accounts associated with this customer.

### Account Table Columns

| Column | Description |
|--------|-------------|
| **ID** | Unique account identifier (UUID) |
| **Name** | Account name/type | 
| **Created** | Date account was created | 
| **Modified** | Date account was last updated |
| **Action** | Edit Account button |

### Example Data

```
ID: 3293750
Name: ALWR Account
Created: 2015-09-10 16:02:45 587
Modified: 2015-09-10 16:02:49 557
```

---

## Customer Subscriptions Section

Shows all subscription records for this customer (active and past).

### Subscription Table Columns

| Column | Description |
|--------|-------------|
| **ID** | Subscription record ID |
| **Account** | Associated account name or ID |
| **Price** | Subscription cost (e.g., $65.00) |
| **Paid Date** | When subscription was activated |
| **Expires Date** | When subscription will/did expire |
| **Action** | Delete button to remove subscription |

### Subscription Status

Subscriptions can have these statuses:
- `active` - Currently active subscription
- `inactive` - Paused/suspended subscription
- `cancelled` - Cancelled subscription
- `pending` - Awaiting activation
- `trial` - Trial period subscription
- `expired` - Past expiration date

### Example Data

```
ID: 104877
Account: ALWR Account (3293750)
Price: $65.00
Paid Date: 09/10/2025
Expires Date: 09/10/2025

ID: 102469
Account: ALWR Account (3293750)
Price: $50.00
Paid Date: 09/10/2015
Expires Date: 09/10/2020
```

---

## Customer Documents Section

Shows all documents (healthcare directives, living wills, etc.) uploaded by the customer.

### Document Table Columns

| Column | Description |
|--------|-------------|
| **ID** | Document record ID |
| **Type** | Document type (Healthcare Surrogate, Living Will, etc.) |
| **File Name** | Name of the uploaded file |
| **Created** | Date document was uploaded |
| **Action** | Delete button to remove document |

### Document Types

Documents can be one of these types:
- `living_will` - Living will document
- `healthcare_directive` - Healthcare power of attorney
- `power_of_attorney` - General power of attorney
- `dnr` - Do Not Resuscitate order
- `other` - Other healthcare-related documents

### Example Data

```
ID: 44285
Type: Healthcare Surrogate (3293750)
File Name: 12145-3293750-2-0115111-055858.pdf
Created: 11/11/2015

ID: 44287
Type: Living Will (3293750)
File Name: 12145-3293750-2-0115111-055858.pdf
Created: 11/11/2015
```

---

## API Endpoints

### Get Customer Details

**Endpoint:** `GET /api/admin/customers/:id`

**Response:**
```json
{
  "id": "cust-123",
  "userId": "user-456",
  "prnNumber": "15920",
  "firstName": "Donald",
  "lastName": "Cummings",
  "dateOfBirth": "1945-10-30",
  "email": "donaldthebach45@gmail.com",
  "title": "Dr.",
  "organization": "Brittany Drive South",
  "address1": "4900 Brittany Drive South #603",
  "address2": "Apartment 603",
  "city": "St. Petersburg",
  "state": "FL",
  "zipCode": "33715",
  "country": "United States",
  "phone1": "(617) 245-6009",
  "phone1Ext": "ext",
  "phone2": "(617) 506-6879",
  "phone2Ext": "ext",
  "fax": null,
  "referralCode": "10520",
  "notes": "Currently: Karen Keaton",
  "emergencyContactName": "Jane Doe",
  "emergencyContactPhone": "+1234567890",
  "emergencyContactRelationship": "Spouse",
  "accountStatus": "active",
  "createdAt": "2015-09-10T16:02:45Z",
  "updatedAt": "2015-09-10T16:02:49Z",
  "accounts": [
    {
      "id": "3293750",
      "name": "ALWR Account",
      "createdAt": "2015-09-10T16:02:45Z",
      "updatedAt": "2015-09-10T16:02:49Z"
    }
  ],
  "subscriptions": [
    {
      "id": "104877",
      "accountId": "3293750",
      "accountName": "ALWR Account",
      "price": 6500,
      "paidDate": "2025-09-10",
      "expiresDate": "2025-09-10",
      "status": "active"
    },
    {
      "id": "102469",
      "accountId": "3293750",
      "accountName": "ALWR Account",
      "price": 5000,
      "paidDate": "2015-09-10",
      "expiresDate": "2020-09-10",
      "status": "expired"
    }
  ],
  "documents": [
    {
      "id": "44285",
      "type": "healthcare_surrogate",
      "fileName": "12145-3293750-2-0115111-055858.pdf",
      "fileSize": 245600,
      "mimeType": "application/pdf",
      "createdAt": "2015-11-11T00:00:00Z"
    },
    {
      "id": "44287",
      "type": "living_will",
      "fileName": "12145-3293750-2-0115111-055858.pdf",
      "fileSize": 189432,
      "mimeType": "application/pdf",
      "createdAt": "2015-11-11T00:00:00Z"
    }
  ]
}
```

### Update Customer Details

**Endpoint:** `PATCH /api/admin/customers/:id`

**Request:**
```json
{
  "firstName": "Donald",
  "lastName": "Cummings",
  "email": "donaldthebach45@gmail.com",
  "title": "Dr.",
  "organization": "Healthcare Inc",
  "address1": "4900 Brittany Drive South #603",
  "address2": "Apartment 603",
  "city": "St. Petersburg",
  "state": "FL",
  "zipCode": "33715",
  "country": "United States",
  "phone1": "(617) 245-6009",
  "phone1Ext": "ext",
  "phone2": "(617) 506-6879",
  "phone2Ext": "ext",
  "referralCode": "10520",
  "notes": "Updated customer info"
}
```

---

## Database Schema

### customers table

```sql
CREATE TABLE customers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  account_status VARCHAR DEFAULT 'active',
  
  -- PRN & Professional
  prn_number VARCHAR UNIQUE,
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
  
  -- Emergency Contact
  emergency_contact_name VARCHAR,
  emergency_contact_phone VARCHAR,
  emergency_contact_relationship VARCHAR,
  
  -- ID Card
  id_card_number VARCHAR UNIQUE,
  id_card_issued_date TIMESTAMP,
  current_version INTEGER DEFAULT 1,
  
  -- Referral
  referral_code VARCHAR,
  referred_by_customer_id VARCHAR REFERENCES customers(id),
  
  -- Stripe
  stripe_customer_id VARCHAR UNIQUE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indices
  INDEX idx_customer_user_id (user_id),
  INDEX idx_customer_prn_number (prn_number),
  INDEX idx_customer_organization (organization),
  INDEX idx_customer_city_state (city, state)
);
```

### subscriptions table (related)

```sql
CREATE TABLE subscriptions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id VARCHAR NOT NULL REFERENCES customers(id),
  status VARCHAR DEFAULT 'pending',
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  renewal_date TIMESTAMP,
  amount INTEGER NOT NULL, -- in cents
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### documents table (related)

```sql
CREATE TABLE documents (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id VARCHAR NOT NULL REFERENCES customers(id),
  file_name VARCHAR NOT NULL,
  file_type VARCHAR NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Field Requirements & Validation

### Required Fields
- `firstName` - Customer first name
- `lastName` - Customer last name
- `email` - Customer email address
- `password` - Account password (hashed)
- `userId` - Reference to user account

### Optional Fields
- All other fields are optional
- Address fields can be partially filled
- Phone numbers can be left blank if not available
- Professional information is optional

### Field Constraints

| Field | Min Length | Max Length | Format |
|-------|-----------|-----------|--------|
| prnNumber | 1 | 20 | Alphanumeric |
| email | 5 | 255 | Valid email |
| zipCode | 3 | 10 | Alphanumeric + special |
| phone1 | 10 | 20 | Phone format |
| country | 2 | 50 | Text |

---

## Security Notes

- ✅ All customer data is audited (creation/updates logged)
- ✅ Email addresses are indexed for quick lookup
- ✅ Phone numbers should be masked in logs
- ✅ Notes field can contain sensitive information
- ✅ Address information is PII (personally identifiable information)

---

## Migration Notes

If migrating from legacy system:

1. **Address Fields**: Split old `address` field into `address1` and `address2`
2. **Phone Fields**: Split old `phone` into `phone1` and `phone1Ext`
3. **New Fields**: `prnNumber`, `title`, `organization`, `country`, `phone2`, `fax`
4. **Validation**: Run address/phone validation after migration

---

## Related Documentation

- [Batch Operations & Advanced Search](./BATCH_OPERATIONS_AND_ADVANCED_SEARCH.md)
- [API Key Authentication](../integrations/WORDPRESS_API_KEY_AUTHENTICATION.md)
- [Audit Logging](./AUDIT_LOGGING.md)
