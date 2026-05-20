import { createSitemapIndex } from "@repo/lib";
import { notFound } from "next/navigation";
import { getAppConfig } from "@/lib/get-app-config";

export async function GET() {
  const config = await getAppConfig();
  // thgl-app has no public sitemap — it's a webview surface for the
  // native client, not search-indexed. The default sitemap builder
  // would try to fetch a CDN version.json that doesn't exist for the
  // app tenant and 500.
  if (config.name === "thgl-app") notFound();
  return createSitemapIndex(config)();
}
