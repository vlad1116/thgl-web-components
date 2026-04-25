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
import { getFullDictionary, isValidLocale } from "@repo/ui/dicts";
import { Header, Brand, Account, PlausibleTracker } from "@repo/ui/header";
import { Links, SettingsDialogContent, LocaleSwitcher, Toaster } from "@repo/ui/controls";
import { I18NProvider, TooltipProvider } from "@repo/ui/providers";
import { DbSearchWrapper } from "@/components/db-search-wrapper";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const viewport: Viewport = { themeColor: "black" };

export const metadata = createRootLayoutMetadata(APP_CONFIG);

export const revalidate = 60;

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

  const [dict, version] = await Promise.all([
    getFullDictionary(APP_CONFIG.name, locale),
    fetchVersion(APP_CONFIG.name),
  ]);

  return (
    <html lang={locale}>
      <body
        className={cn(
          "font-sans dark min-h-dscreen bg-black text-white antialiased select-none",
          fontSans.variable,
        )}
      >
        <I18NProvider dict={dict} locale={locale}>
          <Header
            activeApp={APP_CONFIG.title}
            settingsDialogContent={
              <SettingsDialogContent
                activeApp={APP_CONFIG.name}
                filters={version.data.filters}
              />
            }
          >
            <Link href={locale === DEFAULT_LOCALE ? "/" : `/${locale}`}>
              <Brand title={APP_CONFIG.domain} />
            </Link>

            <Links appConfig={APP_CONFIG} hideReleaseNotes>
              {APP_CONFIG.supportedLocales.length > 1 && (
                <Suspense>
                  <LocaleSwitcher
                    locales={APP_CONFIG.supportedLocales}
                    current={locale}
                  />
                </Suspense>
              )}
            </Links>

            {/* Database Search */}
            <Suspense>
              <DbSearchWrapper locale={locale} />
            </Suspense>

            {APP_CONFIG.supportedLocales.length > 1 && (
              <div className="hidden md:flex">
                <Suspense>
                  <LocaleSwitcher
                    locales={APP_CONFIG.supportedLocales}
                    current={locale}
                  />
                </Suspense>
              </div>
            )}

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
