import { AppConfig, cn, DEFAULT_LOCALE, fetchVersion } from "@repo/lib";
import { Inter as FontSans } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { Account, Brand, Header, PlausibleTracker } from "../(header)";
import { I18NProvider, TooltipProvider } from "../(providers)";
import {
  SettingsDialogContent,
  Toaster,
  Links,
  LocaleSwitcher,
} from "../(controls)";
import Link from "next/link";
import { getFullDictionary, isValidLocale } from "../../dicts";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const rootLayoutViewport: Viewport = {
  themeColor: "black",
};

export function createRootLayoutMetadata(appConfig: AppConfig): Metadata {
  return {
    metadataBase: new URL(`https://${appConfig.domain}.th.gl`),
    title: `${appConfig.title} – The Hidden Gaming Lair`,
    authors: [{ name: "DevLeon", url: "https://github.com/lmachens" }],
    twitter: {
      card: "summary_large_image",
    },
  };
}

export function createRootLayout(appConfig: AppConfig) {
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

    const [dict, version] = await Promise.all([
      getFullDictionary(appConfig.name, locale),
      fetchVersion(appConfig.name),
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
              activeApp={appConfig.title}
              settingsDialogContent={
                <SettingsDialogContent
                  activeApp={appConfig.name}
                  filters={version.data.filters}
                />
              }
            >
              <Link
                href={locale === DEFAULT_LOCALE ? "/" : `/${locale}`}
                aria-label="Home"
              >
                <Brand title={appConfig.domain} />
              </Link>

              <Links appConfig={appConfig}>
                {appConfig.supportedLocales.length > 1 && (
                  <Suspense>
                    <LocaleSwitcher
                      locales={appConfig.supportedLocales}
                      current={locale}
                    />
                  </Suspense>
                )}
              </Links>

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
