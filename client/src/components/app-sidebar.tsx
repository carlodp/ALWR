import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { 
  Home, 
  FileText, 
  User, 
  CreditCard, 
  LogOut,
  Shield,
  Users,
  ClipboardList,
  LayoutDashboard,
  Bell
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { user, isAdmin } = useAuth();

  const getInitials = () => {
    if (!user) return "U";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  // Customer menu items
  const customerMenuItems = [
    {
      title: "Dashboard",
      url: "/customer/dashboard",
      icon: Home,
    },
    {
      title: "Documents",
      url: "/customer/documents",
      icon: FileText,
    },
    {
      title: "ID Card",
      url: "/customer/id-card",
      icon: CreditCard,
    },
    {
      title: "Subscription",
      url: "/customer/subscription",
      icon: CreditCard,
    },
    {
      title: "Payments",
      url: "/customer/payments",
      icon: CreditCard,
    },
    {
      title: "Profile",
      url: "/customer/profile",
      icon: User,
    },
  ];

  // Admin menu items
  const adminMenuItems = [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Customers",
      url: "/admin/customers",
      icon: Users,
    },
    {
      title: "Subscriptions",
      url: "/admin/subscriptions",
      icon: CreditCard,
    },
    {
      title: "Renewal Reminders",
      url: "/admin/renewal-reminders",
      icon: Bell,
    },
    {
      title: "Audit Logs",
      url: "/admin/audit-logs",
      icon: ClipboardList,
    },
  ];

  const menuItems = isAdmin ? adminMenuItems : customerMenuItems;

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">ALWR</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {isAdmin ? "Admin Tools" : "My Account"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild data-testid={`nav-${item.title.toLowerCase().replace(/ /g, '-')}`}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <Button
            variant="outline"
            className="w-full"
            data-testid="button-logout"
            onClick={async () => {
              try {
                await fetch("/api/logout", { method: "POST" });
                window.location.href = "/";
              } catch (error) {
                console.error("Logout failed:", error);
              }
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
