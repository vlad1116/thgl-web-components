"use client";
import { useEffect } from "react";
import { getNitroAds } from "./nitro-pay";
import { ScriptLoader } from "./nitro-script";
import { AdFreeContainer } from "./ad-free-container";
import { IS_DEMO_MODE } from "./constants";

const id = "thgl-dashboard";
export function THGLDashboardAds({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <ScriptLoader
      loading={<NitroPayResponsiveLoading id={id} className={className} />}
      fallback={<NitroPayResponsiveLoading id={id} className={className} />}
    >
      <NitroPayResponsive id={id} className={className} />
    </ScriptLoader>
  );
}

function NitroPayResponsive({
  id,
  className,
}: {
  id: string;
  className?: string;
}): JSX.Element {
  useEffect(() => {
    try {
      getNitroAds().createAd(id, {
        targeting: { platform: "thgl-app", component: "dashboard" }, // Use 'platform' as primary discriminator
        refreshTime: 30,
        renderVisibleOnly: false,
        sizes: [
          ["300", "600"],
          ["300", "250"],
          ["320", "50"],
          ["320", "100"],
          ["336", "280"],
        ],
        report: {
          enabled: true,
          icon: true,
          wording: "Report Ad",
          position: "bottom-right",
        },
        skipBidders: ["google"],
        demo: IS_DEMO_MODE,
        debug: "silent",
      });
    } catch (error) {
      console.error(`[THGLDashboardAds] Failed to create ad ${id}:`, error);
    }
  }, [id]);

  return (
    <AdFreeContainer noBorder className={`h-full ${className}`}>
      <div className="w-full shrink-0 min-h-[280px]" id={id} />
    </AdFreeContainer>
  );
}

function NitroPayResponsiveLoading({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  return (
    <AdFreeContainer noBorder className={`h-full overflow-hidden ${className}`}>
      <div className="w-full shrink-0 min-h-[280px]" id={id} />
    </AdFreeContainer>
  );
}
