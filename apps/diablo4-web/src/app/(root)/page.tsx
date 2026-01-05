import { MarkersSearch } from "@repo/ui/markers-search";
import { FloatingAds } from "@repo/ui/ads";
import { CoordinatesProvider } from "@repo/ui/providers";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import type { Metadata } from "next";
import { fetchDict, fetchVersion, translate } from "@repo/lib";
import { FullMapDynamic } from "@repo/ui/full-map-dynamic";
import { Diablo4Events } from "@repo/ui/data";
import { APP_CONFIG } from "@/config";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  title: `${APP_CONFIG.title} Interactive Map – The Hidden Gaming Lair`,
  description:
    "Explore Diablo 4 Vessel of Hatred with this Interactive Map! Discover Tenet of Akarat, Helltide, Legion, Wandering Death, Altars of Lilith, Chests, Bosses, and more with real-time position tracking.",
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
          additionalFilters={<Diablo4Events />}
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
      </HeaderOffset>
    </CoordinatesProvider>
  );
}
