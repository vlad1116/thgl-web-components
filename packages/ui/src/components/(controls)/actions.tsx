"use client";

import { ReactNode, useState } from "react";
import { Layers } from "lucide-react";
import { cn } from "@repo/lib";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

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

  return (
    <div className={cn("fixed top-[64px] right-2 mt-[1px] z-[500]", className)}>
      {/* Desktop (md+): inline grouped strips */}
      <div className="hidden md:flex items-center gap-1.5">
        <div className="flex items-center rounded-md border border-input bg-background shadow-sm divide-x divide-input overflow-hidden [&_button]:border-0 [&_button]:shadow-none [&_button]:rounded-none [&_button]:h-8 [&_button]:w-8">
          {children}
        </div>
        {mapControls}
      </div>

      {/* Mobile (< md): single button opens all controls */}
      <div className="md:hidden">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              className="h-8 w-8 rounded-md border border-input bg-background shadow-sm flex items-center justify-center cursor-pointer hover:bg-accent transition-colors"
              aria-label="Map tools"
            >
              <Layers className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="bottom"
            align="end"
            className="w-auto p-2 space-y-1.5"
          >
            {mapControls}
            <div
              className="flex items-center rounded-md border border-input bg-background divide-x divide-input overflow-hidden [&_button]:border-0 [&_button]:shadow-none [&_button]:rounded-none [&_button]:h-8 [&_button]:w-8"
              onClick={(e) => {
                // Plain actions (add node, add drawing) should dismiss this
                // popover after tapping. But some controls (whiteboard, peer
                // mesh) open their own dialog, which is rendered inside this
                // PopoverContent — closing the popover would unmount that
                // just-opened dialog along with it, so the dialog never
                // appears ("menu disappears"). Leave the popover open for any
                // trigger that owns a nested overlay (aria-haspopup); Radix's
                // layered dismissal keeps it mounted behind the dialog.
                if ((e.target as HTMLElement).closest("[aria-haspopup]")) return;
                setOpen(false);
              }}
            >
              {children}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
