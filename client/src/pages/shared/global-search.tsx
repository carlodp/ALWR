import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, ArrowRight, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface SearchResult {
  type: 'customer' | 'document' | 'audit_log';
  id: string;
  title: string;
  description?: string;
  customerId?: string;
  email?: string;
  timestamp?: string;
}

export default function GlobalSearch() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: results = [], isLoading } = useQuery<SearchResult[]>({
    queryKey: ["/api/global-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/global-search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
    enabled: searchQuery.trim().length > 0,
  });

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'customer') {
      setLocation(`/admin/customers/${result.id}`);
    } else if (result.type === 'document') {
      setLocation(`/customer/documents`);
    } else if (result.type === 'audit_log') {
      setLocation(`/admin/audit-logs`);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'customer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'document':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'audit_log':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'customer':
        return 'Customer';
      case 'document':
        return 'Document';
      case 'audit_log':
        return 'Audit Log';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Global Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers, documents, or audit logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
              data-testid="input-global-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {searchQuery.trim().length > 0 && (
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  Searching...
                </div>
              </CardContent>
            </Card>
          ) : results.length > 0 ? (
            <>
              <div className="text-sm text-muted-foreground">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              {results.map((result, index) => (
                <Card
                  key={`${result.type}-${result.id}-${index}`}
                  className="cursor-pointer hover-elevate transition-all"
                  onClick={() => handleResultClick(result)}
                  data-testid={`result-${result.type}-${result.id}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getTypeColor(result.type)}>
                            {getTypeLabel(result.type)}
                          </Badge>
                          {result.timestamp && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(result.timestamp), "MMM d, yyyy HH:mm")}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold truncate">{result.title}</h3>
                        {result.description && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {result.description}
                          </p>
                        )}
                        {result.email && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {result.email}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try searching with different keywords
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {searchQuery.trim().length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Start typing to search across all resources</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
