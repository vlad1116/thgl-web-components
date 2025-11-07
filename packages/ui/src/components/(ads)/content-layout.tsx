import { cn } from "@repo/lib";
import { AdBlocker } from "./ad-blocker";
import { NitroScript } from "./nitro-script";
import { getObfuscatedAdId, AD_TYPES } from "./obfuscated-ids";

import {
  WideSkyscraper,
  WideSkyscraperFallback,
  WideSkyscraperLoading,
} from "./wide-skyscrapper";

import {
  LargeMobileBanner,
  LargeMobileBannerFallback,
  LargeMobileBannerLoading,
} from "./large-mobile-banner";

import {
  MobileBanner,
  MobileBannerFallback,
  MobileBannerLoading,
} from "./mobile-banner";

import { FloatingMobileBanner } from "./floating-mobile-banner";

interface ContentLayoutProps {
  id: string;
  header: React.ReactNode;
  content: React.ReactNode;
  more?: React.ReactNode;
  sidebar?: React.ReactNode;
}

export function ContentLayout({
  id,
  header,
  content,
  more,
  sidebar,
}: ContentLayoutProps) {
  // Generate generic obfuscated IDs (shared across all subdomains for better dynamic flooring)
  const wideSkyscraper1Id = getObfuscatedAdId(AD_TYPES.WIDE_SKYSCRAPER_1);
  const wideSkyscraper2Id = getObfuscatedAdId(AD_TYPES.WIDE_SKYSCRAPER_2);
  const largeMobileBannerId = getObfuscatedAdId(AD_TYPES.LARGE_MOBILE_BANNER);
  const mobileBannerId = getObfuscatedAdId(AD_TYPES.MOBILE_BANNER);
  const mobileVideoId = getObfuscatedAdId(AD_TYPES.MOBILE_VIDEO);

  // Targeting for filtering in NitroPay reporting
  // Use 'platform' as primary discriminator to avoid bleed over between web/app
  const targeting = { platform: "web", game: id };
  return (
    <div className="flex grow p-2">
      {/* Left Ad */}
      <div>
        <NitroScript
          loading={<WideSkyscraperLoading />}
          fallback={
            <>
              <AdBlocker />
              <WideSkyscraperFallback />
            </>
          }
        >
          <WideSkyscraper
            id={wideSkyscraper1Id}
            targeting={targeting}
            mediaQuery="(min-width: 1024px)"
          />
        </NitroScript>
      </div>

      {/* Main Content */}
      <div
        className={cn(
          "relative container p-4 text-center space-y-4 mb-48",
          sidebar && "xl:pl-[262px]",
        )}
      >
        {sidebar}
        {header}

        {/* Top Banner */}
        <NitroScript
          loading={<LargeMobileBannerLoading />}
          fallback={<LargeMobileBannerFallback />}
        >
          <LargeMobileBanner id={largeMobileBannerId} targeting={targeting} />
        </NitroScript>

        {content}

        {/* Bottom Banner */}
        <NitroScript
          loading={<MobileBannerLoading />}
          fallback={<MobileBannerFallback />}
        >
          <MobileBanner id={mobileBannerId} targeting={targeting} />
          <FloatingMobileBanner
            bannerId={mobileBannerId}
            videoId={mobileVideoId}
            targeting={targeting}
          />
        </NitroScript>

        {more}
      </div>

      {/* Right Ad */}
      <div>
        <NitroScript
          loading={<WideSkyscraperLoading className="min-[860px]:block" />}
          fallback={<WideSkyscraperFallback className="min-[860px]:block" />}
        >
          <WideSkyscraper id={wideSkyscraper2Id} targeting={targeting} />
        </NitroScript>
      </div>
    </div>
  );
}
