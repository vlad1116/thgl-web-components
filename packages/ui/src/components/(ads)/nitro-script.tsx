"use client";

import { isOverwolf, useAccountStore } from "@repo/lib";
import Script from "next/script";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
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

  const createAd = nitroAds.createAd;

  try {
    const directStr = Function.prototype.toString.call(createAd);
    const proxyStr = createAd.toString();
    if (directStr !== proxyStr) {
      return true;
    }
  } catch {
    return true;
  }

  return false;
}

export const useNitroState = create<{
  state: NitroState;
  setState: (state: NitroState) => void;
  validationActive: boolean;
  markValidationActive: () => void;
}>((set) => ({
  state: STATE_LOADING,
  setState: (state) => set({ state }),
  validationActive: false,
  markValidationActive: () => set({ validationActive: true }),
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
  const { state, setState, markValidationActive } = useNitroState();

  // Randomly choose validation method on component mount (0, 1, or 2)
  const validationMethod = useMemo(() => Math.floor(Math.random() * 3), []);

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
    if (adRemoval || isOverwolf) return;
    if (state === STATE_ERROR || state === STATE_READY) return;

    const watchdogTimeout = setTimeout(() => {
      const isActive = useNitroState.getState().validationActive;

      // If validation flag is not set, validation is blocked
      if (!isActive) {
        setState(STATE_ERROR);
      }
    }, 1200);

    return () => clearTimeout(watchdogTimeout);
  }, [state, adRemoval]);

  // Validation using setTimeout with tick counter (Method 0)
  useEffect(() => {
    if (validationMethod !== 0) return;
    if (adRemoval || isOverwolf) return;
    if (state === STATE_ERROR || state === STATE_READY) return;

    let ticks = 25;
    const minTicks = 0;
    const stateFlags = [state & 1, state & 2];
    const ms = 100;
    let timeoutId: NodeJS.Timeout | null = null;

    const validate = () => {
      ticks = ticks - 1;
      markValidationActive();

      if (isNitroAdsManipulated()) {
        setState(STATE_ERROR);
      } else if (isNitroAdsValid()) {
        if (!stateFlags[1]) {
          setState(STATE_READY);
        }
      } else if (ticks <= minTicks) {
        setState(STATE_ERROR);
      } else {
        timeoutId = setTimeout(validate, ms);
      }
    };

    timeoutId = setTimeout(validate, ms);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [state, adRemoval, validationMethod, markValidationActive]);

  // Validation using setTimeout with Date.now (Method 1)
  useEffect(() => {
    if (validationMethod !== 1) return;
    if (adRemoval || isOverwolf) return;
    if (state === STATE_ERROR || state === STATE_READY) return;

    const stateFlags = [state & 1, state & 2];
    const maxDuration = 2500;
    const startTime = Date.now();
    let timeoutId: NodeJS.Timeout | null = null;

    const validate = () => {
      markValidationActive();
      const elapsed = Date.now() - startTime;

      if (isNitroAdsManipulated()) {
        setState(STATE_ERROR);
      } else if (isNitroAdsValid()) {
        if (!stateFlags[1]) {
          setState(STATE_READY);
        }
      } else if (elapsed > maxDuration) {
        setState(STATE_ERROR);
      } else {
        timeoutId = setTimeout(validate, 100);
      }
    };

    timeoutId = setTimeout(validate, 100);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [state, adRemoval, validationMethod, markValidationActive]);

  // Validation using requestAnimationFrame (Method 2)
  useEffect(() => {
    if (validationMethod !== 2) return;
    if (adRemoval || isOverwolf) return;
    if (state === STATE_ERROR || state === STATE_READY) return;

    const stateFlags = [state & 1, state & 2];
    const maxDuration = 2500;
    let frameId: number | null = null;

    const validate = (startTime?: number) => {
      if (!startTime) startTime = performance.now();
      markValidationActive();
      const elapsed = performance.now() - startTime;

      if (isNitroAdsManipulated()) {
        setState(STATE_ERROR);
      } else if (isNitroAdsValid()) {
        if (!stateFlags[1]) {
          setState(STATE_READY);
        }
      } else if (elapsed > maxDuration) {
        setState(STATE_ERROR);
      } else {
        frameId = requestAnimationFrame(() => validate(startTime));
      }
    };

    frameId = requestAnimationFrame(() => validate());
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [state, adRemoval, validationMethod, markValidationActive]);

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
