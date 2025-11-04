"use client";

import { isOverwolf, useAccountStore } from "@repo/lib";
import Script from "next/script";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { create } from "zustand";
import { getNitroAds, NitroAds } from "./nitro-pay";
import { NITROPAY_SITE_ID } from "./constants";

type NitroState = 0 | 1 | 2 | 3;

// Numeric state constants to prevent adblocker scriptlet targeting
export const STATE_LOADING = 0;
export const STATE_VALIDATION = 1;
export const STATE_READY = 2;
export const STATE_ERROR = 3;

function isNitroAdsValid(): boolean {
  if (!("nitroAds" in window)) {
    return false;
  }

  const nitroAds = window.nitroAds as NitroAds;

  // Check basic properties
  if (!nitroAds || nitroAds.siteId !== NITROPAY_SITE_ID) {
    return false;
  }

  // Verify critical methods exist and are actual functions
  // AdGuard strips these while leaving siteId intact
  if (
    typeof nitroAds.createAd !== "function" ||
    nitroAds.createAd.toString().length < 1000 ||
    typeof nitroAds.addUserToken !== "function" ||
    typeof nitroAds.clearUserTokens !== "function"
  ) {
    return false;
  }

  // Check that the queue exists (NitroPay uses this for ad management)
  if (!Array.isArray(nitroAds.queue)) {
    return false;
  }

  // Verify loaded state and version
  if (typeof nitroAds.loaded !== "boolean" || !nitroAds.loaded) {
    return false;
  }

  if (
    typeof nitroAds.version !== "string" ||
    typeof nitroAds.geo !== "string" ||
    nitroAds.version.length === 0
  ) {
    return false;
  }

  return true;
}

function isNoop(fn: Function): boolean {
  const src = fn.toString().replace(/\s+/g, "");
  return (
    src === "function(){}" ||
    src === "()=>{}" ||
    src === "functionnoop(){}" ||
    (src.startsWith("functionnoop") && src.endsWith("{}"))
  );
}

function isNitroAdsManipulated(): boolean {
  if (!("nitroAds" in window)) {
    return false;
  }
  const nitroAds = window.nitroAds as NitroAds;
  if (isNoop(nitroAds.createAd) || Object.keys(nitroAds).length === 0) {
    return true;
  }
  return false;
}

export const useNitroState = create<{
  state: NitroState;
  setState: (state: NitroState) => void;
}>((set) => ({
  state: STATE_LOADING,
  setState: (state) => set({ state }),
}));

export function NitroScript({
  children,
  fallback,
  loading,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
}): JSX.Element {
  const accountHasHydrated = useAccountStore((state) => state._hasHydrated);
  const adRemoval = useAccountStore((state) => state.perks.adRemoval);
  const email = useAccountStore((state) => state.email);
  const { state, setState } = useNitroState();

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === "LINK") {
            const link = node as HTMLLinkElement;
            if (link.href.includes("nitropay.com/nitro-")) {
              link.addEventListener(
                "error",
                () => {
                  setState(STATE_ERROR);
                },
                { once: true },
              );
            }
          }
        });
      });
    });

    observer.observe(document.head, { childList: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Skip validation if user has ad removal or is on Overwolf
    if (adRemoval || isOverwolf) {
      return;
    }

    // Skip if already in error state
    if (state === STATE_ERROR || state === STATE_READY) {
      return;
    }

    // Use bit flags instead of direct state comparisons to avoid pattern matching
    let ticks = 0;
    const maxTicks = 18; // 18 * 150ms = 2700ms timeout
    const stateFlags = [state & 1, state & 2]; // Obfuscate state checks
    const ms = 150;
    const intervalId = setInterval(() => {
      ticks++;

      // Always check for manipulation, even after reaching STATE_READY
      if (isNitroAdsManipulated()) {
        setState(STATE_ERROR);
      } else if (isNitroAdsValid() && !stateFlags[1]) {
        // If valid and not ready yet, transition to ready
        // STATE_READY = 2, so !(state & 2) means not ready
        setState(STATE_READY);
      } else if (ticks > maxTicks) {
        // Timeout during initial validation phase
        // STATE_VALIDATION = 1, so (state & 1) means validating
        setState(STATE_ERROR);
      }
    }, ms);

    return () => {
      clearInterval(intervalId);
    };
  }, [state, adRemoval]);

  useEffect(() => {
    if (adRemoval || state !== STATE_READY) {
      return;
    }
    try {
      if (email) {
        // User logged in - send hashed email to NitroPay
        getNitroAds()
          .addUserToken(email, "PLAIN")
          .then(() => {
            // console.log("[NitroPay] Hashed email tracking enabled");
          })
          .catch(() => {
            // console.error("[NitroPay] Failed to add user token:", error);
          });
      } else {
        // User logged out - clear tokens
        getNitroAds().clearUserTokens();
      }
    } catch (error) {
      console.error("[NitroPay] Error managing user tokens:", error);
      setState(STATE_ERROR);
    }
  }, [state, email, adRemoval]);

  if (!accountHasHydrated) {
    return <>{loading}</>;
  }
  if (adRemoval || isOverwolf) {
    return <></>;
  }

  return (
    <>
      <Script
        onError={() => {
          setState(STATE_ERROR);
        }}
        strategy="lazyOnload"
        onReady={() => {
          if (isNitroAdsManipulated()) {
            setState(STATE_ERROR);
          } else if (isNitroAdsValid()) {
            if (isNitroAdsManipulated()) {
              setState(STATE_ERROR);
            } else {
              setState(STATE_READY);
            }
          } else {
            setState(STATE_VALIDATION);
          }
        }}
        src={`https://s.nitropay.com/ads-${NITROPAY_SITE_ID}.js`}
      />
      {state === STATE_LOADING && loading}
      {state === STATE_READY && children}
      {state === STATE_ERROR && fallback}
    </>
  );
}
