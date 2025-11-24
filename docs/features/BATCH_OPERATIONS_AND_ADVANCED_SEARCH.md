# Batch Operations & Advanced Search Features

## Overview

Two major features have been added to ALWR to improve admin efficiency:

1. **Batch Operations** - Perform bulk actions on customers, subscriptions, documents, and email campaigns
2. **Advanced Search** - Save and reuse complex search filters with full-text search and multiple criteria

---

## Batch Operations API

Batch operations allow admins to process multiple records in a single request, dramatically reducing API calls and improving efficiency.

### 1. Bulk Create Customers

**Endpoint:** `POST /api/admin/batch/customers/create`

**Description:** Create multiple customers at once from an array of customer data.

**Request:**
```json
{
  "customers": [
    {
      "userId": "user-id-1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "status": "active",
      "emergencyContactName": "Jane Doe",
      "emergencyContactPhone": "+1234567890"
    },
    {
      "userId": "user-id-2",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "status": "active",
      "emergencyContactName": "John Smith",
      "emergencyContactPhone": "+0987654321"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "created": 2,
  "customers": [
    { "id": "cust-1", "userId": "user-id-1", ... },
    { "id": "cust-2", "userId": "user-id-2", ... }
  ]
}
```

---

### 2. Bulk Update Subscription Status

**Endpoint:** `POST /api/admin/batch/subscriptions/update-status`

**Description:** Change status of multiple subscriptions at once (renew, cancel, activate, etc.).

**Request:**
```json
{
  "subscriptionIds": ["sub-1", "sub-2", "sub-3"],
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "updated": 3,
  "message": "3 subscriptions updated to active"
}
```

**Status Options:**
- `active` - Subscription is active and billing
- `inactive` - Subscription paused
- `cancelled` - Subscription cancelled
- `pending` - Awaiting payment
- `trial` - Trial period active

---

### 3. Bulk Delete Documents

**Endpoint:** `POST /api/admin/batch/documents/delete`

**Description:** Delete multiple documents and their version history in a single request.

**Request:**
```json
{
  "documentIds": ["doc-1", "doc-2", "doc-3"]
}
```

**Response:**
```json
{
  "success": true,
  "deleted": 3,
  "message": "3 documents deleted"
}
```

---

### 4. Bulk Add Customer Tags

**Endpoint:** `POST /api/admin/batch/customers/tags/add`

**Description:** Add one or more tags to multiple customers at once (useful for segmentation and targeting).

**Request:**
```json
{
  "customerIds": ["cust-1", "cust-2", "cust-3"],
  "tags": ["vip", "renewal-reminder", "enterprise"]
}
```

**Response:**
```json
{
  "success": true,
  "added": 9,
  "message": "Added 3 tag(s) to 3 customer(s)"
}
```

**Common Tags:**
- `vip` - High-value customer
- `renewal-reminder` - Send renewal email
- `enterprise` - Enterprise customer
- `at-risk` - Customer at risk of churn
- `new` - Newly acquired customer

---

### 5. Bulk Email Campaign

**Endpoint:** `POST /api/admin/batch/email-campaign`

**Description:** Send an email campaign to a customer segment.

**Request:**
```json
{
  "customerIds": ["cust-1", "cust-2", "cust-3"],
  "templateId": "template-renewal-reminder",
  "subject": "Your subscription renews in 30 days",
  "body": "Dear Customer, your ALWR subscription will renew on {{renewalDate}}. Click here to manage your account."
}
```

**Response:**
```json
{
  "success": true,
  "queued": 3,
  "message": "3 emails queued for delivery"
}
```

---

## Advanced Search API

Advanced search allows admins to save complex search filters for reuse, making it easier to find specific customer segments.

### 1. Perform Advanced Search

**Endpoint:** `GET /api/admin/search/advanced`

**Query Parameters:**
- `filters` (JSON) - Filter criteria
- `keywords` - Search text (searches name and email)
- `sortBy` - Field to sort by (default: `createdAt`)
- `sortOrder` - `asc` or `desc` (default: `desc`)
- `limit` - Results per page (default: 50, max: 500)
- `offset` - Pagination offset (default: 0)

**Example Request:**
```
GET /api/admin/search/advanced?filters={"status":"active"}&keywords=john&sortBy=createdAt&sortOrder=desc&limit=25
```

**Supported Filters:**
- `status` - Customer status (active, expired, etc.)
- `createdAfter` - ISO date string (e.g., "2025-01-01")
- `createdBefore` - ISO date string (e.g., "2025-12-31")

