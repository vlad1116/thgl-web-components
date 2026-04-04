import type { Metadata } from "next";
import Link from "next/link";
import { HeaderOffset, PageTitle } from "../(header)";
import { ContentLayout } from "../(ads)";
import { NavGrid, ReleaseNotes, Subtitle } from "../(content)";
import {
  AppConfig,
  DEFAULT_LOCALE,
  fetchVersion,
  getMetadataAlternates,
  getPreviewImageUrl,
  getT,
  getUpdateMessages,
  localizePath,
} from "@repo/lib";
import type { NavCardProps } from "../(content)";
import { getFullDictionary, getStaticDictionary } from "../../dicts";
import { JSONLDScript } from "./json-ld-script";

const MAX_HOME_MAP_CARDS = 6;

type PageProps = {
  params: Promise<{ locale?: string }>;
};

export function createHomePageGenerateMetadata(appConfig: AppConfig) {
  return async function generateMetadata({
    params,
  }: PageProps): Promise<Metadata> {
    const { locale = DEFAULT_LOCALE } = await params;
    const dict = await getStaticDictionary(appConfig.name, locale);
    const t = getT(dict);

    const features =
      appConfig.internalLinks
        ?.slice(0, 3)
        .map((link) => t(link.title))
        .join(", ") ?? "";

    const keywords =
      appConfig.keywords
        .slice(0, 5)
        .map((k) => t(k))
        .join(", ") ?? "";

    const title = t("home.pageTitle", { vars: { title: appConfig.title } });
    const description = t("home.intro", {
      vars: { title: appConfig.title, features, keywords },
    });

    const { canonical, languageAlternates } = getMetadataAlternates(
      "/",
      locale,
      appConfig.supportedLocales,
    );

    return {
      title,
      description,
      keywords: appConfig.keywords.map((k) => t(k)),
      alternates: {
        canonical: canonical,
        languages: languageAlternates,
      },
      openGraph: {
        title,
        description,
        url: canonical,
        images: ["/opengraph-image.jpg"],
      },
    };
  };
}

