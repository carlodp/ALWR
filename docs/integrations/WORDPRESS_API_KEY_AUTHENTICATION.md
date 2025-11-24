# WordPress Integration - API Key Authentication

This document describes how to set up and use API key authentication to connect WordPress to the ALWR backend API.

---

## Overview

API keys provide secure, stateless authentication for external applications (like WordPress) to call your ALWR API without storing passwords. Each key:

- ✅ Has fine-grained permissions (read, write, admin access)
- ✅ Can be revoked instantly
- ✅ Has usage tracking and analytics
- ✅ Can expire automatically
- ✅ Is never displayed after creation (show only once)

---

## Generating an API Key

### Step 1: Log in to ALWR Admin

1. Navigate to `https://your-alwr-domain.com/login`
2. Log in with your admin credentials (email/password + 2FA)
3. Go to Admin Settings → API Keys

### Step 2: Create a New Key

**Endpoint:** `POST /api/admin/apikeys/create`

**Request:**
```json
{
  "name": "WordPress Main Site",
  "description": "Main WordPress integration for customer portal",
  "permissions": ["read:customers", "read:documents", "write:subscriptions"],
  "expiresIn": 365
}
```

**Parameters:**
- `name` (string, required) - Friendly name for the key (e.g., "WordPress Staging")
- `description` (string, optional) - What this key is used for
- `permissions` (array, required) - See [Available Permissions](#available-permissions) below
- `expiresIn` (number, optional) - Days until key expires (null = never expires)

**Response:**
```json
{
  "success": true,
  "message": "API key created. Save the key below - you won't see it again!",
  "apiKey": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "key": "ALWR_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "masked": "ALWR_..p6",
    "name": "WordPress Main Site",
    "description": "Main WordPress integration for customer portal",
    "permissions": ["read:customers", "read:documents", "write:subscriptions"],
    "expiresAt": "2026-11-24T00:00:00Z",
    "createdAt": "2025-11-24T07:40:00Z"
  }
}
```

⚠️ **Important:** Save the `key` value immediately. You won't see it again. If you lose it, revoke this key and create a new one.

---

## Available Permissions

API keys support fine-grained permissions:

### Read Permissions
- `read:customers` - View customer profiles and data
- `read:documents` - View customer documents
- `read:subscriptions` - View subscription information
- `read:reports` - Access reporting and analytics

### Write Permissions
- `write:customers` - Create and update customer records
- `write:documents` - Upload and manage documents
- `write:subscriptions` - Create and modify subscriptions

### Admin Permissions
- `admin:access` - Full admin access (use sparingly)

### Webhook Permissions
- `webhooks:receive` - Receive webhook events
- `webhooks:manage` - Manage webhook subscriptions

**Recommended Permissions for WordPress:**
```json
["read:customers", "read:documents", "read:subscriptions", "write:subscriptions"]
```

---

## Using API Keys in WordPress

### Step 1: Store the Key Securely

In WordPress (e.g., in a plugin or theme):

```php
// Store in WordPress options or config
define('ALWR_API_KEY', 'ALWR_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6');
define('ALWR_API_BASE', 'https://your-alwr-domain.com/api');
```

Or use WordPress options table:
```php
update_option('alwr_api_key', 'ALWR_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6');
```

### Step 2: Make API Requests

**PHP Example:**
```php
<?php
$api_key = get_option('alwr_api_key');
$endpoint = 'https://your-alwr-domain.com/api/admin/customers';

$response = wp_remote_get($endpoint, [
    'headers' => [
        'Authorization' => 'Bearer ' . $api_key,
        'Content-Type' => 'application/json',
    ],
]);

if (is_wp_error($response)) {
    error_log('ALWR API Error: ' . $response->get_error_message());
    return;
}

$body = json_decode(wp_remote_retrieve_body($response), true);
if ($body['success']) {
    // Handle customer data
    foreach ($body['results'] as $customer) {
        echo $customer['firstName'] . ' ' . $customer['lastName'];
    }
}
?>
```

**JavaScript/Fetch Example:**
```javascript
const apiKey = 'ALWR_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
const endpoint = 'https://your-alwr-domain.com/api/admin/customers';

fetch(endpoint, {
    headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
    },
})
.then(response => response.json())
.then(data => {
    if (data.success) {
        console.log('Customers:', data.results);
    }
})
.catch(error => console.error('API Error:', error));
```

---

## API Key Management

### List Your API Keys

**Endpoint:** `GET /api/admin/apikeys`

**Response:**
```json
{
  "success": true,
  "total": 2,
  "apiKeys": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "WordPress Main Site",
      "description": "Main WordPress integration",
      "masked": "ALWR_..p6",
      "permissions": ["read:customers", "read:documents", "write:subscriptions"],
      "createdAt": "2025-11-24T07:40:00Z",
      "lastUsedAt": "2025-11-24T10:30:00Z",
      "usageCount": 542,
      "isRevoked": false,
      "expiresAt": "2026-11-24T00:00:00Z",
      "expiresIn": 365
    }
  ]
}
```

### Revoke an API Key

**Endpoint:** `DELETE /api/admin/apikeys/:id`

**Response:**
```json
{
  "success": true,
  "message": "API key revoked successfully",
  "revokedKey": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "WordPress Main Site",
    "revokedAt": "2025-11-24T11:00:00Z"
  }
}
```

---

## Available Endpoints for WordPress

With appropriate API key permissions, WordPress can access these endpoints:

### Customer Management
- `GET /api/admin/customers` - List customers
- `GET /api/admin/customers/:id` - Get customer details
- `POST /api/admin/batch/customers/create` - Bulk create customers
- `POST /api/admin/batch/customers/tags/add` - Add tags to customers

### Documents
- `GET /api/customers/:id/documents` - List customer documents
- `POST /api/customers/:id/documents` - Upload document
- `DELETE /api/documents/:id` - Delete document

### Subscriptions
- `GET /api/subscriptions/:customerId` - Get subscription
- `POST /api/subscriptions` - Create subscription
- `PATCH /api/subscriptions/:id` - Update subscription
- `POST /api/admin/batch/subscriptions/update-status` - Bulk update subscriptions

### Search
- `GET /api/admin/search/advanced` - Advanced search with filters
- `POST /api/admin/search/saved` - Save search
- `GET /api/admin/search/saved` - List saved searches

### Batch Operations
- `POST /api/admin/batch/customers/create` - Bulk create
- `POST /api/admin/batch/subscriptions/update-status` - Bulk update
- `POST /api/admin/batch/email-campaign` - Send emails

---

## Security Best Practices

### ✅ DO:
- Store API keys in secure configuration files (not in version control)
- Use environment variables for API keys
- Rotate keys periodically (create new, revoke old)
- Use minimal permissions required (principle of least privilege)
- Monitor usage statistics for unusual activity
- Set expiration dates on keys
- Log all API calls for audit trail

### ❌ DON'T:
- Commit API keys to Git repositories
- Share API keys via email or chat
- Use the same key for multiple environments
- Grant `admin:access` unless absolutely necessary
- Store keys in WordPress database without encryption
- Hardcode keys in plugin/theme files

---

## Troubleshooting

### "Invalid API key" Error

**Possible causes:**
1. Key is not prefixed with `ALWR_`
2. Key has been revoked
3. Key has expired
4. Header format is incorrect

**Solution:**
```
Authorization: Bearer ALWR_xxxxxxxxxxxxx  ✅ Correct
Authorization: ALWR_xxxxxxxxxxxxx         ❌ Wrong
Authorization: Bearer xxxxxxxxxxxxx       ❌ Missing prefix
```

### "API key has insufficient permissions" Error

**Solution:** Check permissions granted to key. Create a new key with required permissions:

```json
{
  "name": "WordPress Updated",
  "permissions": ["read:customers", "write:subscriptions"],
  "expiresIn": 365
}
```

### "API key is expired" Error

**Solution:** Create a new API key with updated expiration date.

### Authentication Fails in WordPress

**Debug checklist:**
```php
// 1. Verify API key is correct
echo 'Key: ' . get_option('alwr_api_key');

// 2. Test connectivity
$response = wp_remote_head('https://your-alwr-domain.com/api/auth/user', [
    'headers' => [
        'Authorization' => 'Bearer ' . get_option('alwr_api_key'),
    ],
]);
echo 'Status: ' . wp_remote_retrieve_response_code($response);

// 3. Check full response
echo json_encode(wp_remote_retrieve_body($response), JSON_PRETTY_PRINT);
```

---

## Example: WordPress Plugin Integration

Here's a basic WordPress plugin that uses ALWR API authentication:

```php
<?php
/**
 * Plugin Name: ALWR Customer Portal
 * Plugin URI: https://your-alwr-domain.com
 * Description: Integrate ALWR living will registry with WordPress
 * Version: 1.0
 */

class ALWR_Integration {
    private $api_key;
    private $api_base;

    public function __construct() {
        $this->api_key = get_option('alwr_api_key');
        $this->api_base = get_option('alwr_api_base', 'https://your-alwr-domain.com/api');

        // Admin menu
        add_action('admin_menu', [$this, 'add_admin_menu']);
        // AJAX endpoints
        add_action('wp_ajax_alwr_get_customers', [$this, 'ajax_get_customers']);
    }

    public function add_admin_menu() {
        add_menu_page(
            'ALWR Settings',
            'ALWR',
            'manage_options',
            'alwr-settings',
            [$this, 'render_settings'],
            'dashicons-heart'
        );
    }

    public function render_settings() {
        if (isset($_POST['alwr_api_key'])) {
            update_option('alwr_api_key', sanitize_text_field($_POST['alwr_api_key']));
            echo '<div class="notice notice-success"><p>API key saved!</p></div>';
        }
        ?>
        <div class="wrap">
            <h1>ALWR Settings</h1>
            <form method="post">
                <table class="form-table">
                    <tr>
                        <th><label for="alwr_api_key">API Key</label></th>
                        <td>
                            <input type="password" id="alwr_api_key" name="alwr_api_key"
                                   value="<?php echo esc_attr(get_option('alwr_api_key')); ?>"
                                   class="regular-text">
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }

    public function ajax_get_customers() {
        $response = wp_remote_get("{$this->api_base}/admin/customers", [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->api_key,
            ],
        ]);

        if (is_wp_error($response)) {
            wp_send_json_error(['message' => $response->get_error_message()]);
        }

        $data = json_decode(wp_remote_retrieve_body($response), true);
        wp_send_json_success($data);
    }
}

new ALWR_Integration();
```

---

## Audit Logging

All API key activity is logged in ALWR for security and compliance:

- ✅ API key creation/revocation
- ✅ Authentication attempts (success/failure)
- ✅ Permission denials
- ✅ Usage tracking (last used, usage count)
- ✅ Key expiration

View audit logs in: `/api/admin/audit-logs`

---

## Support & Documentation

- **API Documentation:** `/api/docs` (interactive Swagger UI)
- **API Specification:** `/api/docs.json`
- **GitHub Issues:** Report problems here
- **Email Support:** support@your-alwr-domain.com

---

## Summary

1. **Generate** an API key in ALWR Admin Settings
2. **Store** it securely in WordPress
3. **Use** it in request headers: `Authorization: Bearer ALWR_xxxxx`
4. **Monitor** usage and permissions
5. **Revoke** when no longer needed

Your WordPress integration is now ready to securely communicate with ALWR!
