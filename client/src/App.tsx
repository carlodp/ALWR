import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";

/**
 * App Component - Root Application Entry Point
 * 
 * Main application structure and routing logic.
 * 
 * Architecture:
 * 1. QueryClientProvider: Manages server state and caching
 * 2. ThemeProvider: Dark/light mode toggle and persistence
 * 3. TooltipProvider: Global tooltip context
 * 4. SidebarProvider: Sidebar state management
 * 5. Router: Conditional rendering based on authentication
 * 
 * Routing Strategy:
 * - Unauthenticated users: See auth pages (login, signup, forgot-password, profile-setup)
 * - Authenticated customers: See customer pages (dashboard, documents, profile, etc.)
 * - Authenticated admins: See admin pages + customer pages
 * - 404 pages: For any unmatched routes
 * 
 * Authentication Flow:
 * - useAuth hook checks if user is authenticated and their role
 * - Router conditionally renders pages based on role and auth status
 * - useSessionExpiry: Handles session timeout warnings
 * - useAutoExtendSession: Auto-extends session on activity
 * - useKeyboardShortcuts: Enables keyboard navigation
 * 
 * File Organization:
 * - Pages organized in folders: auth/, customer/, admin/, shared/
 * - Components organized by type: shared/, cards/, forms/, dialogs/, layouts/, inputs/
 * - Hooks in hooks/ directory for reusable logic
 * - Utils in lib/ directory for helper functions
 * 
 * Key Features:
 * - Client-side routing with wouter
 * - Real-time query management with TanStack Query
 * - Toast notifications for user feedback
 * - Dark/light theme support
 * - Session management with auto-extend
 * - Keyboard shortcuts support
 */

// Shared Components
import { AppSidebar } from "@/components/shared/sidebar";
import { MobileHeader } from "@/components/shared/header";
import { ThemeProvider } from "@/components/shared/provider";
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav";
import { IdleWarningDialog } from "@/components/dialogs/idle-warning";
import { PageTransitionLoader } from "@/components/shared/page-transition-loader";

// Hooks
import { useAuth } from "@/hooks/useAuth";
import { useSessionExpiry } from "@/hooks/useSessionExpiry";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAutoExtendSession } from "@/hooks/useAutoExtendSession";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";

// Shared Pages
import NotFound from "@/pages/shared/not-found";
import EmergencyAccess from "@/pages/shared/emergency-access";
import GlobalSearch from "@/pages/shared/global-search";

// Auth Pages
import Login from "@/pages/auth/login";
import Signup from "@/pages/auth/signup";
import ForgotPassword from "@/pages/auth/forgot-password";
import ProfileSetup from "@/pages/auth/profile-setup";

// Customer Pages
import CustomerDashboard from "@/pages/customer/dashboard";
import CustomerDocuments from "@/pages/customer/documents";
import CustomerProfile from "@/pages/customer/profile";
import CustomerSubscription from "@/pages/customer/subscription";
import CustomerPayments from "@/pages/customer/payments";
import CustomerIdCard from "@/pages/customer/id-card";
import CustomerPhysicalCardOrder from "@/pages/customer/physical-card-order";
import CustomerHelpCenter from "@/pages/customer/help-center";
import CustomerActivity from "@/pages/customer/activity";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard-enhanced";
import AdminCustomers from "@/pages/admin/customers";
import AdminCustomerDetail from "@/pages/admin/customer-detail";
import AdminUserDetail from "@/pages/admin/user-detail";
import AdminSettings from "@/pages/admin/settings";
import AdminCreateCustomer from "@/pages/admin/create-customer";
import AdminSubscriptions from "@/pages/admin/subscriptions";
import AdminRenewalReminders from "@/pages/admin/renewal-reminders";
import AdminReports from "@/pages/admin/reports";
import AdminAuditLogs from "@/pages/admin/audit-logs";
import AdminEmailTemplates from "@/pages/admin/email-templates";
import AdminPhysicalCardOrders from "@/pages/admin/physical-card-orders";
import AdminSystemRateLimits from "@/pages/admin/system-rate-limits";
import AdminSystemDatabase from "@/pages/admin/system-database";
import AdminSystemAnalytics from "@/pages/admin/system-analytics";
import AdminReview from "@/pages/admin/review";
import AdminReviewExpired from "@/pages/admin/review-expired";
import AdminReconcile from "@/pages/admin/reconcile";
import AdminProcess from "@/pages/admin/process";
import AdminPrint from "@/pages/admin/print";
import AdminAgents from "@/pages/admin/agents";
import AdminResellers from "@/pages/admin/resellers";
import AdminUsers from "@/pages/admin/users";
import AdminCreateUser from "@/pages/admin/create-user";
import AdminUserRoles from "@/pages/admin/user-roles";
import AdminAccounting from "@/pages/admin/accounting";

function Router() {
  const { isAuthenticated, isLoading, isAdmin, isSuperAdmin } = useAuth();

  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public Routes */}
      {!isAuthenticated && (
        <>
          <Route path="/" component={Login} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/emergency-access" component={EmergencyAccess} />
        </>
      )}

      {/* Redirect authenticated users away from login pages */}
      {isAuthenticated && (
        <>
          <Route path="/login" component={AdminDashboard} />
          <Route path="/signup" component={AdminDashboard} />
          <Route path="/forgot-password" component={AdminDashboard} />
        </>
      )}

      {/* Post-Auth Routes */}
      {isAuthenticated && (
        <>
          <Route path="/profile-setup" component={ProfileSetup} />
        </>
      )}


      {/* Admin Routes - must come before customer routes */}
      {isAuthenticated && (isAdmin || isSuperAdmin) && (
        <>
          <Route path="/" component={AdminDashboard} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/customers" component={AdminCustomers} />
          <Route path="/admin/customers/new" component={AdminCreateCustomer} />
          <Route path="/admin/customers/:id" component={AdminCustomerDetail} />
          <Route path="/admin/subscriptions" component={AdminSubscriptions} />
          <Route path="/admin/accounting" component={AdminAccounting} />
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
          <Route path="/admin/users/:id" component={AdminUserDetail} />
          <Route path="/admin/settings" component={AdminSettings} />
          <Route path="/admin/user-roles" component={AdminUserRoles} />
          <Route path="/admin/system/rate-limits" component={AdminSystemRateLimits} />
          <Route path="/admin/system/database" component={AdminSystemDatabase} />
          <Route path="/admin/system/analytics" component={AdminSystemAnalytics} />
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
          <Route path="/customer/help" component={CustomerHelpCenter} />
          <Route path="/customer/activity" component={CustomerActivity} />
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
  
  // Monitor session expiry and auto-extend
  useSessionExpiry();
  useAutoExtendSession();
  
  // Monitor idle timeout
  const { showIdleWarning, countdownSeconds, onStayActive } = useIdleTimeout();
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Sidebar configuration - responsive for mobile
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <TooltipProvider>
      <PageTransitionLoader />
      {isAuthenticated && !isLoading ? (
        <SidebarProvider style={sidebarStyle as React.CSSProperties}>
          <div className="flex h-screen w-full flex-col md:flex-row">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <MobileHeader />
              <BreadcrumbNav />
              <main className="flex-1 overflow-auto">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
      ) : (
        <Router />
      )}
      <IdleWarningDialog
        open={showIdleWarning}
        countdownSeconds={countdownSeconds}
        onStayActive={onStayActive}
      />
      <Toaster />
    </TooltipProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
