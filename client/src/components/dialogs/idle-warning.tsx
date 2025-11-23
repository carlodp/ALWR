import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface IdleWarningDialogProps {
  open: boolean;
  countdownSeconds: number;
  onStayActive: () => void;
}

export function IdleWarningDialog({
  open,
  countdownSeconds,
  onStayActive,
}: IdleWarningDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-4 flex-1">
            <div>
              <AlertDialogTitle>Are you still there?</AlertDialogTitle>
              <AlertDialogDescription className="mt-2">
                You will be automatically logged out in{" "}
                <span className="font-semibold text-foreground">
                  {countdownSeconds} second{countdownSeconds !== 1 ? "s" : ""}
                </span>{" "}
                if no actions happen.
              </AlertDialogDescription>
            </div>
            <div className="flex gap-3">
              <AlertDialogAction onClick={onStayActive} data-testid="button-stay-active">
                Stay Active
              </AlertDialogAction>
            </div>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
