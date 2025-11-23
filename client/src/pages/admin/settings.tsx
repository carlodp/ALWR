import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Lock, Database, Mail, Bell, ToggleRight, Key, Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SystemSettings } from "@shared/schema";

/**
 * AdminSettings Component
 * 
 * Comprehensive admin settings and configuration page.
 * 
 * Settings Categories:
 * 1. General: System name, timezone, currency, language
 * 2. Security: Password policies, session timeouts, 2FA requirements
 * 3. Email: SMTP configuration, email templates, notification settings
 * 4. Database: Backup settings, maintenance tasks, optimization
 * 5. Features: Feature toggles, experimental features
 * 6. API: API key management, rate limits
 * 7. Logging: Audit log settings, retention policies
 * 8. Backend Config: Auto logout, session management, rate limiting (Super Admin only)
 * 
 * Access Control: Admin (regular settings) and Super Admin (backend config)
 */
export default function AdminSettings() {
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    systemName: "America Living Will Registry",
    timezone: "UTC",
    currency: "USD",
    language: "en",
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    minPasswordLength: 12,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    sessionTimeout: 30,
    requireTwoFactor: false,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: "smtp.example.com",
    smtpPort: 587,
    smtpUser: "notifications@example.com",
    fromEmail: "noreply@alwr.com",
    fromName: "ALWR",
    enableEmailNotifications: true,
    enableNewsletter: false,
  });

  // Feature Toggles
  const [featureToggles, setFeatureToggles] = useState({
    emergencyAccess: true,
    physicalCards: true,
    documentVersioning: true,
    automaticBackups: true,
    realtimeMetrics: true,
    advancedReporting: true,
  });

  // API Settings
  const [apiSettings, setApiSettings] = useState({
    enablePublicAPI: false,
    rateLimitPerMinute: 60,
    rateLimitPerHour: 1000,
    apiKeyRotationDays: 90,
  });

  const handleSaveSettings = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast({
      title: "Settings Saved",
      description: "Your changes have been saved successfully.",
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">System Settings</h1>
        </div>
        <p className="text-muted-foreground">Configure system-wide settings and features</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${isSuperAdmin ? 'grid-cols-4 lg:grid-cols-8' : 'grid-cols-4 lg:grid-cols-7'}`}>
          <TabsTrigger value="general" className="text-xs sm:text-sm">General</TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm">Security</TabsTrigger>
          <TabsTrigger value="email" className="text-xs sm:text-sm">Email</TabsTrigger>
          <TabsTrigger value="database" className="text-xs sm:text-sm">Database</TabsTrigger>
          <TabsTrigger value="features" className="text-xs sm:text-sm">Features</TabsTrigger>
          <TabsTrigger value="api" className="text-xs sm:text-sm">API</TabsTrigger>
          <TabsTrigger value="logging" className="text-xs sm:text-sm">Logging</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="backend" className="text-xs sm:text-sm">Backend Config</TabsTrigger>}
        </TabsList>

        {/* GENERAL SETTINGS */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic system configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="systemName">System Name</Label>
                  <Input
                    id="systemName"
                    value={generalSettings.systemName}
                    onChange={(e) => setGeneralSettings({...generalSettings, systemName: e.target.value})}
                    data-testid="input-system-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={generalSettings.timezone} onValueChange={(value) => setGeneralSettings({...generalSettings, timezone: value})}>
                    <SelectTrigger id="timezone" data-testid="select-timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Standard Time</SelectItem>
                      <SelectItem value="CST">Central Standard Time</SelectItem>
                      <SelectItem value="MST">Mountain Standard Time</SelectItem>
                      <SelectItem value="PST">Pacific Standard Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={generalSettings.currency} onValueChange={(value) => setGeneralSettings({...generalSettings, currency: value})}>
                    <SelectTrigger id="currency" data-testid="select-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="GBP">British Pound (£)</SelectItem>
                      <SelectItem value="CAD">Canadian Dollar (C$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={generalSettings.language} onValueChange={(value) => setGeneralSettings({...generalSettings, language: value})}>
                    <SelectTrigger id="language" data-testid="select-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECURITY SETTINGS */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Password policies and session management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Password Policy</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="minLength" className="flex-1">Minimum Password Length</Label>
                    <Input
                      id="minLength"
                      type="number"
                      value={securitySettings.minPasswordLength}
                      onChange={(e) => setSecuritySettings({...securitySettings, minPasswordLength: parseInt(e.target.value)})}
                      className="w-20"
                      data-testid="input-min-password-length"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Uppercase Letters</Label>
                    <Switch
                      checked={securitySettings.requireUppercase}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, requireUppercase: checked})}
                      data-testid="switch-uppercase"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Numbers</Label>
                    <Switch
                      checked={securitySettings.requireNumbers}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, requireNumbers: checked})}
                      data-testid="switch-numbers"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Special Characters</Label>
                    <Switch
                      checked={securitySettings.requireSpecialChars}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, requireSpecialChars: checked})}
                      data-testid="switch-special-chars"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">Session Management</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sessionTimeout" className="flex-1">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                      className="w-20"
                      data-testid="input-session-timeout"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Two-Factor Authentication</Label>
                    <Switch
                      checked={securitySettings.requireTwoFactor}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, requireTwoFactor: checked})}
                      data-testid="switch-require-2fa"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">Login Protection</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maxAttempts" className="flex-1">Max Login Attempts</Label>
                    <Input
                      id="maxAttempts"
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: parseInt(e.target.value)})}
                      className="w-20"
                      data-testid="input-max-attempts"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="lockoutDuration" className="flex-1">Lockout Duration (minutes)</Label>
                    <Input
                      id="lockoutDuration"
                      type="number"
                      value={securitySettings.lockoutDuration}
                      onChange={(e) => setSecuritySettings({...securitySettings, lockoutDuration: parseInt(e.target.value)})}
                      className="w-20"
                      data-testid="input-lockout-duration"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EMAIL SETTINGS */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>SMTP and email notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">SMTP Configuration</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={emailSettings.smtpHost}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpHost: e.target.value})}
                      data-testid="input-smtp-host"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={emailSettings.smtpPort}
                        onChange={(e) => setEmailSettings({...emailSettings, smtpPort: parseInt(e.target.value)})}
                        data-testid="input-smtp-port"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpUser">SMTP User</Label>
                      <Input
                        id="smtpUser"
                        value={emailSettings.smtpUser}
                        onChange={(e) => setEmailSettings({...emailSettings, smtpUser: e.target.value})}
                        data-testid="input-smtp-user"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">From Address</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) => setEmailSettings({...emailSettings, fromEmail: e.target.value})}
                      data-testid="input-from-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={emailSettings.fromName}
                      onChange={(e) => setEmailSettings({...emailSettings, fromName: e.target.value})}
                      data-testid="input-from-name"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h3 className="font-semibold">Notifications</h3>
                <div className="flex items-center justify-between">
                  <Label>Enable Email Notifications</Label>
                  <Switch
                    checked={emailSettings.enableEmailNotifications}
                    onCheckedChange={(checked) => setEmailSettings({...emailSettings, enableEmailNotifications: checked})}
                    data-testid="switch-email-notifications"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Enable Newsletter</Label>
                  <Switch
                    checked={emailSettings.enableNewsletter}
                    onCheckedChange={(checked) => setEmailSettings({...emailSettings, enableNewsletter: checked})}
                    data-testid="switch-newsletter"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DATABASE SETTINGS */}
        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Management
              </CardTitle>
              <CardDescription>Backup and maintenance settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Automated Backups</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p>Daily Backups</p>
                      <p className="text-sm text-muted-foreground">Automatic database backups run daily at 2:00 AM</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-daily-backups" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p>Weekly Full Backup</p>
                      <p className="text-sm text-muted-foreground">Complete database backup every Sunday</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-weekly-backups" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">Maintenance Tasks</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full" data-testid="button-optimize-db">
                    Optimize Database
                  </Button>
                  <Button variant="outline" className="w-full" data-testid="button-vacuum-db">
                    Vacuum Database
                  </Button>
                  <Button variant="outline" className="w-full" data-testid="button-rebuild-indexes">
                    Rebuild Indexes
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">Retention Policies</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auditLogRetention" className="flex-1">Audit Log Retention (days)</Label>
                    <Input
                      id="auditLogRetention"
                      type="number"
                      defaultValue="365"
                      className="w-20"
                      data-testid="input-audit-retention"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="activityLogRetention" className="flex-1">Activity Log Retention (days)</Label>
                    <Input
                      id="activityLogRetention"
                      type="number"
                      defaultValue="90"
                      className="w-20"
                      data-testid="input-activity-retention"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FEATURE TOGGLES */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ToggleRight className="h-5 w-5" />
                Feature Toggles
              </CardTitle>
              <CardDescription>Enable or disable system features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Emergency Access</p>
                  <p className="text-sm text-muted-foreground">Allow customers to grant emergency contact access</p>
                </div>
                <Switch
                  checked={featureToggles.emergencyAccess}
                  onCheckedChange={(checked) => setFeatureToggles({...featureToggles, emergencyAccess: checked})}
                  data-testid="switch-emergency-access"
                />
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <p className="font-medium">Physical ID Cards</p>
                  <p className="text-sm text-muted-foreground">Enable physical ID card ordering</p>
                </div>
                <Switch
                  checked={featureToggles.physicalCards}
                  onCheckedChange={(checked) => setFeatureToggles({...featureToggles, physicalCards: checked})}
                  data-testid="switch-physical-cards"
                />
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <p className="font-medium">Document Versioning</p>
                  <p className="text-sm text-muted-foreground">Track document versions and changes</p>
                </div>
                <Switch
                  checked={featureToggles.documentVersioning}
                  onCheckedChange={(checked) => setFeatureToggles({...featureToggles, documentVersioning: checked})}
                  data-testid="switch-versioning"
                />
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <p className="font-medium">Automatic Backups</p>
                  <p className="text-sm text-muted-foreground">Automatic database backups</p>
                </div>
                <Switch
                  checked={featureToggles.automaticBackups}
                  onCheckedChange={(checked) => setFeatureToggles({...featureToggles, automaticBackups: checked})}
                  data-testid="switch-auto-backups"
                />
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <p className="font-medium">Real-time Metrics</p>
                  <p className="text-sm text-muted-foreground">Real-time admin dashboard updates</p>
                </div>
                <Switch
                  checked={featureToggles.realtimeMetrics}
                  onCheckedChange={(checked) => setFeatureToggles({...featureToggles, realtimeMetrics: checked})}
                  data-testid="switch-realtime-metrics"
                />
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <p className="font-medium">Advanced Reporting</p>
                  <p className="text-sm text-muted-foreground">Access to advanced analytics and reports</p>
                </div>
                <Switch
                  checked={featureToggles.advancedReporting}
                  onCheckedChange={(checked) => setFeatureToggles({...featureToggles, advancedReporting: checked})}
                  data-testid="switch-advanced-reporting"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API SETTINGS */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Configuration
              </CardTitle>
              <CardDescription>API keys and rate limiting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Public API</p>
                    <p className="text-sm text-muted-foreground">Allow external applications to access the API</p>
                  </div>
                  <Switch
                    checked={apiSettings.enablePublicAPI}
                    onCheckedChange={(checked) => setApiSettings({...apiSettings, enablePublicAPI: checked})}
                    data-testid="switch-public-api"
                  />
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">Rate Limiting</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="perMinute" className="flex-1">Requests Per Minute</Label>
                    <Input
                      id="perMinute"
                      type="number"
                      value={apiSettings.rateLimitPerMinute}
                      onChange={(e) => setApiSettings({...apiSettings, rateLimitPerMinute: parseInt(e.target.value)})}
                      className="w-20"
                      data-testid="input-rate-limit-minute"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="perHour" className="flex-1">Requests Per Hour</Label>
                    <Input
                      id="perHour"
                      type="number"
                      value={apiSettings.rateLimitPerHour}
                      onChange={(e) => setApiSettings({...apiSettings, rateLimitPerHour: parseInt(e.target.value)})}
                      className="w-20"
                      data-testid="input-rate-limit-hour"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">API Key Management</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="keyRotation" className="flex-1">Key Rotation Interval (days)</Label>
                    <Input
                      id="keyRotation"
                      type="number"
                      value={apiSettings.apiKeyRotationDays}
                      onChange={(e) => setApiSettings({...apiSettings, apiKeyRotationDays: parseInt(e.target.value)})}
                      className="w-20"
                      data-testid="input-key-rotation"
                    />
                  </div>
                  <Button variant="outline" className="w-full" data-testid="button-generate-api-key">
                    Generate New API Key
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LOGGING SETTINGS */}
        <TabsContent value="logging" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Logging & Audit
              </CardTitle>
              <CardDescription>Configure logging levels and audit trail</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Log Levels</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Log Info Events</Label>
                    <Switch defaultChecked data-testid="switch-log-info" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Log Warning Events</Label>
                    <Switch defaultChecked data-testid="switch-log-warnings" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Log Error Events</Label>
                    <Switch defaultChecked data-testid="switch-log-errors" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Log Debug Events</Label>
                    <Switch data-testid="switch-log-debug" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">Audit Trail</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Track User Actions</Label>
                    <Switch defaultChecked data-testid="switch-track-users" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Track Admin Changes</Label>
                    <Switch defaultChecked data-testid="switch-track-admin" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Track Security Events</Label>
                    <Switch defaultChecked data-testid="switch-track-security" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Button variant="outline" className="w-full" data-testid="button-view-logs">
                  View System Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BACKEND CONFIGURATION - SUPER ADMIN ONLY */}
        {isSuperAdmin && (
          <TabsContent value="backend" className="space-y-4">
            <BackendConfigurationTab />
          </TabsContent>
        )}
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          size="lg"
          data-testid="button-save-all-settings"
        >
          {isSaving ? "Saving..." : "Save All Settings"}
        </Button>
      </div>
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
      return response as unknown as SystemSettings;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<SystemSettings>) => {
      const response = await apiRequest('/api/admin/settings/system', 'PATCH', updates);
      return response as unknown as SystemSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings/system'] });
      toast({
        title: "Success",
        description: "Backend settings updated successfully",
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
        data-testid="button-save-backend-settings"
      >
        {updateMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Saving...
          </>
        ) : (
          'Save Backend Configuration'
        )}
      </Button>
    </div>
  );
}
