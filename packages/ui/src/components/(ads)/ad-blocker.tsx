"use client";

import { ExternalLink } from "lucide-react";
import { ExternalAnchor } from "../(header)";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useEffect, useState } from "react";
import { useSessionStorage } from "@uidotdev/usehooks";
import { useT } from "../(providers)";
import { useAccountStore } from "@repo/lib";

// Obfuscated key generation to prevent easylist blocking
function getStorageKey() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  // Build key using array operations to avoid String.prototype.concat targeting
  const parts = ["_", "x", "9", "f", "2", "e", "_"];
  parts.push(y.toString(), m, d);
  return parts.join("");
}

export function AdBlocker() {
  const t = useT();
  const [timeLeft, setTimeLeft] = useState(10);
  const [open, setOpen] = useState(true);
  const setShowUserDialog = useAccountStore((state) => state.setShowUserDialog);

  const sessionKey = getStorageKey();

  const [dismissed, setDismissed] = useSessionStorage<boolean | undefined>(
    sessionKey,
    undefined,
  );

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timeoutId = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timeoutId);
  }, [timeLeft]);

  if (dismissed) return null;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent data-nosnippet>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("adblocker.title")}</AlertDialogTitle>
        </AlertDialogHeader>

        <p>{t("adblocker.intro")}</p>

        <ul className="mb-4 list-disc list-inside space-y-2">
          <li>
            <span className="font-bold">{t("adblocker.supportTitle")}</span>{" "}
            {t("adblocker.supportText")}
            <div
              onClick={() => {
                setShowUserDialog(true);
                window.open("https://www.th.gl/support-me", "_blank");
              }}
              className="flex gap-1 text-primary hover:underline"
            >
              <span>{t("adblocker.supportLink")}</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </li>

          <li>
            <span className="font-bold">{t("adblocker.keepAdsTitle")}</span>{" "}
            {t("adblocker.keepAdsText")}
          </li>

          <li>
            <span className="font-bold">{t("adblocker.helpTitle")}</span>{" "}
            {t("adblocker.helpText")}
            <ExternalAnchor
              href="https://www.th.gl/discord"
              className="flex gap-1 text-primary hover:underline"
            >
              <span>{t("adblocker.discordLink")}</span>
              <ExternalLink className="w-3 h-3" />
            </ExternalAnchor>
          </li>
        </ul>

        <p className="text-secondary-foreground">{t("adblocker.thanks")}</p>

        <AlertDialogCancel
          disabled={timeLeft > 0}
          onClick={() => {
            setDismissed(true);
            setOpen(false);
          }}
        >
          {t.rich("adblocker.close", {
            components: {
              countdown: timeLeft > 0 ? ` (${timeLeft})` : "",
            },
          })}
        </AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialog>
  );
}
