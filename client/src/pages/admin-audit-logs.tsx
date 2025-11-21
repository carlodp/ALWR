import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, AlertCircle, CheckCircle2, FileText, User, CreditCard, ArrowLeft, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { AuditLog } from "@shared/schema";

export default function AdminAuditLogs() {
  const [, setLocation] = useLocation();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");

  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/admin/audit-logs"],
    enabled: isAdmin,
  });

  const filteredLogs = logs?.filter((log) => {
    const matchesSearch =
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resourceId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "success" && log.success) ||
      (statusFilter === "failed" && !log.success);
    
    const logDate = new Date(log.createdAt!);
    const matchesDateFrom = !dateFromFilter || logDate >= new Date(dateFromFilter);
    const matchesDateTo = !dateToFilter || logDate <= new Date(dateToFilter + "T23:59:59");
    
    return matchesSearch && matchesAction && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const exportToCSV = () => {
    if (!filteredLogs || filteredLogs.length === 0) {
      toast({ title: "No logs to export", description: "Apply filters and try again", variant: "destructive" });
      return;
    }

    const headers = ["Timestamp", "Actor", "Actor Role", "Action", "Resource Type", "Resource ID", "Status", "IP Address"];
    const rows = filteredLogs.map((log) => [
      new Date(log.createdAt!).toLocaleString(),
      log.actorName,
      log.actorRole,
      log.action.replace(/_/g, " "),
      log.resourceType,
      log.resourceId,
      log.success ? "Success" : "Failed",
      log.ipAddress || "—",
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({ title: "Audit logs exported successfully" });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setActionFilter("all");
    setStatusFilter("all");
    setDateFromFilter("");
    setDateToFilter("");
  };

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
      <div className="flex items-start justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/admin/dashboard")}
          className="sm:hidden -ml-2"
          data-testid="button-back-mobile"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="space-y-2 flex-1">
          <h1 className="text-3xl md:text-4xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground text-lg">
            HIPAA-compliant activity tracking and system logs
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>System Activity</CardTitle>
                <CardDescription>
                  {filteredLogs?.length || 0} of {logs?.length || 0} log entries
                </CardDescription>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportToCSV}
                  disabled={!filteredLogs || filteredLogs.length === 0}
                  className="flex-1 sm:flex-initial"
                  data-testid="button-export"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetFilters}
                  className="flex-1 sm:flex-initial"
                  data-testid="button-reset-filters"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by actor or resource..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger data-testid="select-action-filter">
                    <SelectValue placeholder="Action" />
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

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  placeholder="From Date"
                  data-testid="input-date-from"
                />

                <Input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  placeholder="To Date"
                  data-testid="input-date-to"
                />
              </div>
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
                          {searchQuery || actionFilter !== 'all' || statusFilter !== 'all' || dateFromFilter || dateToFilter ? 'No logs found' : 'No audit logs yet'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {searchQuery || actionFilter !== 'all' || statusFilter !== 'all' || dateFromFilter || dateToFilter
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