**Response:**
```json
{
  "success": true,
  "total": 5,
  "limit": 25,
  "offset": 0,
  "results": [
    {
      "id": "cust-1",
      "firstName": "John",
      "lastName": "Smith",
      "email": "john.smith@example.com",
      "status": "active",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

### 2. Save a Search

**Endpoint:** `POST /api/admin/search/saved`

**Description:** Save a search filter for quick access later.

**Request:**
```json
{
  "name": "Active Enterprise Customers",
  "description": "All active customers created in the last 90 days",
  "filters": {
    "status": "active",
    "createdAfter": "2025-08-26"
  },
  "keywords": "enterprise",
  "sortBy": "createdAt",
  "sortOrder": "desc"
}
```

**Response:**
```json
{
  "success": true,
  "saved": {
    "id": "search-123",
    "userId": "user-id",
    "name": "Active Enterprise Customers",
    "description": "All active customers created in the last 90 days",
    "filters": { ... },
    "createdAt": "2025-11-24T07:40:00Z"
  },
  "message": "Search saved successfully"
}
```

---

### 3. List Saved Searches

**Endpoint:** `GET /api/admin/search/saved`

**Description:** Get all saved searches for the current user.

**Response:**
```json
{
  "success": true,
  "total": 3,
  "searches": [
    {
      "id": "search-123",
      "name": "Active Enterprise Customers",
      "description": "All active customers created in the last 90 days",
      "createdAt": "2025-11-24T07:40:00Z"
    },
    {
      "id": "search-124",
      "name": "Expired Subscriptions",
      "description": "Customers with expired subscriptions",
      "createdAt": "2025-11-23T10:15:00Z"
    }
  ]
}
```

---

### 4. Get Specific Saved Search

**Endpoint:** `GET /api/admin/search/saved/:id`

**Description:** Retrieve a specific saved search by ID.

**Response:**
```json
{
  "success": true,
  "search": {
    "id": "search-123",
    "name": "Active Enterprise Customers",
    "filters": { "status": "active", "createdAfter": "2025-08-26" },
    "keywords": "enterprise",
    "sortBy": "createdAt",
    "sortOrder": "desc"
  }
}
```

---

### 5. Update Saved Search

**Endpoint:** `PATCH /api/admin/search/saved/:id`

**Description:** Modify an existing saved search.

**Request:**
```json
{
  "name": "Active Enterprise Customers (Updated)",
  "filters": { "status": "active", "createdAfter": "2025-09-01" }
}
```

**Response:**
```json
{
  "success": true,
  "updated": {
    "id": "search-123",
    "name": "Active Enterprise Customers (Updated)",
    "filters": { ... }
  }
}
```

---

### 6. Delete Saved Search

**Endpoint:** `DELETE /api/admin/search/saved/:id`

**Description:** Remove a saved search.

**Response:**
```json
{
  "success": true,
  "message": "Saved search deleted"
}
```

---

## Usage Examples

### Example 1: Bulk Email Renewal Campaign

Send renewal reminder emails to all active customers created in the last 30 days:

```bash
# Step 1: Search for target customers
curl -X GET "https://api.alwr.com/api/admin/search/advanced?filters={\"status\":\"active\",\"createdAfter\":\"2025-10-25\"}&sortBy=createdAt"

# Step 2: Send bulk email campaign
curl -X POST "https://api.alwr.com/api/admin/batch/email-campaign" \
  -H "Content-Type: application/json" \
  -d '{
    "customerIds": ["cust-1", "cust-2", "cust-3"],
    "templateId": "renewal-reminder",
    "subject": "Your subscription renews in 30 days",
    "body": "Dear valued customer..."
  }'
```

### Example 2: Bulk Customer Import

Import new customers from a partner referral program:

```bash
curl -X POST "https://api.alwr.com/api/admin/batch/customers/create" \
  -H "Content-Type: application/json" \
  -d '{
    "customers": [
      {
        "userId": "partner-ref-1",
        "firstName": "Partner",
        "lastName": "Customer 1",
        "email": "partner1@example.com",
        "status": "active"
      },
      {
        "userId": "partner-ref-2",
        "firstName": "Partner",
        "lastName": "Customer 2",
        "email": "partner2@example.com",
        "status": "active"
      }
    ]
  }'
```

### Example 3: Save Search for VIP Customers

Create a saved search for easy access to VIP customers:

```bash
curl -X POST "https://api.alwr.com/api/admin/search/saved" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "VIP Customers",
    "description": "All customers tagged as VIP with active subscriptions",
    "filters": { "status": "active" },
    "keywords": "vip",
    "sortBy": "createdAt",
    "sortOrder": "desc"
  }'
```

---

## Performance Benefits

| Feature | Benefit |
|---------|---------|
| Bulk Create Customers | 100 customers in 1 request instead of 100 requests |
| Bulk Update Subscriptions | Renew 500+ subscriptions instantly |
| Bulk Delete Documents | Remove all old docs in 1 request |
| Add Customer Tags | Segment 1000+ customers in seconds |
| Email Campaigns | Queue 10,000+ emails for delivery |
| Saved Searches | Reuse complex filters instantly |

---

## Security Notes

- All batch and search endpoints require `admin` role authentication
- Admin IP whitelisting applies (ADMIN_IPS environment variable)
- All actions are audit logged with timestamps and actor information
- Batch operations are atomic - either all succeed or all fail
- Saved searches are scoped to the user who created them

---

## Database Schema

### saved_searches table

```sql
CREATE TABLE saved_searches (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  name VARCHAR NOT NULL,
  description TEXT,
  filters JSONB NOT NULL,
  keywords TEXT,
  sort_by VARCHAR DEFAULT 'createdAt',
  sort_order VARCHAR DEFAULT 'desc',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_saved_search_user_id (user_id),
  INDEX idx_saved_search_created_at (created_at)
);
```

---

## Future Enhancements

Potential improvements:
- Full-text search on document content (PostgreSQL FTS)
- Scheduled batch operations (e.g., daily renewal reminders)
- Advanced filter UI builder in WordPress admin
- Search result export (CSV, JSON, PDF)
- Batch operation templates for common workflows
- Webhook notifications when batch operations complete
