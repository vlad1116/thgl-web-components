import { ExternalLink } from "lucide-react";
import { ExternalAnchor } from "./external-anchor";

import type { JSX } from "react";

export function ReleaseNotesLink({ href }: { href: string }): JSX.Element {
  return (
    <ExternalAnchor
      href={href}
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-input bg-background/50 hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      Release Notes
      <ExternalLink className="w-3 h-3 opacity-50" />
    </ExternalAnchor>
  );
}
