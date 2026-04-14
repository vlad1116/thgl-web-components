import type { MetadataRoute } from "next";
import { AppConfig, fetchDict, fetchVersion, getAppUrl } from "./config";
import { DEFAULT_LOCALE, localizePath, translate } from "./i18n";
import { decodeFromBuffer } from "./cbor";
import { type Spawn } from "./coordinates";

type NodesCoordinates = {
  type: string;
  static?: boolean;
  mapName?: string;
  spawns: (Omit<Spawn, "type" | "id"> & { id?: string })[];
}[];

type NamedMarker = {
  mapTitle: string;
  typeName: string;
  displayName: string;
  nodeId: string;
};

// Each marker generates ~(1 + locales) URL entries with alternates XML.
// Keep each sitemap chunk under ~15MB to stay within Vercel's 19MB ISR limit.
const MARKERS_PER_SITEMAP = 150;

export function createRobots(appConfig: AppConfig) {
  return function (): MetadataRoute.Robots {
    return {
      rules: {
        userAgent: "*",
        disallow: "/nodes/",
      },
      sitemap: `https://${appConfig.domain}.th.gl/sitemap.xml`,
    };
  };
}

/** Load dictionaries for all supported locales */
async function loadAllDicts(
  appName: string,
  locales: string[],
): Promise<Map<string, Record<string, string>>> {
  const dicts = new Map<string, Record<string, string>>();
  const results = await Promise.all(
    locales.map(async (locale) => {
      try {
        const dict = await fetchDict(appName, locale);
        return [locale, dict] as const;
      } catch {
        return null;
      }
    }),
  );
  for (const result of results) {
    if (result) dicts.set(result[0], result[1]);
  }
  return dicts;
}

function createHelpers(
  appConfig: AppConfig,
  allDicts?: Map<string, Record<string, string>>,
) {
  const baseUrl = `https://${appConfig.domain}.th.gl`;
  const locales = appConfig.supportedLocales;
  const hasLocales = locales.length > 1;

  /**
   * Build alternates for a path.
   * If `localizedPathFn` is provided, each locale gets a custom translated path.
   * Otherwise, the same path is used with a locale prefix.
   */
  const getAlternates = (
    path: string,
    localizedPathFn?: (locale: string) => string | null,
  ): MetadataRoute.Sitemap[number]["alternates"] | undefined => {
    const canonical = `${baseUrl}${path}`;

    if (!hasLocales) return undefined;

    const languages = Object.fromEntries([
      ...locales.map((locale) => {
        if (localizedPathFn && locale !== DEFAULT_LOCALE) {
          const lp = localizedPathFn(locale);
          if (lp) return [locale, `${baseUrl}${localizePath(lp, locale)}`];
        }
        return [
          locale,
          locale === DEFAULT_LOCALE
            ? canonical
            : `${baseUrl}${localizePath(path, locale)}`,
        ];
      }),
      ["x-default", canonical],
    ]);
    return { languages };
  };

  const now = new Date();

  /**
   * Add a sitemap entry. For entries with translated slugs (guides, markers),
   * pass `localizedPathFn` to generate per-locale paths with translated names.
   */
  const addEntry = (
    entries: Map<string, MetadataRoute.Sitemap[number]>,
    path: string,
    opts: {
      changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
      priority: number;
      /** Return locale-specific path for translated slug URLs */
      localizedPathFn?: (locale: string) => string | null;
    },
  ) => {
    const alternates = getAlternates(path, opts.localizedPathFn);

    const canonicalUrl = baseUrl + path;
    if (!entries.has(canonicalUrl)) {
      entries.set(canonicalUrl, {
        url: canonicalUrl,
        lastModified: now,
        changeFrequency: opts.changeFrequency,
        priority: opts.priority,
        alternates,
      });
    }

    if (hasLocales) {
      for (const locale of locales) {
        if (locale === DEFAULT_LOCALE) continue;
        let localePath: string;
        if (opts.localizedPathFn) {
          const lp = opts.localizedPathFn(locale);
          localePath = localizePath(lp ?? path, locale);
        } else {
          localePath = localizePath(path, locale);
        }
        const localeUrl = baseUrl + localePath;
        if (!entries.has(localeUrl)) {
          entries.set(localeUrl, {
            url: localeUrl,
            lastModified: now,
            changeFrequency: opts.changeFrequency,
            priority: opts.priority,
            alternates,
          });
        }
      }
    }
  };

  return { baseUrl, locales, hasLocales, addEntry, allDicts };
}

