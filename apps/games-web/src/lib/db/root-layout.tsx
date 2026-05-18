import "@/styles/globals.css";
import "@repo/ui/styles/globals.css";

import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Inter as FontSans } from "next/font/google";
import { AppConfig, cn, DEFAULT_LOCALE, fetchVersion } from "@repo/lib";
import { Header, Brand, Account, PlausibleTracker } from "@repo/ui/header";
import {
  Links,
  LocaleSwitcher,
  LocaleSwitcherInline,
  Toaster,
} from "@repo/ui/controls";
import { I18NProvider, TooltipProvider } from "@repo/ui/providers";
import {
  getFullDictionary,
  getStaticDictionary,
  isValidLocale,
} from "@repo/ui/dicts";
import { DbSearch } from "@/lib/db/db-search";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

/**
 * Slice the client-shipped dict down to UI strings + the dict keys
 * referenced by internalLinks/externalLinks. Keeps RSC payloads small
 * for DB sites whose full dict can be ~1MB.
 */
function sliceClientDict(
  appConfig: AppConfig,
  fullDict: Record<string, string>,
  staticDict: Record<string, string>,
): Record<string, string> {
  const result = { ...staticDict };
  for (const link of appConfig.internalLinks ?? []) {
    if (fullDict[link.title]) result[link.title] = fullDict[link.title];
    if (link.description && fullDict[link.description])
      result[link.description] = fullDict[link.description];
  }
  for (const link of appConfig.externalLinks ?? []) {
    if (fullDict[link.title]) result[link.title] = fullDict[link.title];
  }
  for (const link of appConfig.promoLinks ?? []) {
    if (fullDict[link.title]) result[link.title] = fullDict[link.title];
  }
  return result;
}

/**
 * Root layout factory for database-mode apps (e.g. homm-olden-era).
 * Differs from `createRootLayout`:
 *   - DbSearch input in the header instead of a Settings dialog button.
 *   - Drops `hasMap` Links autodetection (DB sites don't render /maps).
 *
 * Mirrors the homm-olden-era-web layout exactly so the production site
 * and the multi-tenant deployment render identically.
 */
export function createDbRootLayout(appConfig: AppConfig) {
  return async function RootLayout({
    children,
    params,
  }: {
    children: React.ReactNode;
    params: Promise<{ locale?: string }>;
  }) {
    const { locale = DEFAULT_LOCALE } = await params;

    if (!isValidLocale(locale)) {
      notFound();
    }

    const [dict, staticDict, version] = await Promise.all([
      getFullDictionary(appConfig.name, locale),
      getStaticDictionary(appConfig.name, locale),
      fetchVersion(appConfig.name),
    ]);

    const clientDict = sliceClientDict(appConfig, dict, staticDict);
    const dbConfig = appConfig.db;

    return (
      <html lang={locale}>
        <body
          className={cn(
            "font-sans dark min-h-dscreen bg-black text-white antialiased select-none",
            fontSans.variable,
          )}
        >
          <I18NProvider dict={clientDict} locale={locale}>
            <Header activeApp={appConfig.title} settingsTitle={dict["settings"]}>
              <Link
                href={locale === DEFAULT_LOCALE ? "/" : `/${locale}`}
                aria-label="Home"
              >
                <Brand title={appConfig.domain} />
              </Link>

              <Links
                appConfig={appConfig}
                childrenDropdown={
                  appConfig.supportedLocales.length > 1 ? (
                    <Suspense>
                      <LocaleSwitcherInline
                        locales={appConfig.supportedLocales}
                        current={locale}
                      />
                    </Suspense>
                  ) : undefined
                }
                hasMap={Object.keys(version.data.tiles ?? {}).length > 0}
                hasGuides={false}
              >
                {appConfig.supportedLocales.length > 1 && (
                  <Suspense>
                    <LocaleSwitcher
                      locales={appConfig.supportedLocales}
                      current={locale}
                    />
                  </Suspense>
                )}
              </Links>

              <DbSearch
                locale={locale}
                placeholder={dict["db.searchPlaceholder"] ?? "Search..."}
                typeLabels={dbConfig?.typeLabels}
                typeColors={dbConfig?.typeColors}
              />

              <Account />
            </Header>

            <TooltipProvider>
              <main>{children}</main>
            </TooltipProvider>
          </I18NProvider>

          <PlausibleTracker
            apiHost="https://metrics.th.gl"
            domain={`${appConfig.domain}.th.gl`}
          />
          <Toaster />
        </body>
      </html>
    );
  };
}
