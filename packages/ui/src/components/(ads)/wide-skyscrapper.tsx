"use client";
import { useEffect } from "react";
import { getNitroAds } from "./nitro-pay";
import { useMediaQuery } from "@uidotdev/usehooks";
import { AdFreeContainer } from "./ad-free-container";
import { cn } from "@repo/lib";
import { IS_DEMO_MODE } from "./constants";
import { AdPlaceholder } from "./ad-placeholder";

export function WideSkyscraper({
  id,
  targeting,
  mediaQuery = "(min-width: 860px)",
}: {
  id: string;
  targeting?: Record<string, string>;
  mediaQuery?: string;
}): JSX.Element {
  const matched = useMediaQuery(mediaQuery);

  useEffect(() => {
    if (!matched) {
      return;
    }
    try {
      getNitroAds().createAd(id, {
        targeting, // Custom targeting for reporting filters
        refreshTime: 30,
        renderVisibleOnly: false,
        sizes: [["160", "600"]],
        mediaQuery: mediaQuery,
        demo: IS_DEMO_MODE,
        debug: "silent",
      });
    } catch (error) {
      console.error(`[WideSkyscraper] Failed to create ad ${id}:`, error);
    }
  }, [matched, id, targeting, mediaQuery]);

  if (!matched) {
    return <></>;
  }

  return (
    <>
      <div className="w-[160px]"></div>
      <AdFreeContainer className="fixed">
        <div
          className="bg-zinc-800/30 text-gray-500 flex-col justify-center text-center h-[600px] w-[160px]"
          id={id}
        />
      </AdFreeContainer>
    </>
  );
}

export function WideSkyscraperLoading({
  className,
  mediaQuery = "(min-width: 860px)",
}: {
  className?: string;
  mediaQuery?: string;
}): JSX.Element {
  const matched = useMediaQuery(mediaQuery);

  if (!matched) {
    return <></>;
  }

  return (
    <AdPlaceholder
      type="loading"
      width="w-[160px]"
      height="h-[600px]"
      className={cn("min-[1024px]:block hidden", className)}
    />
  );
}

export function WideSkyscraperFallback({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <AdPlaceholder
      type="blocked"
      width="w-[160px]"
      height="h-[600px]"
      className={cn("min-[1024px]:block hidden", className)}
    />
  );
}
