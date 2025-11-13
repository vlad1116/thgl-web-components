"use client";
import { useEffect } from "react";
import { getNitroAds } from "./nitro-pay";
import { ScriptLoader } from "./nitro-script";
import { THGLAppConfig } from "@repo/lib";
import dynamic from "next/dynamic";
import { IS_DEMO_MODE } from "./constants";

const MovableAdsContainer = dynamic(
  () =>
    import("./movable-ad-free-container").then(
      (mod) => mod.MovableAdsContainer,
    ),
  {
    ssr: false,
  },
);

export function THGLMapAds({
  isOverlay,
  appConfig,
}: {
  isOverlay?: boolean;
  appConfig: THGLAppConfig;
}): JSX.Element {
  const id =
    "thgl-" + appConfig.name + "-" + (isOverlay ? "overlay" : "desktop");
  return (
    <ScriptLoader
      loading={
        <NitroPayAdLoading
          id={id}
          isOverlay={isOverlay}
          appConfig={appConfig}
        />
      }
    >
      <NitroPayAd id={id} isOverlay={isOverlay} appConfig={appConfig} />
    </ScriptLoader>
  );
}

function NitroPayAd({
  id,
  isOverlay,
  appConfig,
}: {
  id: string;
  isOverlay?: boolean;
  appConfig: THGLAppConfig;
}): JSX.Element {
  useEffect(() => {
    try {
      getNitroAds().createAd(id, {
        targeting: {
          platform: "thgl-app",
          game: appConfig.name,
          view: isOverlay ? "overlay" : "desktop",
        }, // Use 'platform' as primary discriminator to avoid bleed over with web
        refreshTime: 30,
        renderVisibleOnly: false,
        outstream: "never",
        sizes: [
          ["300", "250"],
          ["320", "50"],
          ["320", "100"],
          ["336", "280"],
        ],
        report: {
          enabled: false,
          icon: false,
          wording: "Report Ad",
          position: "top-left",
        },
        skipBidders: ["google"],
        demo: IS_DEMO_MODE,
        debug: "silent",
      });
    } catch (error) {
      console.error(`[THGLMapAds] Failed to create ad ${id}:`, error);
    }
  }, [id]);

  return (
    <MovableAdsContainer
      className="right-0 bottom-0"
      transformId={appConfig.name + "-" + (isOverlay ? "overlay" : "map")}
    >
      <div className="bg-background/50 min-w-[300px] min-h-[280px]" id={id} />
    </MovableAdsContainer>
  );
}

function NitroPayAdLoading({
  id,
  isOverlay,
  appConfig,
}: {
  id: string;
  isOverlay?: boolean;
  appConfig: THGLAppConfig;
}) {
  return (
    <MovableAdsContainer
      className="right-0 bottom-0"
      transformId={appConfig.name + "-" + (isOverlay ? "overlay" : "map")}
    >
      <div className="bg-background/50 min-w-[300px] min-h-[50px]" id={id} />
    </MovableAdsContainer>
  );
}
