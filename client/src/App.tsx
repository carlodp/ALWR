import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import CustomerDashboard from "@/pages/customer-dashboard";
import CustomerDocuments from "@/pages/customer-documents";
import CustomerProfile from "@/pages/customer-profile";
import CustomerSubscription from "@/pages/customer-subscription";
import CustomerPayments from "@/pages/customer-payments";
import CustomerIdCard from "@/pages/customer-id-card";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminCustomers from "@/pages/admin-customers";
import AdminCustomerDetail from "@/pages/admin-customer-detail";
import AdminCreateCustomer from "@/pages/admin-create-customer";
import AdminSubscriptions from "@/pages/admin-subscriptions";
import AdminRenewalReminders from "@/pages/admin-renewal-reminders";
import AdminReports from "@/pages/admin-reports";
import AdminAuditLogs from "@/pages/admin-audit-logs";
import AdminEmailTemplates from "@/pages/admin-email-templates";
import AdminPhysicalCardOrders from "@/pages/admin-physical-card-orders";
import AdminReview from "@/pages/admin-review";
import AdminReviewExpired from "@/pages/admin-review-expired";
import AdminReconcile from "@/pages/admin-reconcile";
import AdminProcess from "@/pages/admin-process";
import AdminPrint from "@/pages/admin-print";
import AdminAgents from "@/pages/admin-agents";
import AdminResellers from "@/pages/admin-resellers";
import AdminUsers from "@/pages/admin-users";
import AdminCreateUser from "@/pages/admin-create-user";
import AdminUserRoles from "@/pages/admin-user-roles";
import CustomerPhysicalCardOrder from "@/pages/customer-physical-card-order";
import EmergencyAccess from "@/pages/emergency-access";
import GlobalSearch from "@/pages/global-search";

function Router() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  // Don't render any routes during loading to prevent 404 flash
  if (isLoading) {
    return null;
  }

  return (
    <Switch>
      {/* Public Routes */}
      {!isAuthenticated && (
        <>
          <Route path="/" component={Landing} />
          <Route path="/emergency-access" component={EmergencyAccess} />
        </>
      )}

      {/* Admin Routes - must come before customer routes */}
      {isAuthenticated && isAdmin && (
        <>
          <Route path="/" component={AdminDashboard} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/customers" component={AdminCustomers} />
          <Route path="/admin/customers/new" component={AdminCreateCustomer} />
          <Route path="/admin/customers/:id" component={AdminCustomerDetail} />
          <Route path="/admin/subscriptions" component={AdminSubscriptions} />
          <Route path="/admin/renewal-reminders" component={AdminRenewalReminders} />
          <Route path="/admin/reports" component={AdminReports} />
          <Route path="/admin/user-roles" component={AdminUserRoles} />
          <Route path="/admin/audit-logs" component={AdminAuditLogs} />
          <Route path="/admin/email-templates" component={AdminEmailTemplates} />
          <Route path="/admin/physical-card-orders" component={AdminPhysicalCardOrders} />
          <Route path="/admin/review" component={AdminReview} />
          <Route path="/admin/review-expired" component={AdminReviewExpired} />
          <Route path="/admin/reconcile" component={AdminReconcile} />
          <Route path="/admin/process" component={AdminProcess} />
          <Route path="/admin/print" component={AdminPrint} />
          <Route path="/admin/agents" component={AdminAgents} />
          <Route path="/admin/resellers" component={AdminResellers} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/users/new" component={AdminCreateUser} />
          <Route path="/admin/user-roles" component={AdminUserRoles} />
          <Route path="/search" component={GlobalSearch} />
          <Route path="/emergency-access" component={EmergencyAccess} />
        </>
      )}

      {/* Customer Routes */}
      {isAuthenticated && !isAdmin && (
        <>
          <Route path="/" component={CustomerDashboard} />
          <Route path="/customer/dashboard" component={CustomerDashboard} />
          <Route path="/customer/documents" component={CustomerDocuments} />
          <Route path="/customer/profile" component={CustomerProfile} />
          <Route path="/customer/subscription" component={CustomerSubscription} />
          <Route path="/customer/payments" component={CustomerPayments} />
          <Route path="/customer/id-card" component={CustomerIdCard} />
          <Route path="/customer/physical-card-order" component={CustomerPhysicalCardOrder} />
          <Route path="/search" component={GlobalSearch} />
          <Route path="/emergency-access" component={EmergencyAccess} />
        </>
      )}

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  // Sidebar configuration - responsive for mobile
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <TooltipProvider>
      {isAuthenticated && !isLoading ? (
        <SidebarProvider style={sidebarStyle as React.CSSProperties}>
          <div className="flex h-screen w-full flex-col md:flex-row">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <MobileHeader />
              <main className="flex-1 overflow-auto">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
      ) : (
        <Router />
      )}
      <Toaster />
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
