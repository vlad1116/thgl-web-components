"use client";
import { useEffect, type JSX } from "react";
import { getNitroAds } from "./nitro-pay";
import { AdFreeContainer } from "./ad-free-container";
import { cn } from "@repo/lib";
import { IS_DEMO_MODE } from "./constants";
import { AdPlaceholder } from "./ad-placeholder";

export function MobileBanner({
  id,
  targeting,
  className,
}: {
  id: string;
  targeting?: Record<string, string>;
  className?: string;
}): JSX.Element {
  useEffect(() => {
    try {
      getNitroAds().createAd(id, {
        targeting, // Custom targeting for reporting filters
        refreshTime: 30,
        renderVisibleOnly: false,
        sizes: [["320", "50"]],
        demo: IS_DEMO_MODE,
        debug: "silent",
      });
    } catch (error) {
      console.error(`[MobileBanner] Failed to create ad ${id}:`, error);
    }
    // Depend on the targeting *values* (not the object reference) — see
    // wide-skyscrapper.tsx for full context.
  }, [id, targeting?.game, targeting?.platform]);

  return (
    <AdFreeContainer className={cn("w-fit mx-auto", className)}>
      <div
        className="rounded h-[50px] w-[320px] bg-zinc-800/30 flex flex-col justify-center text-gray-500"
        id={id}
      />
    </AdFreeContainer>
  );
}

export function MobileBannerLoading({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <AdPlaceholder
      type="loading"
      width="w-[320px]"
      height="h-[50px]"
      className={cn("w-fit mx-auto", className)}
    />
  );
}

export function MobileBannerFallback({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <AdPlaceholder
      type="blocked"
      width="w-[320px]"
      height="h-[50px]"
      className={cn("w-fit mx-auto", className)}
      hideBlockedText
    />
  );
}
