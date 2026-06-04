"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { Layers } from "lucide-react";
import { cn } from "@repo/lib";

// A control may portal an overlay (Radix Dialog, or a Popover/Tooltip/
// DropdownMenu popper) OUTSIDE this menu. A pointerdown inside one of those
// must NOT dismiss the mobile menu — the overlay's React tree lives inside the
// menu, so closing it would unmount the just-opened overlay.
const PORTALED_OVERLAY_SELECTOR =
  "[role='dialog'],[role='alertdialog'],[role='menu'],[data-radix-popper-content-wrapper]";

export function Actions({
  children,
  mapControls,
  className,
}: {
  children: ReactNode;
  mapControls?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dismiss the mobile menu on outside pointerdown / Escape. On desktop the
  // strip is always shown and `open` stays false, so this stays inert.
  //
  // Deliberately NOT a Radix Popover: nesting Radix overlays (the compass
  // Popover, the per-control Tooltips, and the whiteboard/peer-mesh Dialogs)
  // inside a Radix PopoverContent's FocusScope makes composeRefs thrash under
  // React 19 and throws "Maximum update depth exceeded" (#185) once a child
  // re-renders frequently (e.g. live/peer streaming). A plain panel has no
  // FocusScope, so the nesting is harmless.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (containerRef.current?.contains(target)) return;
      if (target.closest(PORTALED_OVERLAY_SELECTOR)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className={cn("fixed top-[64px] right-2 mt-px z-500", className)}
    >
      {/* Mobile-only trigger (hidden on md+, where the strip is always shown). */}
      <button
        type="button"
        aria-label="Map tools"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="md:hidden h-8 w-8 rounded-md border border-input bg-background shadow-sm flex items-center justify-center cursor-pointer hover:bg-accent transition-colors"
      >
        <Layers className="h-3.5 w-3.5" />
      </button>

      {/* ONE instance of every control, rendered once and kept mounted (CSS
          toggles visibility). This keeps peer connections / map layers alive
          while the menu is closed, and avoids mounting twice — the previous
          desktop + mobile branches each mounted their own MapControls,
          StreamingReceiver, PrivateNode, etc. (double peer connections, a
          duplicated Add-Node dialog, two rAF loops). Desktop: inline strip.
          Mobile: collapsible dropdown panel. */}
      <div
        className={cn(
          "flex-col gap-1.5",
          // Mobile dropdown-panel chrome
          "absolute right-0 top-full mt-1 z-10 w-auto rounded-md border border-input bg-popover text-popover-foreground shadow-md p-2",
          // Desktop: inline row, strip the panel chrome
          "md:static md:right-auto md:top-auto md:mt-0 md:flex md:flex-row md:items-center md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none",
          // Visibility: hidden on mobile until opened; always shown on desktop
          open ? "flex" : "hidden md:flex",
        )}
      >
        {/* Map controls: below the actions on mobile, to their right on desktop */}
        <div className="order-none md:order-2">{mapControls}</div>
        <div
          className="order-none md:order-1 flex items-center rounded-md border border-input bg-background divide-x divide-input overflow-hidden md:shadow-sm [&_button]:border-0 [&_button]:shadow-none [&_button]:rounded-none [&_button]:h-8 [&_button]:w-8"
          onClick={(e) => {
            // Plain actions (add node, add drawing) dismiss the menu after a
            // tap. Controls that open their own dialog (whiteboard, peer mesh)
            // are rendered inside this panel — closing it would unmount the
            // just-opened dialog. Leave it open for any trigger that owns a
            // nested overlay (aria-haspopup).
            if ((e.target as HTMLElement).closest("[aria-haspopup]")) return;
            setOpen(false);
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
