import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLocation } from "wouter";

export function MobileHeader() {
  const [location] = useLocation();

  // Get page title based on current route
  const getPageTitle = () => {
    if (location === "/" || location === "/admin/dashboard" || location === "/customer/dashboard") {
      return "Dashboard";
    }
    if (location === "/search") return "Global Search";
    if (location.startsWith("/admin/customers")) return location.includes("/new") ? "New Customer" : "Customers";
    if (location.startsWith("/admin/subscriptions")) return "Subscriptions";
    if (location.startsWith("/admin/renewal-reminders")) return "Renewal Reminders";
    if (location.startsWith("/admin/reports")) return "Reports";
    if (location.startsWith("/admin/user-roles")) return "User Roles";
    if (location.startsWith("/admin/audit-logs")) return "Audit Logs";
    if (location.startsWith("/customer/documents")) return "Documents";
    if (location.startsWith("/customer/profile")) return "Profile";
    if (location.startsWith("/customer/subscription")) return "Subscription";
    if (location.startsWith("/customer/payments")) return "Payments";
    if (location.startsWith("/customer/id-card")) return "ID Card";
    if (location === "/emergency-access") return "Emergency Access";
    return "ALWR";
  };

  return (
    <header className="md:hidden sticky top-0 z-50 bg-background border-b">
      <div className="flex items-center justify-between h-14 px-4 gap-2">
        <SidebarTrigger data-testid="button-mobile-menu" />
        <h1 className="text-sm font-semibold flex-1 text-center truncate">
          {getPageTitle()}
        </h1>
        <div className="w-10" />
      </div>
    </header>
  );
}
