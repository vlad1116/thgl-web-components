import { type AppConfig } from "@repo/lib";

/**
 * Minimal AppConfig for the THGLApp companion's webview surface
 * (loaded at https://app.th.gl by the native client at runtime).
 *
 * This is NOT a public game site like the other tenants — the routes
 * live in a sibling `(app)` route group with its own bare root
 * layout, and host-gating in middleware prevents the dashboard /
 * overlay / controller / elevation-prompt URLs from resolving on any
 * other tenant.
 *
 * The `internalLinks` / `keywords` etc. are kept empty since the home
 * card layout is never rendered here.
 */
export const thglApp: AppConfig = {
  name: "thgl-app",
  title: "THGL App",
  domain: "app",
  supportedLocales: [
    "en",
    "de",
    "es",
    "fr",
    "it",
    "ja",
    "ko",
    "pt-BR",
    "zh-CN",
    "zh-TW",
  ],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [],
  externalLinks: [],
  keywords: [],
};
