import "@/styles/globals.css";
import "@repo/ui/styles/globals.css";

import { cn, DEFAULT_LOCALE } from "@repo/lib";
import { Inter as FontSans } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { PlausibleTracker } from "@repo/ui/header";
import { I18NProvider, TooltipProvider } from "@repo/ui/providers";
import { Toaster } from "@repo/ui/controls";
import { getGlobalDictionary, getAppDictionary, isValidLocale } from "@repo/ui/dicts";
import { getCurrentVersion } from "@/version";
import { notFound } from "next/navigation";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  themeColor: "black",
};

export const metadata: Metadata = {
  metadataBase: new URL(`https://app.th.gl`),
  title: `App – The Hidden Gaming Lair`,
};
export const revalidate = 60;
export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const { locale = DEFAULT_LOCALE } = await params;
  if (locale !== DEFAULT_LOCALE && !isValidLocale(locale)) {
    notFound();
  }

  const [version, globalDict, appDict] = await Promise.all([
    getCurrentVersion(),
    getGlobalDictionary(locale),
    getAppDictionary("thgl-app", locale),
  ]);
  const dict = { ...globalDict, ...appDict };

  return (
    <html lang={locale}>
      <body
        className={cn(
          "font-sans dark h-dscreen bg-transparent text-white antialiased select-none overflow-hidden flex",
          fontSans.variable,
        )}
      >
        <I18NProvider dict={dict} locale={locale}>
          <TooltipProvider><main>{children}</main></TooltipProvider>
        </I18NProvider>
        <PlausibleTracker
          apiHost="https://metrics.th.gl"
          domain="app.th.gl"
          version={version.version}
        />
        <Toaster />
      </body>
    </html>
  );
}
