import { MarkersSearch } from "@repo/ui/markers-search";
import { FloatingAds } from "@repo/ui/ads";
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
  title: "Satisfactory Interactive Map – The Hidden Gaming Lair",
  description:
    "Explore Satisfactory 1.0 with this Interactive Map! Showcasing all resources, collectibles, artifacts, and more!",
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
      mapNames={Object.keys(version.data.tiles)}
      useCbor
      regions={version.data.regions}
      typesIdMap={version.data.typesIdMap}
      nodesPaths={version.more.nodes}
      staticDrawings={version.data.drawings}
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
          iconsPath={version.more.icons}
          mapEnTitles={Object.fromEntries(
            Object.keys(version.data.tiles).map((k) => [k, translate(dict, k)]),
          )}
        >
          <FloatingAds id={APP_CONFIG.name} />
        </MarkersSearch>
      </HeaderOffset>
    </CoordinatesProvider>
  );
}
