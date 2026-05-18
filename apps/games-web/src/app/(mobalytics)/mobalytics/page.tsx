import { MarkersSearch } from "@repo/ui/markers-search";
import { CoordinatesProvider } from "@repo/ui/providers";
import type { Metadata } from "next";
import { fetchDict, fetchVersion, translate } from "@repo/lib";
import { FullMapDynamic } from "@repo/ui/full-map-dynamic";
import { requireApp } from "@/lib/get-app-config";

export async function generateMetadata(): Promise<Metadata> {
  const config = await requireApp("diablo4");
  return {
    alternates: { canonical: "/mobalytics" },
    title: `${config.title} Interactive Map – The Hidden Gaming Lair`,
    description:
      "Explore Diablo 4 Vessel of Hatred with this Interactive Map! Discover Tenet of Akarat, Helltide, Legion, Wandering Death, Altars of Lilith, Chests, Bosses, and more with real-time position tracking.",
    openGraph: { url: "/mobalytics" },
  };
}

export default async function Mobalytics() {
  const config = await requireApp("diablo4");
  const [version, dict] = await Promise.all([
    fetchVersion(config.name),
    fetchDict(config.name),
  ]);

  return (
    <CoordinatesProvider
      appName={config.name}
      filters={version.data.filters}
      staticDrawings={version.data.drawings}
      mapNames={Object.keys(version.data.tiles)}
      useCbor
      regions={version.data.regions}
      nodesPaths={version.more.nodes}
    >
      <div className="relative h-dscreen">
        <FullMapDynamic
          appConfig={config}
          tilesConfig={version.data.tiles}
          simple
          iconsPath={version.more.icons}
        />
        <MarkersSearch
          lastMapUpdate={version.createdAt}
          appName={config.name}
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
