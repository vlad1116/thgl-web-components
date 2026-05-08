import { createSitemap } from "@repo/lib";
import { getAppConfig } from "@/lib/get-app-config";
import { sitemapToXml } from "@/lib/sitemap-xml";

export const dynamic = "force-dynamic";

/**
 * Serves /sitemap/0.xml, /sitemap/1.xml, etc.
 * The sitemap chunk count is determined by createGenerateSitemaps and
 * referenced from /sitemap.xml (the index). Each chunk lists up to ~150
 * URL entries (with their alternates).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const config = await getAppConfig();
  const { id: idParam } = await params;
  const id = idParam.replace(/\.xml$/, "");

  const sitemap = createSitemap(config);
  const entries = await sitemap({ id: Promise.resolve(id) });

  return new Response(sitemapToXml(entries), {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "CDN-Cache-Control": "public, s-maxage=3600",
    },
  });
}
