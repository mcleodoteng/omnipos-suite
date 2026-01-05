import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock } from "lucide-react";

interface SessionTimeoutDialogProps {
  open: boolean;
  remainingSeconds: number;
  onExtend: () => void;
}

export function SessionTimeoutDialog({
  open,
  remainingSeconds,
  onExtend,
}: SessionTimeoutDialogProps) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay = minutes > 0 
    ? `${minutes}:${seconds.toString().padStart(2, '0')}` 
    : `${seconds}s`;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <AlertDialogTitle>Session Timeout Warning</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            You will be automatically logged out due to inactivity in{" "}
            <span className="font-bold text-orange-600">{timeDisplay}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onExtend} className="w-full">
            Continue Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
