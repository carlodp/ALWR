import { FormMessage } from "@/components/ui/form";
import { AlertCircle } from "lucide-react";

interface FormFieldErrorProps {
  message?: string;
  helpText?: string;
}

export function FormFieldError({ message, helpText }: FormFieldErrorProps) {
  if (!message && !helpText) return null;

  return (
    <div className="space-y-2">
      {message && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {helpText && !message && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}
