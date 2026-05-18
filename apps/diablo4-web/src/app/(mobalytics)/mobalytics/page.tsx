import { MarkersSearch } from "@repo/ui/markers-search";
import { CoordinatesProvider } from "@repo/ui/providers";
import type { Metadata } from "next";
import { fetchDict, fetchVersion, translate } from "@repo/lib";
import { FullMapDynamic } from "@repo/ui/full-map-dynamic";
import { APP_CONFIG } from "@/config";

export const metadata: Metadata = {
  alternates: {
    canonical: "/mobalytics",
  },
  title: `${APP_CONFIG.title} Interactive Map – The Hidden Gaming Lair`,
  description:
    "Explore Diablo 4 Vessel of Hatred with this Interactive Map! Discover Tenet of Akarat, Helltide, Legion, Wandering Death, Altars of Lilith, Chests, Bosses, and more with real-time position tracking.",
  openGraph: {
    url: `/mobalytics`,
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
      <div className="relative h-dscreen">
        <FullMapDynamic
          appConfig={APP_CONFIG}
          tilesConfig={version.data.tiles}
          simple
          iconsPath={version.more.icons}
        />
        <MarkersSearch
          lastMapUpdate={version.createdAt}
          appName={APP_CONFIG.name}
          tileOptions={version.data.tiles}
          embed
          iconsPath={version.more.icons}
          mapEnTitles={Object.fromEntries(
            Object.keys(version.data.tiles).map((k) => [
              k,
              translate(dict, k),
            ]),
          )}
        />
      </div>
    </CoordinatesProvider>
  );
}
