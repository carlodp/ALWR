import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LogIn, Lock, FileText, Eye, Trash2, Clock, Search } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  category: "login" | "security" | "document" | "access" | "other";
  details?: string;
}

export default function CustomerActivity() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Mock activity data - in production, this would come from API
  const mockActivityData: ActivityLog[] = [
    {
      id: "1",
      action: "login",
      description: "Logged in from Chrome on MacOS",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      category: "login",
      details: "IP: 192.168.1.1",
    },
    {
      id: "2",
      action: "document_view",
      description: 'Viewed document "Living Will.pdf"',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      category: "document",
    },
    {
      id: "3",
      action: "emergency_access",
      description: "Emergency contact John Smith accessed your documents",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      category: "access",
      details: "Access to: Living Will, Healthcare Directive",
    },
    {
      id: "4",
      action: "2fa_enable",
      description: "Two-factor authentication enabled",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      category: "security",
      details: "Method: Authenticator App",
    },
    {
      id: "5",
      action: "password_change",
      description: "Password changed successfully",
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      category: "security",
    },
    {
      id: "6",
      action: "document_upload",
      description: 'Uploaded "Power of Attorney.pdf"',
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      category: "document",
      details: "File size: 2.4 MB, Type: Power of Attorney",
    },
    {
      id: "7",
      action: "login",
      description: "Logged in from Safari on iPhone",
      timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      category: "login",
      details: "IP: 203.0.113.45",
    },
    {
      id: "8",
      action: "subscription_renew",
      description: "Subscription renewed for 1 year",
      timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      category: "other",
      details: "Plan: Annual Premium",
    },
  ];

  const { data: activities = mockActivityData, isLoading } = useQuery({
    queryKey: ["/api/customer/activity"],
    initialData: mockActivityData,
  });

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.action.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || activity.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getActivityIcon = (category: string) => {
    switch (category) {
      case "login":
        return <LogIn className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case "security":
        return <Lock className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
      case "document":
        return <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case "access":
        return <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "login":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100";
      case "security":
        return "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100";
      case "document":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100";
      case "access":
        return "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100";
      default:
        return "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const categories = Array.from(new Set(activities.map((a) => a.category)));

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="-ml-2"
          data-testid="button-back-activity"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold">Account Activity</h1>
          <p className="text-muted-foreground">View all account actions and access logs</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search activity..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-activity-search"
        />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={!selectedCategory ? "default" : "outline"}
          className="cursor-pointer px-3 py-1"
          onClick={() => setSelectedCategory(null)}
          data-testid="badge-activity-all"
        >
          All Activity
        </Badge>
        {categories.map((cat) => (
          <Badge
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            className="cursor-pointer px-3 py-1 capitalize"
            onClick={() => setSelectedCategory(cat)}
            data-testid={`badge-activity-${cat}`}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : filteredActivities.length > 0 ? (
          <div className="space-y-3">
            {filteredActivities.map((activity) => (
              <Card key={activity.id} className="hover-elevate" data-testid={`card-activity-${activity.id}`}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.category)}</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium" data-testid={`text-activity-description-${activity.id}`}>
                            {activity.description}
                          </p>
                          {activity.details && (
                            <p className="text-sm text-muted-foreground mt-1">{activity.details}</p>
                          )}
                        </div>
                        <Badge className={`flex-shrink-0 ${getCategoryColor(activity.category)}`} variant="secondary">
                          {activity.category}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="ml-9 mt-3 pt-3 border-t text-xs text-muted-foreground">
                    {formatTime(activity.timestamp)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No activity found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Privacy Notice */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>🔒 Your Privacy:</strong> This log shows all activities related to your account for security
            transparency. We monitor all access to your documents and account changes to ensure only authorized
            actions occur.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
