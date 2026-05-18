import "@/styles/globals.css";
import "@repo/ui/styles/globals.css";

import { cn, Dict, fetchDict, fetchVersion } from "@repo/lib";
import { Inter as FontSans } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { PlausibleTracker } from "@repo/ui/header";
import { I18NProvider, TooltipProvider } from "@repo/ui/providers";
import { Toaster } from "@repo/ui/controls";
import enDictGlobal from "@repo/ui/dicts/en.json" assert { type: "json" };
import { requireApp } from "@/lib/get-app-config";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  themeColor: "black",
};

export async function generateMetadata(): Promise<Metadata> {
  const config = await requireApp("diablo4");
  return {
    metadataBase: new URL(`https://${config.domain}.th.gl`),
    title: `${config.title} – The Hidden Gaming Lair`,
  };
}

export const revalidate = 60;

/**
 * Separate root layout for the Mobalytics partner embed. No header /
 * brand / account — Mobalytics renders this inside their own chrome.
 * Plausible domain gets the `-mobalytics` suffix so iframe traffic is
 * tracked independently from the standalone diablo4 site.
 *
 * The route is gated to the `diablo4` host via `requireApp` (called
 * from the page), so requests from any other tenant return 404.
 */
export default async function MobalyticsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await requireApp("diablo4");
  const [, enDict] = await Promise.all([
    fetchVersion(config.name),
    fetchDict(config.name),
  ]);
  const enDictMerged = {
    ...enDictGlobal,
    ...enDict,
  } as Dict;

  return (
    <html lang="en">
      <body
        className={cn(
          "font-sans dark min-h-dscreen bg-black text-white antialiased select-none",
          fontSans.variable,
        )}
      >
        <I18NProvider dict={enDictMerged}>
          <TooltipProvider>
            <main>{children}</main>
          </TooltipProvider>
        </I18NProvider>
        <PlausibleTracker
          apiHost="https://metrics.th.gl"
          domain={`${config.domain}.th.gl-mobalytics`}
        />
        <Toaster />
      </body>
    </html>
  );
}
