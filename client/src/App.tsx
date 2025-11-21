import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
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
import EmergencyAccess from "@/pages/emergency-access";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public Routes */}
      {(isLoading || !isAuthenticated) && (
        <>
          <Route path="/" component={Landing} />
          <Route path="/emergency-access" component={EmergencyAccess} />
        </>
      )}

      {/* Authenticated Routes */}
      {isAuthenticated && (
        <>
          <Route path="/" component={CustomerDashboard} />
          <Route path="/customer/dashboard" component={CustomerDashboard} />
          <Route path="/customer/documents" component={CustomerDocuments} />
          <Route path="/customer/profile" component={CustomerProfile} />
          <Route path="/customer/subscription" component={CustomerSubscription} />
          <Route path="/customer/payments" component={CustomerPayments} />
          <Route path="/customer/id-card" component={CustomerIdCard} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/customers" component={AdminCustomers} />
          <Route path="/admin/customers/new" component={AdminCreateCustomer} />
          <Route path="/admin/customers/:id" component={AdminCustomerDetail} />
          <Route path="/admin/subscriptions" component={AdminSubscriptions} />
          <Route path="/admin/renewal-reminders" component={AdminRenewalReminders} />
          <Route path="/admin/reports" component={AdminReports} />
          <Route path="/admin/audit-logs" component={AdminAuditLogs} />
          
          {/* Emergency Access - available to all */}
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

  // Sidebar configuration for authenticated users
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <TooltipProvider>
      {isAuthenticated && !isLoading ? (
        <SidebarProvider style={sidebarStyle as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <main className="flex-1 overflow-auto">
              <Router />
            </main>
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
