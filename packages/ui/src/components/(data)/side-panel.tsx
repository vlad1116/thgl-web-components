"use client";

import { cn } from "@repo/lib";
import { useCallback, useRef, useState } from "react";

/**
 * Reusable side panel container — desktop right panel + mobile bottom sheet.
 * Used by MarkerPanel and ZoneDetailsPanel.
 */
export function SidePanel({
  visible,
  onClose,
  headerOffset,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  headerOffset?: string;
  children: React.ReactNode;
}) {
  const offset = headerOffset ?? "54px";

  return (
    <>
      {/* Desktop: right side panel */}
      <div
        className={cn(
          "hidden md:flex flex-col fixed right-0 z-13000 w-[360px] bg-card border-l shadow-lg pointer-events-auto",
          "transition-transform duration-200 ease-out",
          visible ? "translate-x-0" : "translate-x-full",
        )}
        style={{
          top: offset,
          height: `calc(100dvh - ${offset})`,
        }}
      >
        {children}
      </div>

      {/* Mobile: bottom sheet with swipe-to-dismiss */}
      <MobileBottomSheet visible={visible} onClose={onClose}>
        {children}
      </MobileBottomSheet>
    </>
  );
}

function MobileBottomSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const isDragging = dragStartY.current !== null;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = sheetRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touchY = touch.clientY - rect.top;
    if (touchY > 40) return;
    dragStartY.current = touch.clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const deltaY = e.touches[0].clientY - dragStartY.current;
    setDragOffset(Math.max(0, deltaY));
    e.preventDefault();
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dragStartY.current === null) return;
    dragStartY.current = null;
    if (dragOffset > 80) {
      onClose();
    }
    setDragOffset(0);
  }, [dragOffset, onClose]);

  return (
    <div
      ref={sheetRef}
      className={cn(
        "md:hidden fixed inset-x-0 bottom-0 z-13000 bg-card border-t rounded-t-xl shadow-lg pointer-events-auto",
        !isDragging && "transition-transform duration-200 ease-out",
        visible ? "translate-y-0" : "translate-y-full",
      )}
      style={{
        maxHeight: "70dvh",
        transform:
          visible && dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
        touchAction: "none",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex justify-center py-2 shrink-0 cursor-grab">
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
      </div>
      <div
        className="flex flex-col overflow-hidden"
        style={{
          maxHeight: "calc(70dvh - 20px)",
          touchAction: "pan-y",
        }}
      >
        {children}
      </div>
    </div>
  );
}
