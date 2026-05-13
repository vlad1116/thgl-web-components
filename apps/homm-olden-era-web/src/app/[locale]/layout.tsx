import "@/styles/globals.css";
import "@repo/ui/styles/globals.css";

import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Inter as FontSans } from "next/font/google";
import type { Viewport } from "next";
import { APP_CONFIG } from "@/config";
import { createRootLayoutMetadata } from "@repo/ui/apps";
import { DEFAULT_LOCALE, cn, fetchVersion } from "@repo/lib";
import {
  getFullDictionary,
  getStaticDictionary,
  isValidLocale,
} from "@repo/ui/dicts";
import { Header, Brand, Account, PlausibleTracker } from "@repo/ui/header";
import {
  Links,
  LocaleSwitcher,
  LocaleSwitcherInline,
  Toaster,
} from "@repo/ui/controls";
import { I18NProvider, TooltipProvider } from "@repo/ui/providers";
import { DbSearch } from "@/components/db-search";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const viewport: Viewport = { themeColor: "black" };

export const metadata = createRootLayoutMetadata(APP_CONFIG);

export const revalidate = 60;

/** Extract only the dict keys needed by client components.
 * The full dict includes ~6,000+ game entity keys (unit names, spell descriptions, etc.)
 * that are only used by server components. Client components only need UI/nav/config strings.
 * We include all static dict keys (global + app UI strings) and config link keys,
 * but exclude the CDN-fetched game dict (entity names, descriptions).
 */
function sliceClientDict(
  fullDict: Record<string, string>,
  staticDict: Record<string, string>,
): Record<string, string> {
  // Start with the static dict (global UI strings + app-specific UI strings)
  // This includes: release.*, adblocker.*, adfree.*, settings, account, home.title,
  // legal_notice, privacy_policy, config.internalLinks.*, etc.
  const result = { ...staticDict };
  // Add any config link keys that might come from the CDN dict
  for (const link of APP_CONFIG.internalLinks ?? []) {
    if (fullDict[link.title]) result[link.title] = fullDict[link.title];
    if (link.description && fullDict[link.description])
      result[link.description] = fullDict[link.description];
  }
  for (const link of APP_CONFIG.externalLinks ?? []) {
    if (fullDict[link.title]) result[link.title] = fullDict[link.title];
  }
  for (const link of APP_CONFIG.promoLinks ?? []) {
    if (fullDict[link.title]) result[link.title] = fullDict[link.title];
  }
  return result;
}

export default async function RootLayout({
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
    getFullDictionary(APP_CONFIG.name, locale),
    getStaticDictionary(APP_CONFIG.name, locale),
    fetchVersion(APP_CONFIG.name),
  ]);

  const clientDict = sliceClientDict(dict, staticDict);

  return (
    <html lang={locale}>
      <body
        className={cn(
          "font-sans dark min-h-dscreen bg-black text-white antialiased select-none",
          fontSans.variable,
        )}
      >
        <I18NProvider dict={clientDict} locale={locale}>
          <Header activeApp={APP_CONFIG.title}>
            <Link
              href={locale === DEFAULT_LOCALE ? "/" : `/${locale}`}
              aria-label="Home"
            >
              <Brand title={APP_CONFIG.domain} />
            </Link>

            <Links
              appConfig={APP_CONFIG}
              childrenDropdown={
                APP_CONFIG.supportedLocales.length > 1 ? (
                  <Suspense>
                    <LocaleSwitcherInline
                      locales={APP_CONFIG.supportedLocales}
                      current={locale}
                    />
                  </Suspense>
                ) : undefined
              }
              hasMap={false}
            >
              {APP_CONFIG.supportedLocales.length > 1 && (
                <Suspense>
                  <LocaleSwitcher
                    locales={APP_CONFIG.supportedLocales}
                    current={locale}
                  />
                </Suspense>
              )}
            </Links>

            <DbSearch locale={locale} />

            <Account />
          </Header>

          <TooltipProvider>
            <main>{children}</main>
          </TooltipProvider>
        </I18NProvider>

        <PlausibleTracker
          apiHost="https://metrics.th.gl"
          domain={`${APP_CONFIG.domain}.th.gl`}
        />
        <Toaster />
      </body>
    </html>
  );
}
