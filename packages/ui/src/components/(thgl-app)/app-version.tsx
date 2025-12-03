"use client";

import { useLiveState } from "@repo/lib/thgl-app";

export function AppVersion() {
  const version = useLiveState((state) => state.version);

  if (!version?.buildVersion) return null;

  return (
    <span className="text-xs font-normal text-muted-foreground">
      v{version.buildVersion}
    </span>
  );
}
