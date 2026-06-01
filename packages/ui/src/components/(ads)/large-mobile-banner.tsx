"use client";
import { useEffect, type JSX } from "react";
import { getNitroAds } from "./nitro-pay";
import { AdFreeContainer } from "./ad-free-container";
import { IS_DEMO_MODE } from "./constants";
import { AdPlaceholder } from "./ad-placeholder";

export function LargeMobileBanner({
  id,
  targeting,
}: {
  id: string;
  targeting?: Record<string, string>;
}): JSX.Element {
  useEffect(() => {
    try {
      getNitroAds().createAd(id, {
        targeting, // Custom targeting for reporting filters
        refreshTime: 30,
        renderVisibleOnly: false,
        sizes: [["320", "100"]],
        demo: IS_DEMO_MODE,
        debug: "silent",
      });
    } catch (error) {
      console.error(`[LargeMobileBanner] Failed to create ad ${id}:`, error);
    }
    // Depend on the targeting *values* (not the object reference) — see
    // wide-skyscrapper.tsx for full context.
  }, [id, targeting?.game, targeting?.platform]);

  return (
    <AdFreeContainer className="w-fit mx-auto">
      <div
        className="rounded h-[100px] w-[320px] bg-zinc-800/30 flex flex-col justify-center text-gray-500"
        id={id}
      />
    </AdFreeContainer>
  );
}

export function LargeMobileBannerLoading(): JSX.Element {
  return (
    <AdPlaceholder
      type="loading"
      width="w-[320px]"
      height="h-[100px]"
      className="w-fit mx-auto"
    />
  );
}

export function LargeMobileBannerFallback(): JSX.Element {
  return (
    <AdPlaceholder
      type="blocked"
      width="w-[320px]"
      height="h-[100px]"
      className="w-fit mx-auto"
      hideBlockedText
    />
  );
}
