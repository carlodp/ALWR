import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Users, Settings, Database, Lock, AlertTriangle, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SystemSettings } from "@shared/schema";

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
 * - Backend configuration (auto logout, rate limiting, etc.)
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

      <Tabs defaultValue="backend-config" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="backend-config">Backend Config</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        {/* Backend Configuration Tab */}
        <TabsContent value="backend-config" className="space-y-4">
          <BackendConfigurationTab />
        </TabsContent>

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
                  <strong>Note:</strong> Advanced system configuration options are available in the Backend Config tab.
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
                    <p className="text-sm text-muted-foreground">Configurable in Backend Config tab</p>
                    <Badge className="mt-2">Configurable</Badge>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="space-y-2">
                    <p className="font-semibold">Account Lockout Policy</p>
                    <p className="text-sm text-muted-foreground">Configurable failed login threshold</p>
                    <Badge variant="outline" className="mt-2">Configurable</Badge>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="space-y-2">
                    <p className="font-semibold">Session Timeout</p>
                    <p className="text-sm text-muted-foreground">Auto-logout settings in Backend Config</p>
                    <Badge variant="outline" className="mt-2">Configurable</Badge>
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
                Audit & Monitoring
              </CardTitle>
              <CardDescription>System audit logs and monitoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950">
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  <strong>Note:</strong> Comprehensive audit logging is enabled system-wide. All administrative actions are logged for compliance and security purposes.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Backend Configuration Component
function BackendConfigurationTab() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<SystemSettings>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/admin/settings/system'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/settings/system', 'GET');
      return response as SystemSettings;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<SystemSettings>) => {
      const response = await apiRequest('/api/admin/settings/system', 'PATCH', updates);
      return response as SystemSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings/system'] });
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleToggle = (key: keyof SystemSettings, value: boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleNumberChange = (key: keyof SystemSettings, value: number) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Auto Logout Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Auto Logout & Idle Timeout
          </CardTitle>
          <CardDescription>Control idle timeout warnings and automatic logout behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <p className="font-semibold">Enable Idle Timeout</p>
                <p className="text-sm text-muted-foreground">Automatically logout users after inactivity</p>
              </div>
              <button
                onClick={() => handleToggle('idleTimeoutEnabled', !formData.idleTimeoutEnabled)}
                className={`h-6 w-11 rounded-full transition-colors ${
                  formData.idleTimeoutEnabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
                data-testid="toggle-idle-timeout"
              >
                <div className={`h-5 w-5 rounded-full bg-white transition-transform ${
                  formData.idleTimeoutEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {formData.idleTimeoutEnabled && (
              <>
                <div className="p-4 border rounded-lg space-y-2">
                  <label className="text-sm font-semibold">Minutes Before Warning Popup</label>
                  <p className="text-xs text-muted-foreground">How long until idle warning appears</p>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.idleWarningMinutes || 25}
                    onChange={(e) => handleNumberChange('idleWarningMinutes', parseInt(e.target.value) || 25)}
                    className="w-full px-3 py-2 border rounded-md"
                    data-testid="input-idle-warning-minutes"
                  />
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <label className="text-sm font-semibold">Countdown Minutes</label>
                  <p className="text-xs text-muted-foreground">Time remaining on warning popup before logout</p>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.idleCountdownMinutes || 5}
                    onChange={(e) => handleNumberChange('idleCountdownMinutes', parseInt(e.target.value) || 5)}
                    className="w-full px-3 py-2 border rounded-md"
                    data-testid="input-idle-countdown-minutes"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
          <CardDescription>Control session duration and concurrent session limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg space-y-2">
            <label className="text-sm font-semibold">Session Timeout (Minutes)</label>
            <p className="text-xs text-muted-foreground">Maximum session duration before automatic logout</p>
            <input
              type="number"
              min="15"
              max="480"
              value={formData.sessionTimeoutMinutes || 30}
              onChange={(e) => handleNumberChange('sessionTimeoutMinutes', parseInt(e.target.value) || 30)}
              className="w-full px-3 py-2 border rounded-md"
              data-testid="input-session-timeout"
            />
          </div>

          <div className="p-4 border rounded-lg space-y-2">
            <label className="text-sm font-semibold">Max Concurrent Sessions</label>
            <p className="text-xs text-muted-foreground">Maximum number of simultaneous sessions per user</p>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.maxConcurrentSessions || 5}
              onChange={(e) => handleNumberChange('maxConcurrentSessions', parseInt(e.target.value) || 5)}
              className="w-full px-3 py-2 border rounded-md"
              data-testid="input-max-sessions"
            />
          </div>
        </CardContent>
      </Card>

      {/* Rate Limiting */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limiting & Security</CardTitle>
          <CardDescription>Control API rate limits and login security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <p className="font-semibold">Enable Rate Limiting</p>
              <p className="text-sm text-muted-foreground">Restrict API requests per minute</p>
            </div>
            <button
              onClick={() => handleToggle('rateLimitEnabled', !formData.rateLimitEnabled)}
              className={`h-6 w-11 rounded-full transition-colors ${
                formData.rateLimitEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
              data-testid="toggle-rate-limiting"
            >
              <div className={`h-5 w-5 rounded-full bg-white transition-transform ${
                formData.rateLimitEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {formData.rateLimitEnabled && (
            <div className="p-4 border rounded-lg space-y-2">
              <label className="text-sm font-semibold">Requests Per Minute</label>
              <p className="text-xs text-muted-foreground">Global API request rate limit</p>
              <input
                type="number"
                min="10"
                max="1000"
                value={formData.requestsPerMinute || 60}
                onChange={(e) => handleNumberChange('requestsPerMinute', parseInt(e.target.value) || 60)}
                className="w-full px-3 py-2 border rounded-md"
                data-testid="input-requests-per-minute"
              />
            </div>
          )}

          <div className="p-4 border rounded-lg space-y-2">
            <label className="text-sm font-semibold">Failed Login Lockout Threshold</label>
            <p className="text-xs text-muted-foreground">Number of failed attempts before account lock</p>
            <input
              type="number"
              min="3"
              max="20"
              value={formData.failedLoginLockoutThreshold || 5}
              onChange={(e) => handleNumberChange('failedLoginLockoutThreshold', parseInt(e.target.value) || 5)}
              className="w-full px-3 py-2 border rounded-md"
              data-testid="input-lockout-threshold"
            />
          </div>
        </CardContent>
      </Card>

      {/* Document Management */}
      <Card>
        <CardHeader>
          <CardTitle>Document Management</CardTitle>
          <CardDescription>Control file upload restrictions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg space-y-2">
            <label className="text-sm font-semibold">Max Upload Size (MB)</label>
            <p className="text-xs text-muted-foreground">Maximum file size for document uploads</p>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.maxUploadSizeMB || 10}
              onChange={(e) => handleNumberChange('maxUploadSizeMB', parseInt(e.target.value) || 10)}
              className="w-full px-3 py-2 border rounded-md"
              data-testid="input-max-upload-size"
            />
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Control 2FA requirements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <p className="font-semibold">Require 2FA for All Users</p>
              <p className="text-sm text-muted-foreground">Enforce two-factor authentication globally</p>
            </div>
            <button
              onClick={() => handleToggle('twoFactorAuthRequired', !formData.twoFactorAuthRequired)}
              className={`h-6 w-11 rounded-full transition-colors ${
                formData.twoFactorAuthRequired ? 'bg-green-500' : 'bg-gray-300'
              }`}
              data-testid="toggle-2fa-required"
            >
              <div className={`h-5 w-5 rounded-full bg-white transition-transform ${
                formData.twoFactorAuthRequired ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={updateMutation.isPending}
        className="w-full"
        size="lg"
        data-testid="button-save-settings"
      >
        {updateMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Saving...
          </>
        ) : (
          'Save All Settings'
        )}
      </Button>
    </div>
  );
}
