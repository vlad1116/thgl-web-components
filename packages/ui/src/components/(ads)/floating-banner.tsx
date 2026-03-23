"use client";
import { useEffect } from "react";
import { getNitroAds } from "./nitro-pay";
import { useMediaQuery } from "@uidotdev/usehooks";
import { AdFreeContainer } from "./ad-free-container";
import { cn } from "@repo/lib";
import { IS_DEMO_MODE } from "./constants";
import { AdPlaceholder } from "./ad-placeholder";

const smallMediaQuery = "(min-width: 768px)";
const bigMediaQuery = "(min-width: 1250px)";
// Viewport tall enough for a 600px sidebar ad without overlapping map controls
const tallMediaQuery = "(min-height: 750px)";

type AdVariant = "sidebar-big" | "sidebar-small" | "compact";

export function FloatingBanner({
  id,
  targeting,
  isLoading = false,
  isBlocked = false,
}: {
  id: string;
  targeting?: Record<string, string>;
  isLoading?: boolean;
  isBlocked?: boolean;
}): JSX.Element {
  const smallMatched = useMediaQuery(smallMediaQuery);
  const bigMatched = useMediaQuery(bigMediaQuery);
  const tallMatched = useMediaQuery(tallMediaQuery);

  if (!smallMatched) {
    return <></>;
  }

  const variant: AdVariant = !tallMatched
    ? "compact"
    : bigMatched
      ? "sidebar-big"
      : "sidebar-small";

  // Key forces remount when variant changes, ensuring clean ad recreation
  return (
    <FloatingBannerInner
      key={variant}
      id={`${id}-${variant}`}
      variant={variant}
      targeting={targeting}
      isLoading={isLoading}
      isBlocked={isBlocked}
    />
  );
}

function FloatingBannerInner({
  id,
  variant,
  targeting,
  isLoading = false,
  isBlocked = false,
}: {
  id: string;
  variant: AdVariant;
  targeting?: Record<string, string>;
  isLoading?: boolean;
  isBlocked?: boolean;
}): JSX.Element {
  const isCompact = variant === "compact";
  const isBig = variant === "sidebar-big";

  const sizes: [string, string][] =
    isCompact
      ? [
          ["300", "250"],
          ["320", "100"],
        ]
      : isBig
        ? [
            ["300", "600"],
            ["300", "250"],
            ["160", "600"],
          ]
        : [["160", "600"]];

  const width = isCompact ? "w-[300px]" : isBig ? "w-[300px]" : "w-[160px]";
  const height = isCompact ? "h-[250px]" : "h-[600px]";

  useEffect(() => {
    if (isLoading || isBlocked) return;
    try {
      getNitroAds().createAd(id, {
        targeting,
        refreshTime: 30,
        renderVisibleOnly: false,
        sizes,
        mediaQuery: smallMediaQuery,
        debug: "silent",
        demo: IS_DEMO_MODE,
      });
    } catch (error) {
      console.error(`[FloatingBanner] Failed to create ad ${id}:`, error);
    }
  }, [id, isLoading, isBlocked]);

  if (isLoading) {
    return (
      <AdPlaceholder
        type="loading"
        width={width}
        height={height}
        className="fixed bottom-2 right-2"
      />
    );
  }

  if (isBlocked) {
    return (
      <AdPlaceholder
        type="blocked"
        width={width}
        height={height}
        className="fixed bottom-2 right-2"
      />
    );
  }

  return (
    <AdFreeContainer className="fixed bottom-2 right-2">
      <div
        id={id}
        className={cn(
          isCompact ? "min-h-[250px] min-w-[300px]" : "min-h-[600px]",
          !isCompact && (isBig ? "min-w-[300px]" : "min-w-[160px]"),
        )}
      />
    </AdFreeContainer>
  );
}
