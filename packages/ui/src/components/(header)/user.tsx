"use client";

import { CircleUser } from "lucide-react";
import { Button } from "../(controls)";
import { useT } from "../(providers)";
import { cn, useAccountStore } from "@repo/lib";
import { UserDialog } from "./user-dialog";

export function User({ isExpanded }: { isExpanded: boolean }) {
  const user = useAccountStore();

  const t = useT();

  return (
    <>
      <Button
        size={isExpanded ? "default" : "icon"}
        title={t("account")}
        variant={isExpanded ? "secondary" : "outline"}
        onClick={() => user.setShowUserDialog(true)}
      >
        <CircleUser className={cn(!isExpanded && "h-4 w-4", user.userId && "text-primary")} />
        <span
          className={cn("ml-2", {
            hidden: !isExpanded,
          })}
        >
          {t("account")}
        </span>
      </Button>
      <UserDialog />
    </>
  );
}
