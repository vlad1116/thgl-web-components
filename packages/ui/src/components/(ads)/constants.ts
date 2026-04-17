/**
 * Shared constants for ad components
 */

/** NitroPay site ID for The Hidden Gaming Lair */
export const NITROPAY_SITE_ID = 1487;

/** Check if running in demo/development mode */
export const IS_DEMO_MODE =
  typeof window !== "undefined" && location.href.includes("localhost");

/** Show demo ads on localhost (opt-in via localStorage) */
export const SHOW_DEMO_ADS =
  IS_DEMO_MODE &&
  typeof window !== "undefined" &&
  localStorage.getItem("SHOW_DEMO_ADS") === "true";
