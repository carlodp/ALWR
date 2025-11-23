import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";

interface BadgeStatusProps {
  status: "active" | "pending" | "inactive" | "error" | "loading";
  label: string;
  size?: "sm" | "md";
}

export function BadgeStatus({ status, label, size = "md" }: BadgeStatusProps) {
  const iconClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  const config = {
    active: { variant: "default" as const, icon: CheckCircle2, label: "Active" },
    pending: { variant: "outline" as const, icon: Clock, label: "Pending" },
    inactive: { variant: "secondary" as const, icon: AlertCircle, label: "Inactive" },
    error: { variant: "destructive" as const, icon: AlertCircle, label: "Error" },
    loading: { variant: "outline" as const, icon: Loader2, label: "Loading" },
  };

  const { variant, icon: Icon } = config[status];

  return (
    <Badge variant={variant} className="flex items-center gap-1" data-testid={`badge-status-${status}`}>
      {status === "loading" ? (
        <Icon className={`${iconClass} animate-spin`} />
      ) : (
        <Icon className={iconClass} />
      )}
      <span>{label}</span>
    </Badge>
  );
}
