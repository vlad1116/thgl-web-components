"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { cn, useAccountStore } from "@repo/lib";
import { X } from "lucide-react";
import { useT } from "../(providers)";
import { setContentError } from "./nitro-script";

export function AdFreeContainer({
  children,
  className,
  closable,
  displayCheck = true,
  noBorder = false,
}: {
  children: ReactNode;
  className?: string;
  closable?: ReactNode;
  displayCheck?: boolean;
  noBorder?: boolean;
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
    // Skip check if window is minimized (WebView2 doesn't set document.hidden)
    if (window.innerWidth === 0 || window.innerHeight === 0) {
      const timeoutHandle = setTimeout(() => {
        setTick((prev) => prev + 1);
      }, 500);
      return () => clearTimeout(timeoutHandle);
    }
    try {
      if (!el.current || !document.body.contains(el.current)) {
        setContentError();
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
        setContentError();
      }
    } catch {
      setContentError();
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
        "bg-card text-card-foreground shadow",
        !noBorder && "rounded-none md:rounded-md",
        className,
      )}
      style={{
        position: className?.match(/\b(fixed|absolute|sticky)\b/)
          ? undefined
          : "relative",
        border: noBorder ? undefined : "1px solid hsl(var(--border))",
        flexShrink: 0,
        pointerEvents: "auto",
      }}
      ref={el}
    >
      <div
        className="block text-center text-[11px] leading-tight py-0.5 group cursor-pointer"
        onClick={() => {
          setShowUserDialog(true);
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
