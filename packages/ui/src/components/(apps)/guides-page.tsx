import type { Metadata } from "next";
import Link from "next/link";
import {
  AppConfig,
  DEFAULT_LOCALE,
  fetchDict,
  fetchVersion,
  getIconsUrl,
  getMetadataAlternates,
  getT,
  IconSprite,
  localizePath,
  translate,
} from "@repo/lib";
import { HeaderOffset, PageTitle } from "../(header)";
import { ContentLayout } from "../(ads)";
import { Subtitle } from "../(content)";
import { getFullDictionary, getStaticDictionary } from "../../dicts";
import { JSONLDScript } from "./json-ld-script";

type PageProps = {
  params: Promise<{ locale?: string }>;
};

export function createGuidesPageGenerateMetadata(appConfig: AppConfig) {
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

    const title = t("guides.pageTitle", { vars: { title: appConfig.title } });
    const description = t("guides.intro", {
      vars: { title: appConfig.title, features },
    });

    const { canonical, languageAlternates } = getMetadataAlternates(
      "/guides",
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
      },
    };
    return metaData;
  };
}

export function createGuidesPage(appConfig: AppConfig) {
  return async function GuidesPage({ params }: PageProps) {
    const { locale = DEFAULT_LOCALE } = await params;
    const [dict, version, enDict] = await Promise.all([
      getFullDictionary(appConfig.name, locale),
      fetchVersion(appConfig.name),
      fetchDict(appConfig.name),
    ]);
    const t = getT(dict);

    // Deduplicate filter values by translated label — different IDs can share
    // the same display name (e.g. "Sword" in Rare/Epic/Legendary categories).
    // Collect which groups each type appears in for display on the card.
    const seenLabels = new Map<string, { groups: string[] }>();
    const guideTypes: {
      type: string;
      label: string;
      description: string;
      icon: IconSprite | undefined;
      groups: string[];
    }[] = [];
    for (const filter of version.data.filters) {
      for (const v of filter.values) {
        const enLabel = translate(enDict, v.id);
        const groupLabel = t(filter.group, { fallback: filter.group });
        const existing = seenLabels.get(enLabel);
        if (existing) {
          // Add group if not already listed
          if (!existing.groups.includes(groupLabel)) {
            existing.groups.push(groupLabel);
          }
          continue;
        }
        const groups = [groupLabel];
        seenLabels.set(enLabel, { groups });
        guideTypes.push({
          type: v.id,
          label: t(v.id),
          description: t("guides.typeDescription", {
            vars: { type: t(v.id), title: appConfig.title },
          }),
          icon: typeof v.icon === "object" ? (v.icon as IconSprite) : undefined,
          groups,
        });
      }
    }

    // Deduplicate groups by translated label
    const seenGroupLabels = new Set<string>();
    const guideGroups: {
      type: string;
      label: string;
      description: string;
      icon: null;
      groups: string[];
    }[] = [];
    for (const filter of version.data.filters) {
      const enGroupLabel = translate(enDict, filter.group);
      if (seenGroupLabels.has(enGroupLabel)) continue;
      seenGroupLabels.add(enGroupLabel);
      guideGroups.push({
        type: filter.group,
        label: t(filter.group),
        description: t("guides.typeDescription", {
          vars: {
            type: t(filter.group),
            title: appConfig.title,
          },
        }),
        icon: null,
        groups: [],
      });
    }

    const allGuides = [...guideGroups, ...guideTypes];

    return (
      <>
        <JSONLDScript
          json={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: allGuides.map((g, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: g.label,
              url: `https://${appConfig.domain}.th.gl${localizePath(`/guides/${translate(enDict, g.type)}`, locale)}`,
            })),
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
                name: "Guides",
                item: `https://${appConfig.domain}.th.gl${localizePath("/guides", locale)}`,
              },
            ],
          }}
        />

        <HeaderOffset full>
          <PageTitle
            title={t("guides.pageTitle", { vars: { title: appConfig.title } })}
          />
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground px-4 py-2">
            <ol className="flex items-center gap-1">
              <li>
                <Link href={localizePath("/", locale)} className="hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">Guides</li>
            </ol>
          </nav>
          <ContentLayout
            id={appConfig.name}
            header={
              <>
                <Subtitle title={t("guides.title")} />
                <p className="text-sm mt-2">
                  {t.rich("guides.description", {
                    components: { title: <strong>{appConfig.title}</strong> },
                  })}
                </p>
              </>
            }
            content={
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {allGuides.map((guide) => (
                  <li
                    key={guide.type}
                    className="border rounded-lg p-4 hover:shadow transition"
                  >
                    <Link
                      href={localizePath(
                        `/guides/${encodeURIComponent(translate(enDict, guide.type))}`,
                        locale,
                      )}
                      className="block"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {guide.icon && (
                          <img
                            alt=""
                            role="presentation"
                            className="shrink-0 object-none w-[64px] h-[64px]"
                            src={getIconsUrl(
                              appConfig.name,
                              guide.icon.url,
                              version.more.icons,
                            )}
                            width={guide.icon.width}
                            height={guide.icon.height}
                            style={{
                              objectPosition: `-${guide.icon.x}px -${guide.icon.y}px`,
                              zoom: 0.35,
                            }}
                          />
                        )}
                        <h2 className="text-lg font-semibold">{guide.label}</h2>
                      </div>
                      <p className="text-sm text-muted-foreground text-left">
                        {guide.description}
                      </p>
                      {guide.groups.length > 1 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {guide.groups.map((g) => (
                            <span
                              key={g}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            }
          />
        </HeaderOffset>
      </>
    );
  };
}
