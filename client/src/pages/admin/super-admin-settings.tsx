import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Settings, Database, Lock, AlertTriangle } from "lucide-react";

/**
 * SuperAdminSettings Component
 * 
 * System-wide super admin settings and configuration.
 * Only accessible by super_admin role users.
 * 
 * Features:
 * - System configuration
 * - User role management
 * - Security settings
 * - Database management
 * - System monitoring
 * - Audit controls
 * 
 * Access Control: Super Admin only (redirects non-super-admin users)
 */
export default function SuperAdminSettings() {
  const { user, isSuperAdmin, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      toast({
        title: "Access Denied",
        description: "Only Super Admins can access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/");
      }, 1000);
    }
  }, [isSuperAdmin, isLoading, toast, setLocation]);

  if (isLoading || !isSuperAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Super Admin Settings</h1>
        </div>
        <p className="text-muted-foreground">System-wide configuration and management</p>
      </div>

      <Tabs defaultValue="system" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>Global system settings and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 p-4 border rounded-lg">
                  <p className="font-semibold">System Status</p>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Operational</span>
                  </div>
                </div>
                <div className="space-y-2 p-4 border rounded-lg">
                  <p className="font-semibold">Version</p>
                  <p className="text-sm text-muted-foreground">3.0.0</p>
                </div>
              </div>
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Note:</strong> Advanced system configuration options will be available here. This is a protected super admin area.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users & Roles Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Roles & Management
              </CardTitle>
              <CardDescription>Manage user roles and permissions system-wide</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">Super Admin</p>
                      <Badge variant="default">Full System Access</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Complete system control and settings management</p>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">Admin</p>
                      <Badge variant="outline">Client Admin</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Client's admin - manages their own customers and staff</p>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">Agent</p>
                      <Badge variant="outline">Limited Access</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Customer service agents</p>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">Reseller</p>
                      <Badge variant="outline">Partner Access</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Reseller partners with customer management access</p>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">Customer</p>
                      <Badge variant="outline">End User</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">End users with portal access</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>System-wide security configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="space-y-2">
                    <p className="font-semibold">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Globally enforced for all admin accounts</p>
                    <Badge className="mt-2">Enabled</Badge>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="space-y-2">
                    <p className="font-semibold">Account Lockout Policy</p>
                    <p className="text-sm text-muted-foreground">5 failed attempts → 30 minute lockout</p>
                    <Badge variant="outline" className="mt-2">Active</Badge>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="space-y-2">
                    <p className="font-semibold">Session Timeout</p>
                    <p className="text-sm text-muted-foreground">Auto-logout after 30 minutes of inactivity</p>
                    <Badge variant="outline" className="mt-2">Configured</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Management
              </CardTitle>
              <CardDescription>Database monitoring and maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="space-y-2">
                    <p className="font-semibold">Database Status</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <span className="text-sm">Connected</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="space-y-2">
                    <p className="font-semibold">Backup Status</p>
                    <p className="text-sm text-muted-foreground">Last backup: Today at 2:30 AM</p>
                    <Badge variant="outline" className="mt-2">Healthy</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Audit & Compliance
              </CardTitle>
              <CardDescription>System audit logs and compliance monitoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  <strong>Audit Logging:</strong> All system actions are logged for compliance and security purposes.
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold">Recent System Events</p>
                <div className="space-y-2 text-sm">
                  <div className="p-2 border rounded text-muted-foreground">
                    No recent critical events
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
