import { DatabaseStorage } from '../../server/storage';

/**
 * Mock storage for testing purposes
 * Use this for unit tests that don't need actual database access
 */
export class MockStorage implements Partial<DatabaseStorage> {
  private data: Map<string, any> = new Map();

  async getUser(id: string) {
    return this.data.get(`user:${id}`);
  }

  async getUserByEmail(email: string) {
    return Array.from(this.data.values()).find(u => u.email === email);
  }

  async getCustomer(userId: string) {
    return this.data.get(`customer:${userId}`);
  }

  async createAuditLog(log: any) {
    const id = Math.random().toString(36).substring(7);
    const created = { id, ...log, createdAt: new Date() };
    this.data.set(`auditlog:${id}`, created);
    return created;
  }

  async listAuditLogsFiltered(filters: any) {
    return Array.from(this.data.values()).filter(
      v => v.type === 'auditlog'
    );
  }

  async recordFailedLogin(log: any) {
    const id = Math.random().toString(36).substring(7);
    const created = { id, ...log, createdAt: new Date() };
    this.data.set(`failedlogin:${id}`, created);
    return created;
  }

  async listFailedLoginAttempts(email: string) {
    return Array.from(this.data.values()).filter(
      v => v.type === 'failedlogin' && v.email === email
    );
  }

  async createDataExport(data: any) {
    const id = Math.random().toString(36).substring(7);
    const created = { id, ...data, createdAt: new Date() };
    this.data.set(`export:${id}`, created);
    return created;
  }

  async getDataExport(exportId: string) {
    return this.data.get(`export:${exportId}`);
  }

  async updateDataExportStatus(exportId: string, status: string) {
    const current = this.data.get(`export:${exportId}`);
    if (current) {
      const updated = { ...current, status };
      this.data.set(`export:${exportId}`, updated);
      return updated;
    }
  }

  // Reset data for tests
  clear() {
    this.data.clear();
  }
}

/**
 * Create a mock user for testing
 */
export function createMockUser(overrides?: Partial<any>) {
  return {
    id: Math.random().toString(36).substring(7),
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'customer',
    passwordHash: '$2b$10$mock',
    emailVerified: true,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock customer for testing
 */
export function createMockCustomer(overrides?: Partial<any>) {
  return {
    id: Math.random().toString(36).substring(7),
    userId: 'user123',
    phone: '555-0000',
    address: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
    accountStatus: 'active',
    idCardNumber: 'ID123456',
    emergencyContactName: 'Jane Doe',
    emergencyContactPhone: '555-0001',
    emergencyContactRelationship: 'Spouse',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock audit log for testing
 */
export function createMockAuditLog(overrides?: Partial<any>) {
  return {
    id: Math.random().toString(36).substring(7),
    userId: 'user123',
    actorName: 'Test User',
    actorRole: 'admin',
    action: 'customer_create',
    resourceType: 'customer',
    resourceId: 'cust123',
    success: true,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock data export for testing
 */
export function createMockDataExport(overrides?: Partial<any>) {
  return {
    id: Math.random().toString(36).substring(7),
    customerId: 'cust123',
    userId: 'user123',
    status: 'pending',
    format: 'json',
    includePersonalData: true,
    includeDocuments: true,
    includePaymentHistory: true,
    includeAuditLog: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    requestedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
