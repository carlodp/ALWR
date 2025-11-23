import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface AccountStatusBadgeProps {
  status?: string;
  size?: "sm" | "md" | "lg";
}

export function AccountStatusBadge({ status = "active", size = "md" }: AccountStatusBadgeProps) {
  const isActive = status === "active";

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const iconSize = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <Badge
      variant={isActive ? "default" : "destructive"}
      className={`flex items-center gap-1 ${sizeClasses[size]}`}
      data-testid={`account-status-${status}`}
    >
      {isActive ? (
        <CheckCircle2 className={iconSize[size]} />
      ) : (
        <AlertCircle className={iconSize[size]} />
      )}
      <span className="capitalize">{status}</span>
    </Badge>
  );
}
