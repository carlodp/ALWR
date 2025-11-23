# Pages Directory Structure

This directory contains all page-level components organized by feature area.

## Folder Structure

- **auth/** - Authentication related pages (login, signup, password reset, profile setup)
- **customer/** - Customer-facing pages (dashboard, documents, subscription, payments, activity log, help)
- **admin/** - Admin portal pages (user management, reporting, subscriptions, system settings)
- **shared/** - Shared pages used across the app (404 page, emergency access, global search)

## File Naming Convention

- Use kebab-case (lowercase with hyphens) for file names
- No prefixes needed since files are organized by folder
- Example: `pages/customer/dashboard.tsx`, `pages/admin/users.tsx`

## Adding New Pages

1. Create the component in the appropriate folder (auth, customer, admin, or shared)
2. Add the page import to `client/src/App.tsx` in the corresponding section
3. Add the route to the Router function in `client/src/App.tsx`
4. Update sidebar navigation if needed in `client/src/components/shared/sidebar.tsx`
