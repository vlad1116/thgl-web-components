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

export function createSitemap(appConfig: AppConfig) {
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

  /** Add an entry for the canonical path and one per non-default locale. */
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

    // Canonical (English / default locale)
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

    // Locale-specific URLs
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

  return async function (): Promise<MetadataRoute.Sitemap> {
    const [version, enDict] = await Promise.all([
      fetchVersion(appConfig.name),
      fetchDict(appConfig.name),
    ]);
    const mapNames = Object.keys(version.data.tiles);

    const entries = new Map<string, MetadataRoute.Sitemap[number]>();

    // Maps index
    if (mapNames.length > 0) {
      addEntry(entries, "/maps", {
        changeFrequency: "daily",
        priority: 0.8,
      });
    }

    // Individual maps
    for (const mapName of mapNames) {
      const title = translate(enDict, mapName);
      const path = `/maps/${encodeURIComponent(title)}`;
      addEntry(entries, path, {
        changeFrequency: "daily",
        priority: 1,
      });
    }

    // Named markers per map
    // Limit total marker entries to keep sitemap under size limits
    // (each entry × locales × alternates XML can be very large)
    // Scale marker entries based on number of locales to stay under sitemap size limits
    // Each marker entry generates ~(1 + locales) URLs with verbose alternates XML
    const MAX_MARKER_ENTRIES = hasLocales
      ? Math.floor(200 / locales.length)
      : 500;
    let markerCount = 0;

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

        // Collect named spawns and deduplicate by display name
        const namedSpawns = new Map<
          string,
          { typeName: string; nodeId: string }
        >();

        for (const node of nodes) {
          const typeName = translate(enDict, node.type);

          for (const spawn of node.spawns) {
            // Only include spawns with a unique ID (not type@coords format)
            // that translates to a human-readable name
            if (!spawn.id || spawn.id.includes("@")) continue;
            const rawId = (spawn.name ?? spawn.id).replace(/my_\d+_/, "");
            const displayName = translate(enDict, rawId);
            if (displayName === rawId || displayName === typeName) continue;

            // Only keep the first occurrence of each display name per type
            const key = `${typeName}/${displayName}`;
            if (namedSpawns.has(key)) continue;

            const nodeId = spawn.id?.includes("@")
              ? spawn.id
              : `${spawn.id || node.type}@${spawn.p[0]}:${spawn.p[1]}`;

            namedSpawns.set(key, { typeName, nodeId });
          }
        }

        for (const [key, { typeName, nodeId }] of namedSpawns) {
          if (markerCount >= MAX_MARKER_ENTRIES) break;
          const displayName = key.slice(typeName.length + 1);
          const markerPath = `/maps/${encodeURIComponent(mapTitle)}/${encodeURIComponent(typeName)}/${encodeURIComponent(displayName)}?id=${encodeURIComponent(nodeId)}`;
          addEntry(entries, markerPath, {
            changeFrequency: "weekly",
            priority: 0.6,
          });
          markerCount++;
        }
      } catch (err) {
        console.error(`Failed to load nodes for sitemap (${mapName}):`, err);
      }
      if (markerCount >= MAX_MARKER_ENTRIES) break;
    }

    // Internal Links
    for (const link of appConfig.internalLinks || []) {
      const path = link.href.replaceAll(/&/g, "%26");
      const url = baseUrl + path;

      if (!entries.has(url)) {
        addEntry(entries, path, {
          changeFrequency: "daily",
          priority: 0.8,
        });
      }
    }

    // Guides — always include when filters exist (guides pages are generated
    // from filters regardless of whether /guides is in internalLinks)
    if (version.data.filters.length > 0) {
      addEntry(entries, "/guides", {
        changeFrequency: "weekly",
        priority: 0.7,
      });

      for (const filter of version.data.filters) {
        // Guide group
        const groupTitle = translate(enDict, filter.group);
        const groupPath = `/guides/${encodeURIComponent(groupTitle)}`;
        addEntry(entries, groupPath, {
          changeFrequency: "weekly",
          priority: 0.6,
        });

        // Guide types
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

    // Homepage
    addEntry(entries, "/", {
      changeFrequency: "daily",
      priority: 0.9,
    });

    return Array.from(entries.values());
  };
}
