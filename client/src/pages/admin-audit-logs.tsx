import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, AlertCircle, CheckCircle2, FileText, User, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { AuditLog } from "@shared/schema";

export default function AdminAuditLogs() {
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/admin/audit-logs"],
    enabled: isAdmin,
  });

  const filteredLogs = logs?.filter((log) => {
    const matchesSearch =
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resourceId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = actionFilter === "all" || log.action === actionFilter;
    return matchesSearch && matchesFilter;
  });

  const getActionIcon = (action: string) => {
    if (action.includes('document')) return FileText;
    if (action.includes('customer') || action.includes('profile')) return User;
    if (action.includes('subscription')) return CreditCard;
    return AlertCircle;
  };

  const getActionBadge = (action: string) => {
    const isEmergency = action === 'emergency_access';
    const isDelete = action.includes('delete');
    
    return (
      <Badge 
        variant={isEmergency ? "destructive" : isDelete ? "secondary" : "default"}
        className="capitalize"
      >
        {action.replace(/_/g, ' ')}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground text-lg">
          HIPAA-compliant activity tracking and system logs
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>System Activity</CardTitle>
                <CardDescription>
                  {logs?.length || 0} total log entries
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" data-testid="button-export">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by actor or resource..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-action-filter">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="document_upload">Document Upload</SelectItem>
                  <SelectItem value="document_view">Document View</SelectItem>
                  <SelectItem value="document_download">Document Download</SelectItem>
                  <SelectItem value="document_delete">Document Delete</SelectItem>
                  <SelectItem value="emergency_access">Emergency Access</SelectItem>
                  <SelectItem value="profile_update">Profile Update</SelectItem>
                  <SelectItem value="subscription_create">Subscription Create</SelectItem>
                  <SelectItem value="subscription_update">Subscription Update</SelectItem>
                  <SelectItem value="customer_create">Customer Create</SelectItem>
                  <SelectItem value="customer_update">Customer Update</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredLogs && filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => {
                    const ActionIcon = getActionIcon(log.action);
                    return (
                      <TableRow
                        key={log.id}
                        className="hover-elevate"
                        data-testid={`log-row-${log.id}`}
                      >
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(log.createdAt!).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10">
                              <ActionIcon className="h-3 w-3 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{log.actorName}</p>
                              <p className="text-xs text-muted-foreground">{log.actorRole}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getActionBadge(log.action)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{log.resourceType}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {log.resourceId.substring(0, 20)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.success ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Success
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono">
                          {log.ipAddress || '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="space-y-2">
                        <p className="font-medium">
                          {searchQuery || actionFilter !== 'all' ? 'No logs found' : 'No audit logs yet'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {searchQuery || actionFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'System activity will be logged here'
                          }
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* HIPAA Notice */}
      <Card>
        <CardHeader>
          <CardTitle>HIPAA Compliance</CardTitle>
          <CardDescription>Audit log retention and security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Retention Period</p>
              <p className="text-sm text-muted-foreground">
                Logs are retained for 7 years in compliance with HIPAA regulations
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Access Control</p>
              <p className="text-sm text-muted-foreground">
                Only administrators with proper authorization can view audit logs
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Tamper Protection</p>
              <p className="text-sm text-muted-foreground">
                Logs are immutable and cannot be modified or deleted
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Emergency Access</p>
              <p className="text-sm text-muted-foreground">
                All emergency document access is logged with accessor information
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