export function createHomePage(appConfig: AppConfig) {
  return async function Home({ params }: PageProps) {
    const { locale = DEFAULT_LOCALE } = await params;
    const [dict, updateMessages, version] = await Promise.all([
      getFullDictionary(appConfig.name, locale),
      getUpdateMessages(appConfig.name),
      fetchVersion(appConfig.name),
    ]);
    const t = getT(dict);

    const features =
      appConfig.internalLinks
        ?.slice(0, 3)
        .map((link) => t(link.title))
        .join(", ") ?? "";

    const keywords = appConfig.keywords?.map((k) => t(k)).join(", ") ?? "";

    const internalLinkHrefs = new Set(
      appConfig.internalLinks?.map((link) => link.href) ?? [],
    );
    const mapNames = Object.keys(version.data.tiles);
    const mapCards: NavCardProps[] = mapNames
      .filter((map) => {
        const mapName = t(map);
        const href = `/maps/${encodeURIComponent(mapName)}`;
        return !internalLinkHrefs.has(href);
      })
      .map((map) => {
        const mapName = t(map);
        const tileUrl = version.data.tiles[map]?.url ?? "";
        // Extract tile base path from URL like "/map-tiles/0305_Forest-b12cd6b0/{z}/{y}/{x}.webp"
        const tileBase = tileUrl
          .replace(/^\/map-tiles\//, "")
          .replace(/\/\{z\}.*$/, "")
          .replace(/-[0-9a-f]{16,}$/, "");
        return {
          title: `${mapName} Map`,
          description: `Navigate ${mapName} with our interactive maps.`,
          href: `/maps/${encodeURIComponent(mapName)}`,
          iconName: "Map" as NavCardProps["iconName"],
          bgImage: tileBase ? getPreviewImageUrl(appConfig.name, tileBase) : undefined,
          linkText: `Explore the ${mapName}`,
        };
      });

    const hasCompanionApp =
      appConfig.appUrl && appConfig.appUrl.includes("companion-app");

    // Split internalLinks into map cards and feature cards
    const internalMapCards =
      appConfig.internalLinks?.filter((link) =>
        link.href?.startsWith("/maps/"),
      ) ?? [];
    const featureCards =
      appConfig.internalLinks?.filter(
        (link) => !link.href?.startsWith("/maps/"),
      ) ?? [];

    const allMapCards = [...internalMapCards, ...mapCards];
    const totalMapCount = allMapCards.length;

    // Count total location types across all filter groups
    const totalLocationTypes = version.data.filters.reduce(
      (sum, group) => sum + group.values.length,
      0,
    );

    const lastUpdated = version.createdAt
      ? new Date(version.createdAt)
      : null;

    return (
      <>
        <JSONLDScript
          json={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: `${appConfig.title} Interactive Map - The Hidden Gaming Lair`,
            url: `https://${appConfig.domain}.th.gl`,
            description: t("home.intro", {
              vars: { title: appConfig.title, features, keywords },
            }),
            publisher: {
              "@type": "Organization",
              name: "The Hidden Gaming Lair",
              url: "https://www.th.gl",
            },
          }}
        />
        <HeaderOffset full>
          <PageTitle
            title={t("home.pageTitle", { vars: { title: appConfig.title } })}
          />
          <ContentLayout
            id={appConfig.name}
            header={
              <section className="space-y-6">
                {/* Title */}
                <Subtitle
                  title={t("home.sectionTitle", {
                    vars: { title: appConfig.title },
                  })}
                />

                {/* Stats bar */}
                <div className="flex items-center justify-center gap-2 sm:gap-4 text-muted-foreground flex-wrap">
                  {totalMapCount > 0 && (
                    <div className="text-center px-3 py-1">
                      <div className="text-lg font-semibold text-foreground tabular-nums">
                        {totalMapCount}
                      </div>
                      <div className="text-xs uppercase tracking-wider">
                        {totalMapCount === 1 ? "Map" : "Maps"}
                      </div>
                    </div>
                  )}
                  {totalLocationTypes > 0 && (
                    <>
                      <div className="h-8 w-px bg-muted" />
                      <div className="text-center px-3 py-1">
                        <div className="text-lg font-semibold text-foreground tabular-nums">
                          {totalLocationTypes}
                        </div>
                        <div className="text-xs uppercase tracking-wider">
                          Location Types
                        </div>
                      </div>
                    </>
                  )}
                  {featureCards.length > 0 && (
                    <>
                      <div className="h-8 w-px bg-muted" />
                      <div className="text-center px-3 py-1">
                        <div className="text-lg font-semibold text-foreground tabular-nums">
                          {featureCards.length}
                        </div>
                        <div className="text-xs uppercase tracking-wider">
                          {featureCards.length === 1 ? "Guide" : "Guides"}
                        </div>
                      </div>
                    </>
                  )}
                  {lastUpdated && (
                    <>
                      <div className="h-8 w-px bg-muted" />
                      <div className="text-center px-3 py-1">
                        <div className="text-sm font-medium text-foreground">
                          {lastUpdated.toLocaleDateString("en", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-xs uppercase tracking-wider">
                          Last Updated
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Companion app CTA */}
                {hasCompanionApp && (
                  <a
                    href={appConfig.appUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mx-auto flex items-center gap-3 border border-muted rounded-lg px-4 py-2.5 hover:border-primary/50 transition-colors max-w-md"
                  >
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                    <span className="text-sm text-left">
                      <strong className="text-foreground block text-sm">
                        In-Game Companion App
                      </strong>
                      <span className="text-xs text-muted-foreground">
                        Live overlay with player tracking and auto-discovery
                      </span>
                    </span>
                    <span className="text-primary text-xs ml-auto shrink-0 group-hover:underline">
                      Get it free →
                    </span>
                  </a>
                )}

                {/* Map cards — show up to MAX_HOME_MAP_CARDS, link to /maps for more */}
                {allMapCards.length > 0 && (
                  <NavGrid
                    cards={allMapCards.slice(0, MAX_HOME_MAP_CARDS)}
                  />
                )}
                {allMapCards.length > MAX_HOME_MAP_CARDS && (
                  <Link
                    href={localizePath("/maps", locale)}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t("maps.viewAll", {
                      vars: { count: String(allMapCards.length) },
                      fallback: `View all ${allMapCards.length} maps`,
                    })}{" "}
                    →
                  </Link>
                )}

                {/* Feature/guide cards */}
                {featureCards.length > 0 && <NavGrid cards={featureCards} />}
              </section>
            }
            content={<ReleaseNotes updateMessages={updateMessages} />}
          />
        </HeaderOffset>
      </>
    );
  };
}
