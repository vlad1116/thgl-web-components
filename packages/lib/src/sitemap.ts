import type { MetadataRoute } from "next";
import { AppConfig, fetchDict, fetchVersion } from "./config";
import { DEFAULT_LOCALE, localizePath, translate } from "./i18n";

export function createSitemap(appConfig: AppConfig) {
  const baseUrl = `https://${appConfig.domain}.th.gl`;

  const getAlternates = (
    path: string,
  ): MetadataRoute.Sitemap[number]["alternates"] | undefined => {
    const canonical = `${baseUrl}${path}`;

    if (appConfig.supportedLocales.length <= 1) return undefined;

    const languages = Object.fromEntries([
      ...appConfig.supportedLocales.map((locale) => [
        locale,
        locale === DEFAULT_LOCALE
          ? canonical
          : `${baseUrl}${localizePath(path, locale)}`,
      ]),
      ["x-default", canonical],
    ]);
    return { languages };
  };

  return async function (): Promise<MetadataRoute.Sitemap> {
    const [version, enDict] = await Promise.all([
      fetchVersion(appConfig.name),
      fetchDict(appConfig.name),
    ]);
    const mapNames = Object.keys(version.data.tiles);

    const entries = new Map<string, MetadataRoute.Sitemap[number]>();

    // Maps
    for (const mapName of mapNames) {
      const title = translate(enDict, mapName);
      const path = `/maps/${encodeURIComponent(title)}`;
      const url = baseUrl + path;

      entries.set(url, {
        url,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
        alternates: getAlternates(path),
      });
    }

    // Internal Links
    for (const link of appConfig.internalLinks || []) {
      const path = link.href.replaceAll(/&/g, "%26");
      const url = baseUrl + path;

      if (!entries.has(url)) {
        entries.set(url, {
          url,
          lastModified: new Date(),
          changeFrequency: "daily",
          priority: 0.8,
          alternates: getAlternates(path),
        });
      }
    }

    // Guides
    if (appConfig.internalLinks?.some((link) => link.href === "/guides")) {
      for (const filter of version.data.filters) {
        // Guide group
        const groupTitle = translate(enDict, filter.group);
        const path = `/guides/${encodeURIComponent(groupTitle)}`;
        const url = baseUrl + path;

        if (!entries.has(url)) {
          entries.set(url, {
            url,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.6,
            alternates: getAlternates(path),
          });
        }

        // Guide types
        for (const value of filter.values) {
          const typeTitle = translate(enDict, value.id);
          const typePath = `/guides/${encodeURIComponent(typeTitle)}`;
          const typeUrl = baseUrl + typePath;

          if (!entries.has(typeUrl)) {
            entries.set(typeUrl, {
              url: typeUrl,
              lastModified: new Date(),
              changeFrequency: "weekly",
              priority: 0.5,
              alternates: getAlternates(typePath),
            });
          }
        }
      }
    }

    // Add homepage last
    entries.set(baseUrl, {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
      alternates: getAlternates("/"),
    });

    return Array.from(entries.values());
  };
}
