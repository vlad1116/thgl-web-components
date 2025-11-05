"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { cn, useAccountStore } from "@repo/lib";
import { X } from "lucide-react";
import { useT } from "../(providers)";
import { STATE_ERROR, useNitroState } from "./nitro-script";

export function AdFreeContainer({
  children,
  className,
  closable,
}: {
  children: ReactNode;
  className?: string;
  closable?: ReactNode;
}): JSX.Element {
  const t = useT();
  const setShowUserDialog = useAccountStore((state) => state.setShowUserDialog);
  const [closed, setClosed] = useState(false);
  const el = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const checkInterval = setInterval(() => {
      try {
        if (!el.current || !document.body.contains(el.current)) {
          useNitroState.getState().setState(STATE_ERROR);
          return;
        }

        // Check if element is hidden by CSS
        const computedStyle = window.getComputedStyle(el.current);
        const width = parseFloat(computedStyle.width);
        const height = parseFloat(computedStyle.height);

        if (
          computedStyle.display === "none" ||
          computedStyle.visibility === "hidden" ||
          computedStyle.opacity === "0" ||
          width < 10 ||
          height < 10
        ) {
          useNitroState.getState().setState(STATE_ERROR);
        }
      } catch {
        useNitroState.getState().setState(STATE_ERROR);
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, []);

  return (
    <div
      className={cn(
        "relative pointer-events-auto shrink-0 border overflow-hidden bg-card text-card-foreground shadow rounded-none md:rounded-md",
        className,
      )}
      ref={el}
    >
      <div
        // href="https://www.th.gl/support-me"
        className="block text-center text-xs p-0.5 group cursor-pointer"
        onClick={() => {
          setShowUserDialog(true);
          window.open("https://www.th.gl/support-me", "_blank");
        }}
      >
        {t.rich("adfree.linkText", {
          components: {
            "ad-free": (
              <span className="text-primary group-hover:underline">
                {t("adfree.linkTextAdFree")}
              </span>
            ),
          },
        })}
      </div>
      {children}
      {closable && !closed && (
        <button
          type="button"
          className="absolute top-0 right-0 p-1 z-10"
          onClick={() => setClosed(true)}
        >
          <X className="w-3 h-3" />
        </button>
      )}
      {!closed && closable}
    </div>
  );
}
