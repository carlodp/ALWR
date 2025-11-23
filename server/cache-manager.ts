/**
 * Cache Manager
 * 
 * Manages cache invalidation strategies based on data mutations.
 * Ensures cache stays in sync with database.
 */

import { cache, cacheKeys } from './cache';

export class CacheManager {
  /**
   * Invalidate customer-related caches
   */
  static invalidateCustomer(customerId: string) {
    cache.delete(cacheKeys.customer(customerId));
    cache.delete(cacheKeys.customersList());
    console.log(`📍 Invalidated customer cache: ${customerId}`);
  }

  /**
   * Invalidate all customer caches
   */
  static invalidateAllCustomers() {
    cache.deletePattern('customer:*');
    cache.delete(cacheKeys.customersList());
    console.log('📍 Invalidated all customer caches');
  }

  /**
   * Invalidate customer documents
   */
  static invalidateCustomerDocuments(customerId: string) {
    cache.delete(cacheKeys.documents(customerId));
    cache.deletePattern(`documents:${customerId}:*`);
    console.log(`📍 Invalidated document cache for customer: ${customerId}`);
  }

  /**
   * Invalidate subscription caches
   */
  static invalidateSubscription(customerId: string) {
    cache.delete(cacheKeys.subscription(customerId));
    cache.delete(cacheKeys.subscriptionsList());
    cache.deletePattern('subscriptions:status:*');
    console.log(`📍 Invalidated subscription cache: ${customerId}`);
  }

  /**
   * Invalidate all subscription caches
   */
  static invalidateAllSubscriptions() {
    cache.deletePattern('subscription:*');
    cache.delete(cacheKeys.subscriptionsList());
    cache.deletePattern('subscriptions:status:*');
    console.log('📍 Invalidated all subscription caches');
  }

  /**
   * Invalidate user caches
   */
  static invalidateUser(userId: string) {
    cache.delete(cacheKeys.user(userId));
    cache.delete(cacheKeys.usersList());
    console.log(`📍 Invalidated user cache: ${userId}`);
  }

  /**
   * Invalidate all user caches
   */
  static invalidateAllUsers() {
    cache.deletePattern('user:*');
    cache.delete(cacheKeys.usersList());
    cache.deletePattern('users:role:*');
    console.log('📍 Invalidated all user caches');
  }

  /**
   * Invalidate admin dashboard caches
   */
  static invalidateAdminDashboard() {
    cache.delete(cacheKeys.adminStats());
    cache.delete(cacheKeys.adminRecentActivity());
    cache.delete(cacheKeys.adminCustomerMetrics());
    console.log('📍 Invalidated admin dashboard caches');
  }

  /**
   * Invalidate emergency access caches
   * Note: Emergency records are read-only, rarely invalidated
   */
  static invalidateEmergencyRecord(recordId: string) {
    cache.delete(cacheKeys.emergencyRecord(recordId));
    console.log(`📍 Invalidated emergency record cache: ${recordId}`);
  }

  /**
   * Invalidate audit log caches
   */
  static invalidateAuditLogs(userId?: string) {
    if (userId) {
      cache.delete(cacheKeys.auditLogs(userId));
    } else {
      cache.deletePattern('audit_logs:*');
    }
    console.log(`📍 Invalidated audit log cache${userId ? ' for user: ' + userId : ''}`);
  }

  /**
   * Invalidate agent caches
   */
  static invalidateAgent(agentId: string) {
    cache.delete(cacheKeys.agent(agentId));
    cache.delete(cacheKeys.agentsList());
    cache.delete(cacheKeys.agentCustomerAssignments(agentId));
    console.log(`📍 Invalidated agent cache: ${agentId}`);
  }

  /**
   * Invalidate all agent caches
   */
  static invalidateAllAgents() {
    cache.deletePattern('agent:*');
    cache.delete(cacheKeys.agentsList());
    cache.deletePattern('agent_assignments:*');
    console.log('📍 Invalidated all agent caches');
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    return cache.getStats();
  }

  /**
   * Clear entire cache (use sparingly)
   */
  static clearAll() {
    cache.clear();
    console.log('🧹 Cleared entire cache');
  }

  /**
   * Cleanup expired entries
   */
  static cleanup() {
    const count = cache.cleanup();
    console.log(`🧹 Cache cleanup: removed ${count} expired entries`);
    return count;
  }
}

export default CacheManager;
