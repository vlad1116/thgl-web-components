import { cn } from "@repo/lib";

import type { JSX } from "react";

export function Brand({
  title,
  className,
}: {
  title: string;
  className?: string;
}): JSX.Element {
  return (
    <div
      className={cn(
        "hidden sm:block text-lg md:text-xl md:leading-6 font-extrabold tracking-tight whitespace-nowrap",
        className,
      )}
    >
      <span className="hidden lg:inline">
        {title.replaceAll(" ", "").toUpperCase()}
        <span className="text-xs text-gray-400">.TH.GL</span>
      </span>
      <span className="lg:hidden">TH.GL</span>
    </div>
  );
}
