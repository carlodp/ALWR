import { storage } from "./storage";
import type { Subscription } from "@shared/schema";

export type ReportsData = {
  revenueByMonth: { month: string; revenue: number }[];
  subscriptionStats: { status: string; count: number }[];
  documentUploadTrend: { week: string; uploads: number }[];
  topCustomersByDocuments: { name: string; documents: number }[];
  avgRevenuePerCustomer: number;
  totalRevenue: number;
  timestamp: number;
};

let cachedStats: ReportsData | null = null;
let lastCalculated = 0;
const CACHE_TTL = 30000; // Cache for 30 seconds

export async function calculateStats(): Promise<ReportsData> {
  const now = Date.now();
  if (cachedStats && (now - lastCalculated) < CACHE_TTL) {
    return cachedStats;
  }

  try {
    // Get all customers and subscriptions
    const customers = await storage.listCustomers(1000, 0);
    
    // Get all subscriptions for revenue analysis
    const allSubs = await Promise.all(
      customers.map(c => storage.getSubscription(c.id))
    );
    const subscriptions = allSubs.filter((s): s is Subscription => s !== undefined);
    
    // Get all documents
    const allDocuments = await Promise.all(
      customers.map(c => storage.listDocumentsByCustomer(c.id))
    );
    const flatDocuments = allDocuments.flat();
    
    // 1. Calculate revenue by month
    const revenueByMonth: Record<string, number> = {};
    subscriptions.forEach((sub) => {
      if (sub.startDate) {
        const date = new Date(sub.startDate);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const amount = sub.amount || 99;
        revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + amount;
      }
    });
    
    const revenueByMonthArray = Object.entries(revenueByMonth).map(([month, revenue]) => ({
      month,
      revenue,
    }));
    
    // 2. Subscription status distribution
    const statusCounts: Record<string, number> = {};
    subscriptions.forEach((sub) => {
      const status = sub.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    const subscriptionStats = Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
    }));
    
    // 3. Document upload trend by week
    const documentUploadTrend: Record<string, number> = {};
    flatDocuments.forEach((doc) => {
      if (doc.uploadedAt) {
        const date = new Date(doc.uploadedAt);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        documentUploadTrend[weekKey] = (documentUploadTrend[weekKey] || 0) + 1;
      }
    });
    
    const documentUploadTrendArray = Object.entries(documentUploadTrend).map(([week, uploads]) => ({
      week,
      uploads,
    })).slice(-8); // Last 8 weeks
    
    // 4. Top customers by document count
    const customerDocCounts = await Promise.all(
      customers.map(async (customer) => {
        const user = await storage.getUser(customer.userId);
        const docs = await storage.listDocumentsByCustomer(customer.id);
        return {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          documents: docs.length,
        };
      })
    );
    
    const topCustomersByDocuments = customerDocCounts
      .filter(c => c.documents > 0)
      .sort((a, b) => b.documents - a.documents)
      .slice(0, 5);
    
    // 5. Calculate financial metrics
    const totalRevenue = subscriptions.reduce((sum, sub) => sum + (sub.amount || 99), 0);
    const avgRevenuePerCustomer = customers.length > 0 ? totalRevenue / customers.length : 0;
    
    cachedStats = {
      revenueByMonth: revenueByMonthArray,
      subscriptionStats,
      documentUploadTrend: documentUploadTrendArray,
      topCustomersByDocuments,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgRevenuePerCustomer: Math.round(avgRevenuePerCustomer * 100) / 100,
      timestamp: now,
    };
    
    lastCalculated = now;
    return cachedStats;
  } catch (error) {
    console.error("Error calculating stats:", error);
    throw error;
  }
}

// Invalidate cache when data changes
export function invalidateStatsCache() {
  cachedStats = null;
  lastCalculated = 0;
}
