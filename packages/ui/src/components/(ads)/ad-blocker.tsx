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
import { useEffect, useRef, useState } from "react";
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

const WAIT_TIME_SECONDS = 10;
export function AdBlocker() {
  const t = useT();
  const mountTime = useRef(Date.now());
  const [timeLeft, setTimeLeft] = useState(WAIT_TIME_SECONDS);
  const [open, setOpen] = useState(true);
  const setShowUserDialog = useAccountStore((state) => state.setShowUserDialog);

  const sessionKey = getStorageKey();

  const [dismissed, setDismissed] = useSessionStorage<boolean | undefined>(
    sessionKey,
    undefined,
  );

  const waitedFor10Seconds =
    Date.now() - mountTime.current >= WAIT_TIME_SECONDS * 1000;

  useEffect(() => {
    if (timeLeft <= 0) return;

    // Use closure instead of functional update to avoid nano-stb filter pattern
    const timeoutId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
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
              href="#"
              className="flex gap-1 text-primary hover:underline"
              onClick={(e) => {
                window.open("https://www.th.gl/discord", "_blank");
                e.preventDefault();
              }}
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
            if (!waitedFor10Seconds) return;
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
