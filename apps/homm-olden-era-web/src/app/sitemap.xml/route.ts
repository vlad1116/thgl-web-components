import type { MetadataRoute } from "next";
import { fetchDatabaseIndex } from "@repo/lib";
import { APP_CONFIG } from "@/config";

const ENTRIES_PER_CHUNK = 150;
const SKIP_TYPES = new Set(["item_sets"]);

export async function GET() {
  const baseUrl = `https://${APP_CONFIG.domain}.th.gl`;
  const database = await fetchDatabaseIndex(APP_CONFIG.name);

  let dbEntryCount = 0;
  for (const group of database) {
    if (group.type.startsWith("_")) continue;
    if (!SKIP_TYPES.has(group.type)) {
      dbEntryCount += group.items.length;
    }
  }

  const dbChunks = Math.ceil(dbEntryCount / ENTRIES_PER_CHUNK);
  const total = 1 + dbChunks; // chunk 0 = core pages, 1..N = db entries

  const now = new Date().toISOString();
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...Array.from({ length: total }, (_, i) =>
      `  <sitemap>\n    <loc>${baseUrl}/sitemap/${i}.xml</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`,
    ),
    "</sitemapindex>",
  ].join("\n");

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
