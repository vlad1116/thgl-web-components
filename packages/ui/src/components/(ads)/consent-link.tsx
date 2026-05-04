"use client";
import { useState, useEffect } from "react";

export function ConsentLink() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function check() {
      // Only show for GDPR users where the TCF API is loaded
      if (window["__tcfapi" as keyof Window]) {
        setVisible(true);
      }
    }
    if (window["nitroAds" as keyof Window] && (window["nitroAds" as keyof Window] as any).loaded) {
      check();
    } else {
      document.addEventListener("nitroAds.loaded", check);
      return () => document.removeEventListener("nitroAds.loaded", check);
    }
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => {
        if (window["__cmp" as keyof Window]) {
          (window["__cmp" as keyof Window] as any)("showModal");
        }
      }}
      className="block w-full text-left px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-zinc-800 transition-colors"
    >
      Update cookie preferences
    </button>
  );
}

export default ConsentLink;
