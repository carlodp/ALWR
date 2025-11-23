# Components Directory Structure

This directory contains reusable React components organized by type and purpose.

## Folder Structure

- **ui/** - Base shadcn/ui components (buttons, inputs, dialogs, etc.)
- **shared/** - Shared layout components used across pages (sidebar, header, theme provider)
- **cards/** - Card-based components (metric cards, status badges, loading states)
- **forms/** - Form-related components and utilities
- **dialogs/** - Modal dialog components
- **layouts/** - Layout wrapper components
- **inputs/** - Custom input component variants

## File Naming Convention

- Use kebab-case for file names
- Keep names short and descriptive
- Examples: `sidebar.tsx`, `metric.tsx`, `confirmation.tsx`

## Component Organization Best Practices

- Keep components small and focused
- Use TypeScript interfaces for props
- Add JSDoc comments for public APIs
- Export components as default from their files
- Group related components in the same folder
