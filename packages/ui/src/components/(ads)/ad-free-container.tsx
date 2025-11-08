"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { cn, useAccountStore } from "@repo/lib";
import { X } from "lucide-react";
import { useT } from "../(providers)";
import { setNitroError } from "./nitro-script";

export function AdFreeContainer({
  children,
  className,
  closable,
  displayCheck = true,
}: {
  children: ReactNode;
  className?: string;
  closable?: ReactNode;
  displayCheck?: boolean;
}): JSX.Element {
  const t = useT();
  const setShowUserDialog = useAccountStore((state) => state.setShowUserDialog);
  const [closed, setClosed] = useState(false);
  const el = useRef<HTMLDivElement | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!displayCheck) {
      return;
    }
    try {
      if (!el.current || !document.body.contains(el.current)) {
        setNitroError();
        return;
      }
      // Check if element is hidden by CSS
      const computedStyle = window.getComputedStyle(el.current);
      const width = parseFloat(computedStyle.width);
      const height = parseFloat(computedStyle.height);

      const rect = el.current.getBoundingClientRect();

      // Allow small differences due to subpixel rendering
      const widthDiff = Math.abs(rect.width - width);
      const heightDiff = Math.abs(rect.height - height);

      if (
        computedStyle.display === "none" ||
        computedStyle.visibility === "hidden" ||
        computedStyle.opacity === "0" ||
        width < 10 ||
        height < 10 ||
        widthDiff > 5 ||
        heightDiff > 5
      ) {
        setNitroError();
      }
    } catch {
      setNitroError();
    }

    const timeoutHandle = setTimeout(() => {
      setTick((prev) => prev + 1);
    }, 1001);
    return () => {
      clearTimeout(timeoutHandle);
    };
  }, [tick, displayCheck]);

  return (
    <div
      className={cn(
        "relative pointer-events-auto border overflow-hidden bg-card text-card-foreground shadow rounded-none md:rounded-md",
        className,
      )}
      style={{ flexShrink: 0 }}
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
