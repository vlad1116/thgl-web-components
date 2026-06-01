"use client";
import { AdBlocker } from "./ad-blocker";
import dynamic from "next/dynamic";
import { getObfuscatedAdId, AD_TYPES } from "./obfuscated-ids";

const FloatingBanner = dynamic(
  () => import("./floating-banner").then((mod) => mod.FloatingBanner),
  { ssr: false },
);
const FloatingMobileBanner = dynamic(
  () =>
    import("./floating-mobile-banner").then((mod) => mod.FloatingMobileBanner),
  { ssr: false },
);
const NitroPayVideoPlayer = dynamic(
  () =>
    import("./nitropay-video-player").then((mod) => mod.NitroPayVideoPlayer),
  { ssr: false },
);
import { ScriptLoader } from "./nitro-script";

import type { JSX } from "react";

export function FloatingAds({ id }: { id: string }): JSX.Element {
  // Generate generic obfuscated IDs (shared across all subdomains for better dynamic flooring)
  const videoId = getObfuscatedAdId(AD_TYPES.VIDEO);
  const bannerId = getObfuscatedAdId(AD_TYPES.FLOATING_BANNER);
  const mobileBannerId = getObfuscatedAdId(AD_TYPES.MOBILE_BANNER);
  const mobileVideoId = getObfuscatedAdId(AD_TYPES.MOBILE_VIDEO);

  // Targeting for filtering in NitroPay reporting
  // Use 'platform' as primary discriminator to avoid bleed over between web/app
  const targeting = { platform: "web", game: id };

  return (
    <ScriptLoader
      fallback={
        <>
          <AdBlocker />
          <NitroPayVideoPlayer id={videoId} targeting={targeting} isBlocked />
          <FloatingBanner id={bannerId} targeting={targeting} isBlocked />
          <FloatingMobileBanner
            bannerId={mobileBannerId}
            videoId={mobileVideoId}
            targeting={targeting}
            isBlocked
          />
        </>
      }
      loading={
        <>
          <NitroPayVideoPlayer id={videoId} targeting={targeting} isLoading />
          <FloatingBanner id={bannerId} targeting={targeting} isLoading />
          <FloatingMobileBanner
            bannerId={mobileBannerId}
            videoId={mobileVideoId}
            targeting={targeting}
            isLoading
          />
        </>
      }
    >
      <NitroPayVideoPlayer id={videoId} targeting={targeting} />
      <FloatingBanner id={bannerId} targeting={targeting} />
      <FloatingMobileBanner
        bannerId={mobileBannerId}
        videoId={mobileVideoId}
        targeting={targeting}
      />
    </ScriptLoader>
  );
}
