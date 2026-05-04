"use client";

import { Search } from "lucide-react";

export function HeroSearch() {
  return (
    <button
      onClick={() => {
        const input = document.querySelector<HTMLInputElement>(
          'header input[placeholder="Search..."]',
        );
        if (input) {
          input.focus();
          input.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }}
      className="flex items-center gap-3 w-full max-w-md mx-auto h-11 rounded-lg border border-neutral-700 bg-zinc-800/50 px-4 text-sm text-muted-foreground hover:text-foreground hover:border-neutral-600 hover:bg-zinc-800 transition-colors"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left">Search units, heroes, spells...</span>
      <kbd className="inline-flex h-5 items-center rounded border border-neutral-700 bg-zinc-900 px-1.5 font-mono text-[10px] text-muted-foreground">
        /
      </kbd>
    </button>
  );
}
