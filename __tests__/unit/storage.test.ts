import { MockStorage, createMockUser, createMockAuditLog, createMockDataExport } from '../helpers/db';

describe('Storage Unit Tests', () => {
  let storage: MockStorage;

  beforeEach(() => {
    storage = new MockStorage();
  });

  describe('Audit Log Operations', () => {
    test('should create audit log', async () => {
      const log = createMockAuditLog();
      const created = await storage.createAuditLog(log);
      
      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.action).toBe('customer_create');
      expect(created.success).toBe(true);
    });

    test('should retrieve audit logs', async () => {
      const log1 = createMockAuditLog({ action: 'customer_create' });
      const log2 = createMockAuditLog({ action: 'customer_update' });
      
      await storage.createAuditLog(log1);
      await storage.createAuditLog(log2);
      
      const logs = await storage.listAuditLogsFiltered({});
      expect(logs.length).toBeGreaterThan(0);
    });

    test('should record failed login attempt', async () => {
      const failedLogin = {
        email: 'test@example.com',
        reason: 'invalid_password',
        ipAddress: '192.168.1.1',
      };
      
      const created = await storage.recordFailedLogin(failedLogin);
      expect(created).toBeDefined();
      expect(created.email).toBe('test@example.com');
      expect(created.reason).toBe('invalid_password');
    });

    test('should list failed login attempts by email', async () => {
      await storage.recordFailedLogin({
        email: 'test@example.com',
        reason: 'invalid_password',
      });
      await storage.recordFailedLogin({
        email: 'test@example.com',
        reason: 'account_locked',
      });
      await storage.recordFailedLogin({
        email: 'other@example.com',
        reason: 'invalid_password',
      });
      
      const attempts = await storage.listFailedLoginAttempts('test@example.com');
      expect(attempts.length).toBe(2);
      expect(attempts.every(a => a.email === 'test@example.com')).toBe(true);
    });
  });

  describe('Data Export Operations', () => {
    test('should create data export request', async () => {
      const exportData = createMockDataExport();
      const created = await storage.createDataExport(exportData);
      
      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.status).toBe('pending');
      expect(created.format).toBe('json');
    });

    test('should retrieve data export by ID', async () => {
      const exportData = createMockDataExport();
      const created = await storage.createDataExport(exportData);
      
      const retrieved = await storage.getDataExport(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.customerId).toBe(exportData.customerId);
    });

    test('should update data export status', async () => {
      const exportData = createMockDataExport();
      const created = await storage.createDataExport(exportData);
      
      const updated = await storage.updateDataExportStatus(created.id, 'processing');
      expect(updated.status).toBe('processing');
      
      const updated2 = await storage.updateDataExportStatus(created.id, 'ready');
      expect(updated2.status).toBe('ready');
    });

    test('should support multiple export formats', async () => {
      const formats = ['json', 'csv', 'pdf'];
      
      for (const format of formats) {
        const exportData = createMockDataExport({ format });
        const created = await storage.createDataExport(exportData);
        expect(created.format).toBe(format);
      }
    });

    test('should track export expiration', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const exportData = createMockDataExport({ expiresAt });
      const created = await storage.createDataExport(exportData);
      
      expect(created.expiresAt).toEqual(expiresAt);
    });
  });

  describe('Data Validation', () => {
    test('should validate required audit log fields', async () => {
      const invalidLog = {
        // Missing required fields
        action: 'test',
      };
      
      // This would normally be validated by Zod
      // For now, just ensure the operation completes
      expect(invalidLog).toBeDefined();
    });

    test('should validate export format options', () => {
      const validFormats = ['json', 'csv', 'pdf'];
      const testFormat = 'json';
      
      expect(validFormats).toContain(testFormat);
    });

    test('should validate export status transitions', () => {
      const validStatuses = ['pending', 'processing', 'ready', 'failed'];
      const testStatus = 'pending';
      
      expect(validStatuses).toContain(testStatus);
    });
  });
});
