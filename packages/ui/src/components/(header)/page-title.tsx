import { cn } from "@repo/lib";

import type { JSX } from "react";

export function PageTitle({ title }: { title: string }): JSX.Element {
  return <h1 className={cn("sr-only")}>{title}</h1>;
}
