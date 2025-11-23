/**
 * Analytics Module
 *
 * Provides comprehensive analytics and metrics for the admin dashboard.
 * Tracks subscription metrics, revenue, churn, growth, and system health.
 */

export interface SubscriptionMetrics {
  total: number;
  active: number;
  expired: number;
  cancelled: number;
  pending: number;
  trial: number;
}

export interface RevenueMetrics {
  mtd: number; // Month-to-date
  ytd: number; // Year-to-date
  lastMonth: number;
  lastQuarter: number;
  averagePerCustomer: number;
}

export interface CustomerMetrics {
  total: number;
  active: number;
  churnedLastMonth: number;
  churnRate: number;
  averageLifetimeDays: number;
  newThisMonth: number;
}

export interface DocumentMetrics {
  total: number;
  uploadedThisMonth: number;
  uploadedThisWeek: number;
  averagePerCustomer: number;
  byType: {
    living_will: number;
    healthcare_directive: number;
    power_of_attorney: number;
    dnr: number;
    other: number;
  };
}

export interface SystemHealthMetrics {
  uptime: number;
  averageResponseTime: number;
  errorRate: number;
  activeUsers: number;
}

export interface DashboardMetrics {
  subscriptions: SubscriptionMetrics;
  revenue: RevenueMetrics;
  customers: CustomerMetrics;
  documents: DocumentMetrics;
  health: SystemHealthMetrics;
  generatedAt: Date;
}

/**
 * Analytics calculator
 * Computes comprehensive metrics from database data
 */
