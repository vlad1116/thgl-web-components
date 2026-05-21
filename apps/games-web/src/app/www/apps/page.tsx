import { ClientAppsPage } from "./client";
import { PageTitle } from "@repo/ui/header";
import Link from "next/link";

export const metadata = {
  title: "Game Tools & Overlays – Interactive Maps, Apps & Trackers | TH.GL",
  description:
    "Browse Companion Apps, Overwolf tools, and web-based utilities with real-time overlays, maps, and trackers. Supports Palworld, Palia, Once Human, and more.",
  alternates: {
    canonical: "/apps",
  },
  openGraph: {
    url: "/apps",
  },
};

export default function AppsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Game Tools & Overlays – Interactive Maps, Apps & Trackers | TH.GL",
            description:
              "Browse Companion Apps, Overwolf tools, and web-based utilities with real-time overlays, maps, and trackers. Supports Palworld, Palia, Once Human, and more.",
            url: "https://www.th.gl/apps",
          }).replace(/</g, "\\u003c"),
        }}
      />
      <PageTitle title="Game Tools & Overlays" />
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground px-4">
        <ol className="flex items-center gap-1">
          <li>
            <Link
              href="/"
              className="hover:text-foreground transition-colors"
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Apps</li>
        </ol>
      </nav>
      <ClientAppsPage />
    </>
  );
}
