/**
 * Database Query Optimizer
 *
 * Utilities for optimizing database queries, detecting N+1 problems,
 * and providing query execution analysis.
 */

import { sql } from 'drizzle-orm';

interface QueryMetrics {
  query: string;
  duration: number;
  rowsAffected: number;
  timestamp: number;
  slow?: boolean;
}

interface SlowQueryConfig {
  thresholdMs: number;
  enabled: boolean;
}

// Query metrics tracking
const queryMetrics: QueryMetrics[] = [];
const slowQueryConfig: SlowQueryConfig = {
  thresholdMs: 100, // Log queries slower than 100ms
  enabled: true,
};

export class DBOptimizer {
  /**
   * Record a query's execution metrics
   */
  static recordQuery(query: string, duration: number, rowsAffected: number = 0) {
    const isSlow = duration > slowQueryConfig.thresholdMs;

    const metric: QueryMetrics = {
      query,
      duration,
      rowsAffected,
      timestamp: Date.now(),
      slow: isSlow,
    };

    queryMetrics.push(metric);

    // Keep only last 1000 metrics
    if (queryMetrics.length > 1000) {
      queryMetrics.shift();
    }

    if (isSlow && slowQueryConfig.enabled) {
      console.warn(`🐢 SLOW QUERY: ${duration}ms - ${query.substring(0, 80)}...`);
    }
  }

  /**
   * Get recent query metrics
   */
  static getMetrics(limit: number = 100) {
    const recent = queryMetrics.slice(-limit);

    const stats = {
      totalQueries: queryMetrics.length,
      recentQueries: limit,
      slowQueries: recent.filter((q) => q.slow).length,
      averageDuration: recent.reduce((sum, q) => sum + q.duration, 0) / recent.length || 0,
      slowestQueries: recent
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10)
        .map((q) => ({
          query: q.query,
          duration: q.duration,
          isSlow: q.slow,
        })),
      recentMetrics: recent.map((q) => ({
        query: q.query.substring(0, 100),
        duration: q.duration,
        timestamp: new Date(q.timestamp).toISOString(),
      })),
    };

    return stats;
  }

  /**
   * Configure slow query threshold
   */
  static setSlowQueryThreshold(thresholdMs: number) {
    slowQueryConfig.thresholdMs = thresholdMs;
  }

  /**
   * Enable/disable slow query logging
   */
  static setSlowQueryLogging(enabled: boolean) {
    slowQueryConfig.enabled = enabled;
  }

  /**
   * Clear metrics
   */
  static clearMetrics() {
    queryMetrics.length = 0;
  }

  /**
   * Detect potential N+1 queries
   * Returns queries that look similar (potential N+1 pattern)
   */
  static detectN1Queries() {
    const queryPatterns = new Map<string, number>();

    // Extract query pattern (remove WHERE values)
    for (const metric of queryMetrics.slice(-500)) {
      // Remove specific IDs to group similar queries
      const pattern = metric.query
        .replace(/WHERE "id" = \d+/g, 'WHERE "id" = ?')
        .replace(/WHERE "id" = '[^']*'/g, "WHERE \"id\" = ?")
        .replace(/LIMIT \d+/g, 'LIMIT ?');

      queryPatterns.set(pattern, (queryPatterns.get(pattern) || 0) + 1);
    }

    // Find patterns with high repetition (potential N+1)
    const suspiciousPatterns = Array.from(queryPatterns.entries())
      .filter(([, count]) => count > 10) // More than 10 times = suspicious
      .map(([pattern, count]) => ({
        pattern,
        occurrences: count,
        severity: count > 50 ? 'high' : count > 20 ? 'medium' : 'low',
      }))
      .sort((a, b) => b.occurrences - a.occurrences);

    return suspiciousPatterns;
  }

  /**
   * Get optimized query suggestions
   */
  static getOptimizationSuggestions() {
    const suggestions: string[] = [];
    const n1Queries = this.detectN1Queries();

    if (n1Queries.length > 0) {
      suggestions.push(`⚠️  Detected ${n1Queries.length} potential N+1 query patterns`);
      for (const query of n1Queries.slice(0, 3)) {
        suggestions.push(`   - ${query.pattern.substring(0, 60)}... (${query.occurrences}x)`);
      }
      suggestions.push('   💡 Consider: Use eager loading or batch queries');
    }

    const metrics = this.getMetrics(100);
    if (metrics.averageDuration > 50) {
      suggestions.push(`⚠️  Average query time is ${metrics.averageDuration.toFixed(2)}ms`);
      suggestions.push('   💡 Consider: Add indices on frequently queried columns');
    }

    if (metrics.slowQueries > 10) {
      suggestions.push(`⚠️  ${metrics.slowQueries} slow queries in recent batch`);
      suggestions.push('   💡 Consider: Review EXPLAIN ANALYZE on slow queries');
    }

    return {
      count: suggestions.length,
      suggestions,
      n1Patterns: n1Queries.length,
    };
  }
}

