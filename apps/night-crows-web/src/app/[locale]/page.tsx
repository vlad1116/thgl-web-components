import { MarkersSearch } from "@repo/ui/markers-search";
import { FloatingAds } from "@repo/ui/ads";
import { MarkerPanel } from "@repo/ui/data";
import { CoordinatesProvider } from "@repo/ui/providers";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import type { Metadata } from "next";
import { fetchDict, fetchVersion, translate } from "@repo/lib";
import { FullMapDynamic } from "@repo/ui/full-map-dynamic";
import { APP_CONFIG } from "@/config";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  title: `${APP_CONFIG.title} Interactive Map – The Hidden Gaming Lair`,
  description: `Explore ${APP_CONFIG.title}' Interactive Maps featuring Avilius, Bastium, Celano, & Kildebat. Discover Taylor's Crow locations, Monsters, NPC's, secrets, and dungeons like Land Of Prosperity!`,
  openGraph: {
    url: `/`,
  },
};
export default async function Home() {
  const [version, dict] = await Promise.all([
    fetchVersion(APP_CONFIG.name),
    fetchDict(APP_CONFIG.name),
  ]);

  return (
    <CoordinatesProvider
      appName={APP_CONFIG.name}
      filters={version.data.filters}
      staticDrawings={version.data.drawings}
      mapNames={Object.keys(version.data.tiles)}
      useCbor
      regions={version.data.regions}
      nodesPaths={version.more.nodes}
    >
      <HeaderOffset full>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: `${APP_CONFIG.title} Interactive Map - The Hidden Gaming Lair`,
              url: `https://${APP_CONFIG.domain}.th.gl`,
              publisher: {
                "@type": "Organization",
                name: "The Hidden Gaming Lair",
                url: "https://www.th.gl",
              },
            }).replace(/</g, "\\u003c"),
          }}
        />
        <PageTitle title={`${APP_CONFIG.title} Interactive Map`} />
        <FullMapDynamic
          appConfig={APP_CONFIG}
          tilesConfig={version.data.tiles}
          iconsPath={version.more.icons}
        />
        <MarkersSearch
          lastMapUpdate={version.createdAt}
          tileOptions={version.data.tiles}
          appName={APP_CONFIG.name}
          iconsPath={version.more.icons}
          mapEnTitles={Object.fromEntries(
            Object.keys(version.data.tiles).map((k) => [
              k,
              translate(dict, k),
            ]),
          )}
        >
          <FloatingAds id={APP_CONFIG.name} />
        </MarkersSearch>
        <MarkerPanel appName={APP_CONFIG.name} />
      </HeaderOffset>
    </CoordinatesProvider>
  );
}
