import type { MetadataRoute } from "next";
import { AppConfig, fetchDict, fetchVersion } from "./config";
import { DEFAULT_LOCALE, localizePath, translate } from "./i18n";

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
