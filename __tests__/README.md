# ALWR API Testing Suite

Comprehensive automated testing suite for the America Living Will Registry API.

## Overview

This testing suite includes:
- **Unit Tests**: Test individual functions and storage operations
- **Integration Tests**: Test complete API workflows
- **Helpers**: Mock data and utilities for testing
- **Coverage Reports**: Track code coverage across the codebase

## Setup

Testing dependencies are already installed:
```bash
npm install --save-dev jest @types/jest supertest @types/supertest
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (re-run on changes)
```bash
npm test -- --watch
```

### Run specific test file
```bash
npm test -- __tests__/unit/storage.test.ts
npm test -- __tests__/integration/api.test.ts
```

### Run tests with coverage report
```bash
npm test -- --coverage
```

### Run tests matching a pattern
```bash
npm test -- --testNamePattern="Audit Log"
npm test -- --testNamePattern="Data Export"
```

### Run only failed tests
```bash
npm test -- --onlyChanged
```

## Test Structure

```
__tests__/
├── unit/               # Unit tests for isolated functions
│   └── storage.test.ts
├── integration/        # Integration tests for API endpoints
│   └── api.test.ts
├── helpers/           # Test utilities and mock data
│   └── db.ts
└── README.md          # This file
```

## Unit Tests (`__tests__/unit/storage.test.ts`)

Tests for individual storage operations:

```typescript
// Storage operations
✓ should create audit log
✓ should retrieve audit logs
✓ should record failed login attempt
✓ should list failed login attempts by email

// Data export operations
✓ should create data export request
✓ should retrieve data export by ID
✓ should update data export status
✓ should support multiple export formats
✓ should track export expiration

// Data validation
✓ should validate required audit log fields
✓ should validate export format options
✓ should validate export status transitions
```

**Run unit tests:**
```bash
npm test -- __tests__/unit
```

## Integration Tests (`__tests__/integration/api.test.ts`)

Tests for end-to-end API workflows:

```typescript
// Authentication
✓ should handle login request
✓ should handle logout request
✓ should track failed login attempts

// Audit Logs
✓ should retrieve audit logs with filtering
✓ should support date range filtering
✓ should support pagination

// Data Export
✓ should create data export request
✓ should check export status
✓ should support all export formats

// Error Handling
✓ should handle 404 not found
✓ should handle 401 unauthorized
✓ should handle validation errors
✓ should handle rate limiting

// Performance
✓ should handle bulk operations
✓ should handle concurrent requests
```

**Run integration tests:**
```bash
npm test -- __tests__/integration
```

## Test Helpers (`__tests__/helpers/db.ts`)

Utility functions for creating mock data:

```typescript
// Mock storage for testing
const storage = new MockStorage();

// Create test data
const user = createMockUser();
const customer = createMockCustomer();
const auditLog = createMockAuditLog();
const dataExport = createMockDataExport();

// Reset storage between tests
storage.clear();
```

## Example Test Patterns

### Testing Audit Log Creation
```typescript
test('should create audit log', async () => {
  const log = createMockAuditLog({ action: 'customer_create' });
  const created = await storage.createAuditLog(log);
  
  expect(created.id).toBeDefined();
  expect(created.action).toBe('customer_create');
});
```

### Testing Data Export Workflow
```typescript
test('should complete data export workflow', async () => {
  // Create export
  const exportData = createMockDataExport();
  const created = await storage.createDataExport(exportData);
  
  // Update status
  await storage.updateDataExportStatus(created.id, 'processing');
  
  // Verify final status
  const final = await storage.updateDataExportStatus(created.id, 'ready');
  expect(final.status).toBe('ready');
});
```

### Testing Error Scenarios
```typescript
test('should handle invalid export format', () => {
  const invalidFormat = 'xml'; // Not supported
  const validFormats = ['json', 'csv', 'pdf'];
  
  expect(validFormats).not.toContain(invalidFormat);
});
```

## Coverage Goals

Target coverage metrics:
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

Check current coverage:
```bash
npm test -- --coverage
```

Coverage reports are generated in `coverage/` directory.

## Debugging Tests

### Run single test with verbose output
```bash
npm test -- __tests__/unit/storage.test.ts --verbose
```

### Run test in debug mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand __tests__/unit/storage.test.ts
```

### View test output in real-time
```bash
npm test -- --verbose --no-coverage
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run tests
  run: npm test -- --coverage
  
- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Best Practices

1. **Keep tests focused**: One assertion per test when possible
2. **Use descriptive names**: Test names should explain what they test
3. **Clean up after tests**: Use `beforeEach` and `afterEach` for setup/teardown
4. **Mock external dependencies**: Don't make real API calls in tests
5. **Test edge cases**: Invalid inputs, boundary conditions, error states
6. **Maintain test data**: Keep mock data realistic and comprehensive

## Adding New Tests

1. Create new test file in appropriate directory:
   - `__tests__/unit/*.test.ts` for unit tests
   - `__tests__/integration/*.test.ts` for integration tests

2. Use test template:
```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup test data
  });

  test('should do something', async () => {
    // Arrange
    const input = createMockData();
    
    // Act
    const result = await action(input);
    
    // Assert
    expect(result).toBeDefined();
  });
});
```

3. Run tests to verify:
```bash
npm test -- __tests__/path/to/new.test.ts
```

## Troubleshooting

### Tests failing due to database connection
Ensure `DATABASE_URL` environment variable is set correctly in development.

### Tests timing out
Increase timeout in `jest.config.js`:
```javascript
testTimeout: 20000 // 20 seconds
```

### Import errors
Ensure module aliases match `jest.config.js`:
```javascript
moduleNameMapper: {
  '^@shared/(.*)$': '<rootDir>/shared/$1',
  '^@server/(.*)$': '<rootDir>/server/$1',
}
```

## Next Steps

1. **Expand coverage**: Add tests for remaining endpoints
2. **Performance tests**: Add benchmarks for critical paths
3. **Security tests**: Add tests for authentication and authorization
4. **Load tests**: Test API under high concurrent load
5. **E2E tests**: Add browser-based end-to-end tests with Cypress or Playwright

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Library](https://testing-library.com/)
- [Node.js Testing Guide](https://nodejs.org/en/docs/guides/testing/)

## Support

For issues or questions about the testing suite:
1. Check test output for specific error messages
2. Review test helpers and mock data
3. Consult Jest documentation
4. Run tests with verbose flag for detailed output

---

**Last Updated**: November 23, 2025  
**Version**: 1.0.0
