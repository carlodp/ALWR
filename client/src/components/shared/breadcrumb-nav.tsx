import { useLocation } from "wouter";
import { useState, useEffect } from "react";
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
  const [customerName, setCustomerName] = useState<string | null>(null);

  // Extract and store customer name from page title when visiting customer detail page
  useEffect(() => {
    const pathParts = location.split("/");
    if (pathParts[1] === "admin" && pathParts[2] === "customers" && pathParts[3]) {
      // Extract customer name from page h1 if available
      const h1 = document.querySelector("h1");
      if (h1) {
        setCustomerName(h1.textContent);
      }
    } else {
      setCustomerName(null);
    }
  }, [location]);

  // Get breadcrumb items from path
  const getBreadcrumbs = () => {
    const parts = location.split("/").filter(Boolean);
    if (parts.length === 0) return [];

    const breadcrumbs = [{ path: "/", label: "Home" }];

    let currentPath = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath += `/${part}`;
      
      // For customer detail pages, show the customer name instead of ID
      let label = routeLabels[currentPath];
      if (!label) {
        if (i === 3 && parts[1] === "admin" && parts[2] === "customers" && customerName) {
          label = customerName;
        } else {
          label = part.charAt(0).toUpperCase() + part.slice(1).replace("-", " ");
        }
      }
      
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
