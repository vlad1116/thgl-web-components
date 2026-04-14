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

// Max URLs per sitemap chunk (Google limit is 50,000, but we keep it
// lower to stay under Vercel's 19MB ISR body size limit with alternates XML)
const MARKERS_PER_SITEMAP = 200;

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

function createHelpers(appConfig: AppConfig) {
  const baseUrl = `https://${appConfig.domain}.th.gl`;
  const locales = appConfig.supportedLocales;
  const hasLocales = locales.length > 1;

  const getAlternates = (
    path: string,
  ): MetadataRoute.Sitemap[number]["alternates"] | undefined => {
    const canonical = `${baseUrl}${path}`;

    if (!hasLocales) return undefined;

    const languages = Object.fromEntries([
      ...locales.map((locale) => [
        locale,
        locale === DEFAULT_LOCALE
          ? canonical
          : `${baseUrl}${localizePath(path, locale)}`,
      ]),
      ["x-default", canonical],
    ]);
    return { languages };
  };

  const addEntry = (
    entries: Map<string, MetadataRoute.Sitemap[number]>,
    path: string,
    opts: {
      changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
      priority: number;
    },
  ) => {
    const alternates = getAlternates(path);
    const now = new Date();

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
        const localePath = localizePath(path, locale);
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

  return { baseUrl, locales, hasLocales, getAlternates, addEntry };
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
  const { addEntry } = createHelpers(appConfig);

  return async function sitemap(
    props?: { id: Promise<string> } | undefined,
  ): Promise<MetadataRoute.Sitemap> {
    const id = props?.id ? Number(await props.id) : 0;

    const [version, enDict] = await Promise.all([
      fetchVersion(appConfig.name),
      fetchDict(appConfig.name),
    ]);

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
        const title = translate(enDict, mapName);
        const path = `/maps/${encodeURIComponent(title)}`;
        addEntry(entries, path, {
          changeFrequency: "daily",
          priority: 1,
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
          const groupTitle = translate(enDict, filter.group);
          const groupPath = `/guides/${encodeURIComponent(groupTitle)}`;
          addEntry(entries, groupPath, {
            changeFrequency: "weekly",
            priority: 0.6,
          });

          for (const value of filter.values) {
            const typeTitle = translate(enDict, value.id);
            const typePath = `/guides/${encodeURIComponent(typeTitle)}`;
            addEntry(entries, typePath, {
              changeFrequency: "weekly",
              priority: 0.5,
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
        addEntry(entries, markerPath, {
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }

    return Array.from(entries.values());
  };
}
