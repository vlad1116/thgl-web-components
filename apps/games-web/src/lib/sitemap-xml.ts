import type { MetadataRoute } from "next";

/**
 * Convert a Next.js MetadataRoute.Sitemap to XML.
 * Mirrors what Next.js does internally for sitemap.ts files,
 * since we can't use the convention-based sitemap with multi-tenant
 * (it requires generateSitemaps to run at build time).
 */
export function sitemapToXml(entries: MetadataRoute.Sitemap): string {
  const urls = entries
    .map((entry) => {
      const lines: string[] = ["  <url>"];
      lines.push(`    <loc>${escapeXml(entry.url)}</loc>`);
      if (entry.lastModified) {
        const date =
          entry.lastModified instanceof Date
            ? entry.lastModified
            : new Date(entry.lastModified);
        lines.push(`    <lastmod>${date.toISOString()}</lastmod>`);
      }
      if (entry.changeFrequency) {
        lines.push(`    <changefreq>${entry.changeFrequency}</changefreq>`);
      }
      if (entry.priority !== undefined) {
        lines.push(`    <priority>${entry.priority}</priority>`);
      }
      // Alternates (i18n)
      const alternates = entry.alternates?.languages;
      if (alternates) {
        for (const [lang, href] of Object.entries(alternates)) {
          if (!href) continue;
          lines.push(
            `    <xhtml:link rel="alternate" hreflang="${escapeXml(lang)}" href="${escapeXml(href)}" />`,
          );
        }
      }
      lines.push("  </url>");
      return lines.join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    urls,
    "</urlset>",
  ].join("\n");
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
