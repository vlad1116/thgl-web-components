"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../(controls)";

export function NavigationButtons() {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    // Check initial state
    setCanGoBack(window.history.length > 1);

    // Listen for popstate to update forward state
    const handlePopState = () => {
      setCanGoBack(window.history.length > 1);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleClick = (
    e: React.MouseEvent,
    action: () => void,
    enabled: boolean,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (enabled) {
      action();
      // Update forward state after going back
      setTimeout(() => setCanGoForward(true), 100);
    }
  };

  return (
    <div
      className="flex items-center gap-0.5 mr-2"
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        disabled={!canGoBack}
        onClick={(e) => handleClick(e, () => router.back(), canGoBack)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        disabled={!canGoForward}
        onClick={(e) => handleClick(e, () => router.forward(), canGoForward)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
