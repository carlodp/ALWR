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
  Bell,
  BarChart3,
  Lock,
  Package,
  Mail,
  CheckCircle,
  RefreshCw,
  Zap,
  Printer
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
    // VIEW
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: LayoutDashboard,
      section: "VIEW"
    },
    
    // LIST
    {
      title: "Customers",
      url: "/admin/customers",
      icon: Users,
      section: "LIST"
    },
    {
      title: "Subscriptions",
      url: "/admin/subscriptions",
      icon: CreditCard,
      section: "LIST"
    },
    
    // CREATE
    // (using existing create customer page via dialog)
    
    // REVIEW
    {
      title: "Review",
      url: "/admin/review",
      icon: CheckCircle,
      section: "REVIEW"
    },
    
    // RECONCILE
    {
      title: "Reconcile",
      url: "/admin/reconcile",
      icon: RefreshCw,
      section: "RECONCILE"
    },
    
    // PROCESS
    {
      title: "Process Orders",
      url: "/admin/process",
      icon: Zap,
      section: "PROCESS"
    },
    
    // PRINT
    {
      title: "Print Cards",
      url: "/admin/print",
      icon: Printer,
      section: "PRINT"
    },
    
    // Additional admin features
    {
      title: "Physical Card Orders",
      url: "/admin/physical-card-orders",
      icon: Package,
      section: "TOOLS"
    },
    {
      title: "Email Templates",
      url: "/admin/email-templates",
      icon: Mail,
      section: "TOOLS"
    },
    {
      title: "Renewal Reminders",
      url: "/admin/renewal-reminders",
      icon: Bell,
      section: "TOOLS"
    },
    {
      title: "Reports",
      url: "/admin/reports",
      icon: BarChart3,
      section: "TOOLS"
    },
    {
      title: "User Roles",
      url: "/admin/user-roles",
      icon: Lock,
      section: "TOOLS"
    },
    {
      title: "Audit Logs",
      url: "/admin/audit-logs",
      icon: ClipboardList,
      section: "TOOLS"
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
        {isAdmin ? (
          <>
            {/* Admin Menu with Sections */}
            {["VIEW", "LIST", "REVIEW", "RECONCILE", "PROCESS", "PRINT"].map((section) => {
              const sectionItems = menuItems.filter(item => (item as any).section === section);
              if (sectionItems.length === 0) return null;
              
              return (
                <SidebarGroup key={section}>
                  <SidebarGroupLabel>{section}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {sectionItems.map((item) => (
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
              );
            })}
            
            {/* Tools Section */}
            <SidebarGroup>
              <SidebarGroupLabel>TOOLS</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.filter(item => (item as any).section === "TOOLS").map((item) => (
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
          </>
        ) : (
          /* Customer Menu */
          <SidebarGroup>
            <SidebarGroupLabel>My Account</SidebarGroupLabel>
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
        )}
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
