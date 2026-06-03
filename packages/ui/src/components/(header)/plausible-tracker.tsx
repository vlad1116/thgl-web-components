"use client";
import { useEffect } from "react";

/**
 * Lightweight, dependency-free Plausible tracker.
 *
 * Replaces the deprecated `plausible-tracker` npm package (last release
 * 2023). It sends the same wire format that package did: a `text/plain`
 * POST to `${apiHost}/api/event` with the `{n,u,d,r,w,h,p}` payload, plus
 * automatic SPA pageviews via a `history.pushState` patch + `popstate`
 * listener. (The package's `localStorage.plausible_ignore` opt-out is
 * intentionally dropped — it was undocumented and unused here.)
 *
 * `apiHost` is configurable so all surfaces can post to an innocuous
 * subdomain (currently https://a.th.gl) that aliases the Plausible server
 * instead of the obvious metrics.th.gl. This dodges both name-based
 * ad-block heuristics and machine-wide DNS blockers (Pi-hole/AdGuard) that
 * would catch metrics.th.gl. To rotate if it gets blocked, point a new
 * subdomain at the server and change the host here / at the call sites.
 *
 * All THGL surfaces (web tenants, the thgl-app companion, and the Overwolf
 * apps) report to a single Plausible site (`domain="thgl"`) so visitor
 * counts dedup correctly across properties and we get one aggregate
 * dashboard. The individual surface is identified by `defaultProps` —
 * `app` (game/surface slug, e.g. "palia", "thgl-web") and `platform`
 * ("web" | "desktop" | "overwolf") — which are merged into EVERY event so
 * the Plausible "Properties" report can break the aggregate down per game
 * without a `(none)` bucket. Filter by `app`/`platform` to scope to one
 * surface; leave unfiltered for the THGL-wide total.
 */

type EventProps = Record<string, string | number | boolean>;

let config: {
  domain: string;
  apiHost: string;
  trackLocalhost: boolean;
  defaultProps?: EventProps;
} | null = null;
let lastActionTimestamp = 0;
const KEEP_ALIVE_TIMEOUT = 4 * 60 * 1000;
let timeoutId: ReturnType<typeof setTimeout> | null = null;

const isLocalhost = () =>
  /^localhost$|^127(?:\.[0-9]+){0,2}\.[0-9]+$|^\[::1\]$/.test(
    location.hostname,
  ) || location.protocol === "file:";

const sendEvent = (eventName: string, props?: EventProps) => {
  if (!config) {
    return;
  }
  if (!config.trackLocalhost && isLocalhost()) {
    return;
  }

  // Merge the per-surface default props (app/platform) into every event so
  // the Plausible Properties report has no `(none)` bucket. Per-event props
  // win on key collisions.
  const mergedProps = config.defaultProps
    ? { ...config.defaultProps, ...props }
    : props;

  const payload = {
    n: eventName,
    u: location.href,
    d: config.domain,
    r: document.referrer || null,
    w: window.innerWidth,
    h: 0,
    p:
      mergedProps && Object.keys(mergedProps).length > 0
        ? JSON.stringify(mergedProps)
        : undefined,
  };

  try {
    const req = new XMLHttpRequest();
    req.open("POST", `${config.apiHost}/api/event`, true);
    req.setRequestHeader("Content-Type", "text/plain");
    req.send(JSON.stringify(payload));
  } catch {
    // Network/security errors must never break the app.
  }
};

const keepAlive = () => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  const now = Date.now();
  const diff = now - lastActionTimestamp;
  if (diff > KEEP_ALIVE_TIMEOUT) {
    trackEvent("Keep Alive");
    return;
  }
  timeoutId = setTimeout(() => {
    trackEvent("Keep Alive");
  }, KEEP_ALIVE_TIMEOUT - diff);
};

export const initPlausible = (
  domain: string,
  apiHost: string,
  defaultProps?: EventProps,
) => {
  if (config) {
    return;
  }

  config = { domain, apiHost, trackLocalhost: true, defaultProps };

  // Auto pageviews: fire the initial view, then on every SPA navigation.
  // Next's App Router and the Overwolf SPAs both navigate via
  // history.pushState, so patching it (plus popstate for back/forward)
  // matches the old package's enableAutoPageviews().
  trackPageview();
  window.addEventListener("popstate", () => trackPageview());
  const originalPushState = history.pushState.bind(history);
  history.pushState = function pushState(
    ...args: Parameters<History["pushState"]>
  ) {
    originalPushState(...args);
    trackPageview();
  };

  lastActionTimestamp = Date.now();

  let isHidden = document.hidden;
  if (!isHidden) {
    keepAlive();
  }
  document.addEventListener("visibilitychange", () => {
    if (isHidden === document.hidden) {
      return;
    }
    isHidden = document.hidden;
    if (isHidden) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    } else {
      keepAlive();
    }
  });
};

export const trackEvent = (eventName: string, options?: { props?: EventProps }) => {
  if (config) {
    lastActionTimestamp = Date.now();
    sendEvent(eventName, options?.props);
    keepAlive();
  }
};

export const trackPageview = () => {
  if (config) {
    lastActionTimestamp = Date.now();
    sendEvent("pageview");
    keepAlive();
  }
};

export const trackOutboundLinkClick = (url: string) => {
  trackEvent("Outbound Link: Click", { props: { url: url } });
};

export const trackCustomEvent = (name: string, url: string) => {
  trackEvent(name, { props: { url: url } });
};

export const trackVersion = (version: string) => {
  trackEvent("Version", { props: { version: version } });
};

export function PlausibleTracker({
  domain,
  apiHost,
  version,
  app,
  platform,
}: {
  domain: string;
  apiHost: string;
  version?: string;
  /** Surface slug (e.g. "palia", "thgl-web", "thgl-app"); sent on every event. */
  app?: string;
  /** Surface type ("web" | "desktop" | "overwolf"); sent on every event. */
  platform?: string;
}) {
  useEffect(() => {
    const defaultProps: EventProps = {};
    if (app) {
      defaultProps.app = app;
    }
    if (platform) {
      defaultProps.platform = platform;
    }
    initPlausible(domain, apiHost, defaultProps);
    if (version) {
      trackVersion(version);
    }
  }, []);

  return <link rel="preconnect" href={apiHost} />;
}