/** Fetch and collect all named markers across all maps */
async function collectNamedMarkers(
  appConfig: AppConfig,
  version: Awaited<ReturnType<typeof fetchVersion>>,
  enDict: Record<string, string>,
): Promise<NamedMarker[]> {
  const mapNames = Object.keys(version.data.tiles);
  const markers: NamedMarker[] = [];

  for (const mapName of mapNames) {
    const nodesPath = version.more.nodes[mapName];
    if (!nodesPath) continue;

    try {
      const url = getAppUrl(appConfig.name, nodesPath);
      const response = await fetch(url);
      if (!response.ok) continue;

      const buffer = await response.arrayBuffer();
      const nodes = decodeFromBuffer<NodesCoordinates>(
        new Uint8Array(buffer),
      );
      const mapTitle = translate(enDict, mapName);

      // Deduplicate by display name per type
      const seen = new Set<string>();

      for (const node of nodes) {
        const typeName = translate(enDict, node.type);

        for (const spawn of node.spawns) {
          // Only include spawns with a unique ID (not type@coords format)
          if (!spawn.id || spawn.id.includes("@")) continue;
          const rawId = (spawn.name ?? spawn.id).replace(/my_\d+_/, "");
          const displayName = translate(enDict, rawId);
          if (displayName === rawId || displayName === typeName) continue;

          const key = `${typeName}/${displayName}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const nodeId = `${spawn.id}@${spawn.p[0]}:${spawn.p[1]}`;

          markers.push({ mapTitle, typeName, displayName, nodeId });
        }
      }
    } catch (err) {
      console.error(`Failed to load nodes for sitemap (${mapName}):`, err);
    }
  }

  return markers;
}

/** Helper to translate a term with a specific locale dictionary, falling back to English */
function translateForLocale(
  allDicts: Map<string, Record<string, string>> | undefined,
  enDict: Record<string, string>,
  locale: string,
  key: string,
): string {
  if (locale === DEFAULT_LOCALE) return translate(enDict, key);
  const dict = allDicts?.get(locale);
  if (!dict) return translate(enDict, key);
  return translate(dict, key);
}

export function createSitemapIndex(appConfig: AppConfig) {
  const baseUrl = `https://${appConfig.domain}.th.gl`;

  return async function GET() {
    const [version, enDict] = await Promise.all([
      fetchVersion(appConfig.name),
      fetchDict(appConfig.name),
    ]);

    const markers = await collectNamedMarkers(appConfig, version, enDict);
    const markerChunks = Math.ceil(markers.length / MARKERS_PER_SITEMAP);
    const totalSitemaps = 1 + markerChunks;

    const now = new Date().toISOString();
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...Array.from({ length: totalSitemaps }, (_, i) =>
        `  <sitemap>\n    <loc>${baseUrl}/sitemap/${i}.xml</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`,
      ),
      "</sitemapindex>",
    ].join("\n");

    return new Response(xml, {
      headers: { "Content-Type": "application/xml" },
    });
  };
}

export function createGenerateSitemaps(appConfig: AppConfig) {
  return async function generateSitemaps() {
    const [version, enDict] = await Promise.all([
      fetchVersion(appConfig.name),
      fetchDict(appConfig.name),
    ]);

    const markers = await collectNamedMarkers(appConfig, version, enDict);
    const markerChunks = Math.ceil(markers.length / MARKERS_PER_SITEMAP);

    // id 0 = core pages, id 1+ = marker chunks
    return Array.from({ length: 1 + markerChunks }, (_, i) => ({ id: i }));
  };
}

export function createSitemap(appConfig: AppConfig) {
  return async function sitemap(
    props?: { id: Promise<string> } | undefined,
  ): Promise<MetadataRoute.Sitemap> {
    const id = props?.id ? Number(await props.id) : 0;

    const [version, enDict] = await Promise.all([
      fetchVersion(appConfig.name),
      fetchDict(appConfig.name),
    ]);

    // Load all locale dictionaries for translated slug URLs
    const locales = appConfig.supportedLocales;
    const hasLocales = locales.length > 1;
    const allDicts = hasLocales
      ? await loadAllDicts(appConfig.name, locales)
      : undefined;

    const { addEntry } = createHelpers(appConfig, allDicts);
    const entries = new Map<string, MetadataRoute.Sitemap[number]>();

    if (id === 0) {
      // Core pages: home, maps, guides, internal links
      const mapNames = Object.keys(version.data.tiles);

      if (mapNames.length > 0) {
        addEntry(entries, "/maps", {
          changeFrequency: "daily",
          priority: 0.8,
        });
      }

      for (const mapName of mapNames) {
        const enTitle = translate(enDict, mapName);
        const path = `/maps/${encodeURIComponent(enTitle)}`;
        addEntry(entries, path, {
          changeFrequency: "daily",
          priority: 1,
          localizedPathFn: (locale) => {
            const title = translateForLocale(allDicts, enDict, locale, mapName);
            return `/maps/${encodeURIComponent(title)}`;
          },
        });
      }

      for (const link of appConfig.internalLinks || []) {
        const path = link.href.replaceAll(/&/g, "%26");
        const url = `https://${appConfig.domain}.th.gl` + path;
        if (!entries.has(url)) {
          addEntry(entries, path, {
            changeFrequency: "daily",
            priority: 0.8,
          });
        }
      }

      if (version.data.filters.length > 0) {
        addEntry(entries, "/guides", {
          changeFrequency: "weekly",
          priority: 0.7,
        });

        for (const filter of version.data.filters) {
          const enGroupTitle = translate(enDict, filter.group);
          const groupPath = `/guides/${encodeURIComponent(enGroupTitle)}`;
          addEntry(entries, groupPath, {
            changeFrequency: "weekly",
            priority: 0.6,
            localizedPathFn: (locale) => {
              const title = translateForLocale(
                allDicts, enDict, locale, filter.group,
              );
              return `/guides/${encodeURIComponent(title)}`;
            },
          });

          for (const value of filter.values) {
            const enTypeTitle = translate(enDict, value.id);
            const typePath = `/guides/${encodeURIComponent(enTypeTitle)}`;
            addEntry(entries, typePath, {
              changeFrequency: "weekly",
              priority: 0.5,
              localizedPathFn: (locale) => {
                const title = translateForLocale(
                  allDicts, enDict, locale, value.id,
                );
                return `/guides/${encodeURIComponent(title)}`;
              },
            });
          }
        }
      }

      addEntry(entries, "/", {
        changeFrequency: "daily",
        priority: 0.9,
      });
    } else {
      // Marker chunk
      const markers = await collectNamedMarkers(appConfig, version, enDict);
      const start = (id - 1) * MARKERS_PER_SITEMAP;
      const chunk = markers.slice(start, start + MARKERS_PER_SITEMAP);

      for (const { mapTitle, typeName, displayName, nodeId } of chunk) {
        const markerPath = `/maps/${encodeURIComponent(mapTitle)}/${encodeURIComponent(typeName)}/${encodeURIComponent(displayName)}?id=${encodeURIComponent(nodeId)}`;

        // Extract raw keys for translation
        // We need to find the original dict keys from the English translations
        const mapKey = Object.entries(enDict).find(
          ([, v]) => v === mapTitle,
        )?.[0];
        const typeKey = Object.entries(enDict).find(
          ([, v]) => v === typeName,
        )?.[0];
        const nameKey = Object.entries(enDict).find(
          ([, v]) => v === displayName,
        )?.[0];

        addEntry(entries, markerPath, {
          changeFrequency: "weekly",
          priority: 0.6,
          localizedPathFn:
            mapKey && typeKey && nameKey
              ? (locale) => {
                  const lMap = translateForLocale(
                    allDicts, enDict, locale, mapKey,
                  );
                  const lType = translateForLocale(
                    allDicts, enDict, locale, typeKey,
                  );
                  const lName = translateForLocale(
                    allDicts, enDict, locale, nameKey,
                  );
                  return `/maps/${encodeURIComponent(lMap)}/${encodeURIComponent(lType)}/${encodeURIComponent(lName)}?id=${encodeURIComponent(nodeId)}`;
                }
              : undefined,
        });
      }
    }

    return Array.from(entries.values());
  };
}
