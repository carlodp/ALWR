import { useLocation } from "wouter";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/admin/dashboard": "Admin Dashboard",
  "/admin/customers": "Customers",
  "/admin/subscriptions": "Subscriptions",
  "/admin/renewal-reminders": "Renewal Reminders",
  "/admin/reports": "Reports",
  "/admin/audit-logs": "Audit Logs",
  "/admin/users": "Users",
  "/admin/agents": "Agents",
  "/admin/resellers": "Resellers",
  "/customer/dashboard": "My Dashboard",
  "/customer/documents": "My Documents",
  "/customer/profile": "My Profile",
  "/customer/subscription": "My Subscription",
  "/customer/payments": "My Payments",
  "/customer/id-card": "My ID Card",
  "/search": "Global Search",
  "/emergency-access": "Emergency Access",
};

export function BreadcrumbNav() {
  const [location] = useLocation();

  // Get breadcrumb items from path
  const getBreadcrumbs = () => {
    const parts = location.split("/").filter(Boolean);
    if (parts.length === 0) return [];

    const breadcrumbs = [{ path: "/", label: "Home" }];

    let currentPath = "";
    for (const part of parts) {
      currentPath += `/${part}`;
      const label = routeLabels[currentPath] || part.charAt(0).toUpperCase() + part.slice(1).replace("-", " ");
      breadcrumbs.push({ path: currentPath, label });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs on home page
  }

  return (
    <div className="hidden md:block px-6 py-3 border-b bg-card">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center gap-2">
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage data-testid={`breadcrumb-${crumb.label.toLowerCase().replace(/ /g, "-")}`}>
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.path} data-testid={`breadcrumb-link-${crumb.label.toLowerCase().replace(/ /g, "-")}`}>
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