/**
 * SQL Migration Recommendations based on usage patterns
 */
export class SchemaOptimizer {
  /**
   * Recommended indices based on database schema
   */
  static getRecommendedIndices() {
    return {
      users: [
        'CREATE INDEX idx_users_email ON users(email)',
        'CREATE INDEX idx_users_status ON users(status)',
        'CREATE INDEX idx_users_role ON users(role)',
      ],
      customers: [
        'CREATE INDEX idx_customers_user_id ON customers(user_id)',
        'CREATE INDEX idx_customers_status ON customers(status)',
        'CREATE INDEX idx_customers_created_at ON customers(created_at)',
      ],
      documents: [
        'CREATE INDEX idx_documents_customer_id ON documents(customer_id)',
        'CREATE INDEX idx_documents_created_at ON documents(created_at)',
        'CREATE INDEX idx_documents_type ON documents(type)',
        'CREATE INDEX idx_documents_customer_created ON documents(customer_id, created_at)',
      ],
      subscriptions: [
        'CREATE INDEX idx_subscriptions_customer_id ON subscriptions(customer_id)',
        'CREATE INDEX idx_subscriptions_status ON subscriptions(status)',
        'CREATE INDEX idx_subscriptions_renewal_date ON subscriptions(renewal_date)',
        'CREATE INDEX idx_subscriptions_customer_status ON subscriptions(customer_id, status)',
      ],
      audit_logs: [
        'CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id)',
        'CREATE INDEX idx_audit_logs_action ON audit_logs(action)',
        'CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp)',
        'CREATE INDEX idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp)',
      ],
    };
  }

  /**
   * Get Drizzle schema index definitions
   */
  static getDrizzleIndices() {
    return {
      users: [
        'index("idx_users_email").on(users.email)',
        'index("idx_users_status").on(users.status)',
        'index("idx_users_role").on(users.role)',
      ],
      customers: [
        'index("idx_customers_user_id").on(customers.userId)',
        'index("idx_customers_status").on(customers.status)',
        'index("idx_customers_created_at").on(customers.createdAt)',
      ],
      documents: [
        'index("idx_documents_customer_id").on(documents.customerId)',
        'index("idx_documents_created_at").on(documents.createdAt)',
        'index("idx_documents_type").on(documents.type)',
      ],
      subscriptions: [
        'index("idx_subscriptions_customer_id").on(subscriptions.customerId)',
        'index("idx_subscriptions_status").on(subscriptions.status)',
        'index("idx_subscriptions_renewal_date").on(subscriptions.renewalDate)',
      ],
      audit_logs: [
        'index("idx_audit_logs_user_id").on(auditLogs.userId)',
        'index("idx_audit_logs_timestamp").on(auditLogs.timestamp)',
      ],
    };
  }
}

export default DBOptimizer;
