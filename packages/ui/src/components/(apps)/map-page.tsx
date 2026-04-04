import type { Metadata } from "next";
import {
  AppConfig,
  DEFAULT_LOCALE,
  fetchVersion,
  getMapNameFromVersion,
  getMetadataAlternates,
  getOpenGraphImageUrl,
  getT,
  localizePath,
  translate,
} from "@repo/lib";
import { CoordinatesProvider } from "../(providers)";
import { HeaderOffset, PageTitle } from "../(header)";
import { FullMapDynamic } from "../(dynamic)/full-map-dynamic";
import { MarkersSearch } from "../(controls)/markers-search";
import { FloatingAds } from "../(ads)";
import { MarkerPanel } from "../(data)";
import { notFound } from "next/navigation";
import { getFullDictionary } from "../../dicts";
import { ReactNode } from "react";
import { JSONLDScript } from "./json-ld-script";
import { AdditionalTooltipType } from "../(content)";

type PageProps = {
  params: Promise<{ locale?: string; map: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function createMapPageGenerateMetadata(appConfig: AppConfig) {
  return async function generateMetadata({
    params,
  }: PageProps): Promise<Metadata> {
    const { locale = DEFAULT_LOCALE, map } = await params;

    const [dict, version] = await Promise.all([
      getFullDictionary(appConfig.name, locale),
      fetchVersion(appConfig.name),
    ]);

    const mapName = getMapNameFromVersion(version, map, dict);
    if (!mapName) {
      return {};
    }

    const t = getT(dict);

    const keywords =
      appConfig.keywords
        .slice(0, 5)
        .map((k) => t(k))
        .join(", ") ?? "";

    const title = t("map.pageTitle", {
      vars: { title: appConfig.title, map: t(mapName) },
    });
    const description = t("map.intro", {
      vars: { title: appConfig.title, keywords, map: t(mapName) },
    });

    const { canonical, languageAlternates } = getMetadataAlternates(
      `/maps/${map}`,
      locale,
      appConfig.supportedLocales,
    );

    const metaData: Metadata = {
      title: title,
      description: description,
      keywords: appConfig.keywords.map((k) => t(k)),
      alternates: {
        canonical: canonical,
        languages: languageAlternates,
      },
      openGraph: {
        title,
        description,
        url: canonical,
        images: [getOpenGraphImageUrl(appConfig.name, mapName)],
      },
    };
    return metaData;
  };
}

export function createMapPage(
  appConfig: AppConfig,
  additionalFilters?: ReactNode,
  additionalTooltip?: AdditionalTooltipType,
) {
  return async function Map({ params }: PageProps) {
    const { locale = DEFAULT_LOCALE, map } = await params;
    const [dict, version] = await Promise.all([
      getFullDictionary(appConfig.name, locale),
      fetchVersion(appConfig.name),
    ]);

    const t = getT(dict);

    const mapName = getMapNameFromVersion(version, map, dict);
    if (!mapName) {
      notFound();
    }

    let decodedMap = decodeURIComponent(map);
    if (!decodedMap.endsWith(" Map")) {
      decodedMap += " Map";
    }

    const mapTitle = t("map.pageTitle", {
      vars: { title: appConfig.title, map: decodedMap },
    });
    const mapDescription = t("map.intro", {
      vars: {
        title: appConfig.title,
        map: t(mapName),
        keywords:
          appConfig.keywords
            ?.slice(0, 5)
            .map((k) => t(k))
            .join(", ") ?? "",
      },
    });

    return (
      <>
        <JSONLDScript
          json={{
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: mapTitle,
            description: mapDescription,
            url: `https://${appConfig.domain}.th.gl${localizePath(`/maps/${map}`, locale)}`,
            isPartOf: {
              "@type": "WebSite",
              name: `${appConfig.title} Interactive Map`,
              url: `https://${appConfig.domain}.th.gl`,
            },
            dateModified: version.createdAt
              ? new Date(version.createdAt).toISOString()
              : undefined,
          }}
        />
        <JSONLDScript
          json={{
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: `https://${appConfig.domain}.th.gl${localizePath("/", locale)}`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Maps",
                item: `https://${appConfig.domain}.th.gl${localizePath("/maps", locale)}`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: t(mapName),
                item: `https://${appConfig.domain}.th.gl${localizePath(`/maps/${map}`, locale)}`,
              },
            ],
          }}
        />
        <CoordinatesProvider
          appName={appConfig.name}
          staticDrawings={version.data.drawings}
          filters={version.data.filters}
          mapNames={Object.keys(version.data.tiles)}
          useCbor
          regions={version.data.regions}
          typesIdMap={appConfig.withoutLiveMode ? {} : version.data.typesIdMap}
          nodesPaths={version.more.nodes}
          globalFilters={version.data.globalFilters}
          map={mapName}
          clusterPrecision={appConfig.markerOptions?.clusterPrecision}
        >
          <HeaderOffset full>
            <PageTitle title={mapTitle} />
            <FullMapDynamic
              appConfig={appConfig}
              tilesConfig={version.data.tiles}
              iconsPath={version.more.icons}
              additionalTooltip={additionalTooltip}
            />
            <MarkersSearch
              lastMapUpdate={version.createdAt}
              tileOptions={version.data.tiles}
              appName={appConfig.name}
              iconsPath={version.more.icons}
              additionalFilters={additionalFilters}
              mapEnTitles={Object.fromEntries(
                Object.keys(version.data.tiles).map((k) => [
                  k,
                  translate(dict, k),
                ]),
              )}
            >
              <FloatingAds id={appConfig.name} />
            </MarkersSearch>
            <MarkerPanel
              appName={appConfig.name}
              additionalTooltip={additionalTooltip}
              coordinateCopyFormat={
                appConfig.markerOptions?.coordinateCopyFormat
              }
            />
          </HeaderOffset>
        </CoordinatesProvider>
      </>
    );
  };
}
