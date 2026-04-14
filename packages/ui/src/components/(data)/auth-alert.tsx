"use client";

import { Star } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { useAccountStore } from "@repo/lib";
import { Button } from "../(controls)";

export function AuthAlert({ className }: { className?: string }) {
  const userId = useAccountStore((state) => state.userId);
  const setShowUserDialog = useAccountStore(
    (state) => state.setShowUserDialog,
  );

  return (
    <Alert className={className}>
      <AlertDescription className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {userId ? "Requires a subscription" : "Sign in to use this feature"}
        </span>
        <Button
          size="sm"
          variant="secondary"
          className="h-6 text-xs gap-1 shrink-0"
          onClick={() => setShowUserDialog(true)}
        >
          <Star className="w-3 h-3" />
          {userId ? "View tiers" : "Sign In"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
