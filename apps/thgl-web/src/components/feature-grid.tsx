import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FeatureGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function FeatureGrid({
  children,
  columns = 3,
  className,
}: FeatureGridProps) {
  const gridClass = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className={cn("grid gap-6", gridClass, className)}>{children}</div>
  );
}
