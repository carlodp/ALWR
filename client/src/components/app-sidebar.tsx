import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  AlertCircle,
  RefreshCw,
  Zap,
  Printer,
  UserCheck,
  Briefcase
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
            {/* Dashboard */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild data-testid="nav-dashboard">
                      <a href="/admin/dashboard">
                        <LayoutDashboard />
                        <span>Dashboard</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Customers with nested sections */}
            <SidebarGroup>
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton data-testid="nav-customers-expand">
                        <Users />
                        <span>Customers</span>
                        <svg
                          className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12 6L8 10L4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {/* VIEW */}
                        <SidebarMenuSubItem>
                          <span className="text-xs font-semibold text-muted-foreground uppercase ml-2 mb-2 block">VIEW</span>
                        </SidebarMenuSubItem>
                        
                        {/* LIST */}
                        <SidebarMenuSubItem>
                          <span className="text-xs font-semibold text-muted-foreground uppercase ml-2 mb-2 block">LIST</span>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild data-testid="nav-customers">
                            <a href="/admin/customers">
                              <Users className="h-4 w-4" />
                              <span>Customers</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild data-testid="nav-subscriptions">
                            <a href="/admin/subscriptions">
                              <CreditCard className="h-4 w-4" />
                              <span>Subscriptions</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>

                        {/* CREATE */}
                        <SidebarMenuSubItem>
                          <span className="text-xs font-semibold text-muted-foreground uppercase ml-2 mb-2 block mt-2">CREATE</span>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild data-testid="nav-create-customer">
                            <a href="/admin/customers/new">
                              <User className="h-4 w-4" />
                              <span>New Customer</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>

                        {/* REVIEW */}
                        <SidebarMenuSubItem>
                          <span className="text-xs font-semibold text-muted-foreground uppercase ml-2 mb-2 block mt-2">REVIEW</span>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild data-testid="nav-review">
                            <a href="/admin/review">
                              <CheckCircle className="h-4 w-4" />
                              <span>New Registrations</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild data-testid="nav-review-expired">
                            <a href="/admin/review-expired">
                              <AlertCircle className="h-4 w-4" />
                              <span>Expired Accounts</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>

                        {/* RECONCILE */}
                        <SidebarMenuSubItem>
                          <span className="text-xs font-semibold text-muted-foreground uppercase ml-2 mb-2 block mt-2">RECONCILE</span>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild data-testid="nav-reconcile">
                            <a href="/admin/reconcile">
                              <RefreshCw className="h-4 w-4" />
                              <span>Reconcile</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>

                        {/* PROCESS */}
                        <SidebarMenuSubItem>
                          <span className="text-xs font-semibold text-muted-foreground uppercase ml-2 mb-2 block mt-2">PROCESS</span>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild data-testid="nav-process">
                            <a href="/admin/process">
                              <Zap className="h-4 w-4" />
                              <span>Process Orders</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>

                        {/* PRINT */}
                        <SidebarMenuSubItem>
                          <span className="text-xs font-semibold text-muted-foreground uppercase ml-2 mb-2 block mt-2">PRINT</span>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild data-testid="nav-print">
                            <a href="/admin/print">
                              <Printer className="h-4 w-4" />
                              <span>Print Cards</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </SidebarMenu>
              </Collapsible>
            </SidebarGroup>

            {/* Agents Section */}
            <SidebarGroup>
              <Collapsible defaultOpen={false} className="group/collapsible">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton data-testid="nav-agents-expand">
                        <UserCheck />
                        <span>Agents</span>
                        <svg
                          className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12 6L8 10L4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild data-testid="nav-agents">
                            <a href="/admin/agents">
                              <UserCheck className="h-4 w-4" />
                              <span>View Agents</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild data-testid="nav-agents-new">
                            <a href="/admin/agents/new">
                              <UserCheck className="h-4 w-4" />
                              <span>New Agent</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </SidebarMenu>
              </Collapsible>
            </SidebarGroup>

            {/* Resellers Section */}
            <SidebarGroup>
              <Collapsible defaultOpen={false} className="group/collapsible">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton data-testid="nav-resellers-expand">
                        <Briefcase />
                        <span>Resellers</span>
                        <svg
                          className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12 6L8 10L4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild data-testid="nav-resellers">
                            <a href="/admin/resellers">
                              <Briefcase className="h-4 w-4" />
                              <span>View Resellers</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild data-testid="nav-resellers-new">
                            <a href="/admin/resellers/new">
                              <Briefcase className="h-4 w-4" />
                              <span>New Reseller</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </SidebarMenu>
              </Collapsible>
            </SidebarGroup>

            {/* Accounts Section */}
            <SidebarGroup>
              <Collapsible defaultOpen={false} className="group/collapsible">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton data-testid="nav-accounts-expand">
                        <Lock />
                        <span>Accounts</span>
                        <svg
                          className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12 6L8 10L4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild data-testid="nav-users">
                            <a href="/admin/users">
                              <User className="h-4 w-4" />
                              <span>View Accounts</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild data-testid="nav-users-new">
                            <a href="/admin/users/new">
                              <User className="h-4 w-4" />
                              <span>Create User</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild data-testid="nav-audit-logs">
                            <a href="/admin/audit-logs">
                              <ClipboardList className="h-4 w-4" />
                              <span>User Roles</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </SidebarMenu>
              </Collapsible>
            </SidebarGroup>

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