export class Analytics {
  /**
   * Calculate subscription metrics
   */
  static calculateSubscriptionMetrics(subscriptions: any[]): SubscriptionMetrics {
    const statusCounts = subscriptions.reduce(
      (acc, sub) => {
        acc[sub.status] = (acc[sub.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: subscriptions.length,
      active: statusCounts.active || 0,
      expired: statusCounts.cancelled || 0,
      cancelled: statusCounts.cancelled || 0,
      pending: statusCounts.pending || 0,
      trial: statusCounts.trial || 0,
    };
  }

  /**
   * Calculate revenue metrics (in cents)
   */
  static calculateRevenueMetrics(subscriptions: any[]): RevenueMetrics {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let mtd = 0;
    let ytd = 0;
    let lastMonth = 0;
    const totalCents = subscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0);

    subscriptions.forEach((sub) => {
      const createdDate = new Date(sub.createdAt);
      const amount = sub.amount || 0;

      // YTD calculation
      if (createdDate.getFullYear() === currentYear) {
        ytd += amount;
      }

      // MTD calculation
      if (createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear) {
        mtd += amount;
      }

      // Last month calculation
      const lastMonthDate = new Date(now);
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      if (
        createdDate.getMonth() === lastMonthDate.getMonth() &&
        createdDate.getFullYear() === lastMonthDate.getFullYear()
      ) {
        lastMonth += amount;
      }
    });

    const lastQuarter = subscriptions
      .filter((sub) => {
        const createdDate = new Date(sub.createdAt);
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return createdDate >= threeMonthsAgo;
      })
      .reduce((sum, sub) => sum + (sub.amount || 0), 0);

    return {
      mtd: Math.round(mtd / 100), // Convert to dollars
      ytd: Math.round(ytd / 100),
      lastMonth: Math.round(lastMonth / 100),
      lastQuarter: Math.round(lastQuarter / 100),
      averagePerCustomer: subscriptions.length > 0 ? Math.round(totalCents / subscriptions.length / 100) : 0,
    };
  }

  /**
   * Calculate customer metrics
   */
  static calculateCustomerMetrics(customers: any[], subscriptions: any[]): CustomerMetrics {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    // Count active customers (with active subscription)
    const activeSubscriptionIds = subscriptions
      .filter((sub) => sub.status === 'active')
      .map((sub) => sub.customerId);
    const activeCustomers = customers.filter((c) => activeSubscriptionIds.includes(c.id)).length;

    // Count churned customers (cancelled subscription)
    const churnedSubscriptions = subscriptions.filter(
      (sub) => sub.status === 'cancelled' && new Date(sub.updatedAt) > oneMonthAgo
    );
    const churnedCustomers = new Set(churnedSubscriptions.map((sub) => sub.customerId)).size;

    // Count new customers this month
    const newThisMonth = customers.filter((c) => new Date(c.createdAt) > oneMonthAgo).length;

    // Calculate average customer lifetime
    const lifetimes = customers
      .filter((c) => new Date(c.createdAt) < sixMonthsAgo)
      .map((c) => {
        const lifetime = now.getTime() - new Date(c.createdAt).getTime();
        return lifetime / (1000 * 60 * 60 * 24); // Convert to days
      });

    const averageLifetimeDays = lifetimes.length > 0 ? Math.round(lifetimes.reduce((a, b) => a + b) / lifetimes.length) : 0;

    return {
      total: customers.length,
      active: activeCustomers,
      churnedLastMonth: churnedCustomers,
      churnRate: customers.length > 0 ? Math.round((churnedCustomers / customers.length) * 100 * 100) / 100 : 0,
      averageLifetimeDays,
      newThisMonth,
    };
  }

  /**
   * Calculate document metrics
   */
  static calculateDocumentMetrics(documents: any[]): DocumentMetrics {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const uploadedThisMonth = documents.filter((d) => new Date(d.createdAt) > oneMonthAgo).length;
    const uploadedThisWeek = documents.filter((d) => new Date(d.createdAt) > oneWeekAgo).length;

    // Count by type
    const byType = documents.reduce(
      (acc, doc) => {
        const type = doc.fileType || 'other';
        acc[type as keyof DocumentMetrics['byType']] = (acc[type as keyof DocumentMetrics['byType']] || 0) + 1;
        return acc;
      },
      {
        living_will: 0,
        healthcare_directive: 0,
        power_of_attorney: 0,
        dnr: 0,
        other: 0,
      }
    );

    // Count unique customers with documents
    const customersWithDocs = new Set(documents.map((d) => d.customerId)).size;

    return {
      total: documents.length,
      uploadedThisMonth,
      uploadedThisWeek,
      averagePerCustomer: customersWithDocs > 0 ? Math.round((documents.length / customersWithDocs) * 100) / 100 : 0,
      byType,
    };
  }

  /**
   * Calculate system health metrics
   * These are placeholder values - integrate with monitoring system
   */
  static calculateSystemHealthMetrics(): SystemHealthMetrics {
    // In production, these would come from monitoring systems (Prometheus, DataDog, etc.)
    return {
      uptime: 99.95, // 99.95% uptime
      averageResponseTime: 125, // milliseconds
      errorRate: 0.05, // 0.05% error rate
      activeUsers: 0, // Would be tracked from session data
    };
  }

  /**
   * Generate complete dashboard metrics
   */
  static generateDashboard(
    customers: any[],
    subscriptions: any[],
    documents: any[]
  ): DashboardMetrics {
    return {
      subscriptions: this.calculateSubscriptionMetrics(subscriptions),
      revenue: this.calculateRevenueMetrics(subscriptions),
      customers: this.calculateCustomerMetrics(customers, subscriptions),
      documents: this.calculateDocumentMetrics(documents),
      health: this.calculateSystemHealthMetrics(),
      generatedAt: new Date(),
    };
  }

  /**
   * Generate growth metrics (for charts)
   */
  static generateGrowthMetrics(customers: any[], documents: any[], subscriptions: any[]) {
    const now = new Date();
    const months = 12;
    const monthlyData = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(now);
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const customersThisMonth = customers.filter((c) => {
        const created = new Date(c.createdAt);
        return created >= monthStart && created <= monthEnd;
      }).length;

      const docsThisMonth = documents.filter((d) => {
        const created = new Date(d.createdAt);
        return created >= monthStart && created <= monthEnd;
      }).length;

      const revenueThisMonth = subscriptions
        .filter((s) => {
          const created = new Date(s.createdAt);
          return created >= monthStart && created <= monthEnd;
        })
        .reduce((sum, s) => sum + (s.amount || 0), 0);

      monthlyData.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        customers: customersThisMonth,
        documents: docsThisMonth,
        revenue: Math.round(revenueThisMonth / 100), // Convert to dollars
      });
    }

    return monthlyData;
  }

  /**
   * Generate top metrics summary
   */
  static generateSummary(dashboard: DashboardMetrics) {
    return {
      topMetrics: [
        {
          label: 'Active Subscriptions',
          value: dashboard.subscriptions.active,
          change: '+2.5%', // Would calculate from historical data
        },
        {
          label: 'MTD Revenue',
          value: `$${dashboard.revenue.mtd.toLocaleString()}`,
          change: '+12%',
        },
        {
          label: 'Total Customers',
          value: dashboard.customers.total,
          change: '+8',
        },
        {
          label: 'Churn Rate',
          value: `${dashboard.customers.churnRate}%`,
          change: '-0.3%',
        },
      ],
      healthStatus: dashboard.health.uptime > 99 ? 'healthy' : 'warning',
      lastUpdated: dashboard.generatedAt,
    };
  }
}

export default Analytics;
