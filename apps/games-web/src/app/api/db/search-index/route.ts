import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { getAppConfig } from "@/lib/get-app-config";
import { buildHommSearchIndex } from "@/games/homm-olden-era/search-index";
import { buildBpsrSearchIndex } from "@/games/blue-protocol-star-resonance/search-index";
import { buildOnceHumanSearchIndex } from "@/games/once-human/search-index";

/**
 * Per-game header-search index. Each DB-mode game registers a builder
 * here keyed by `appConfig.name`. Hosts that don't ship a DB return
 * 404, so the client-side `<DbSearch>` can no-op on map-only sites
 * without leaking a stale homm response.
 */
const BUILDERS: Record<
  string,
  (locale: string) => Promise<{
    entries: unknown[];
    iconsUrl: string;
  }>
> = {
  "homm-olden-era": buildHommSearchIndex,
  "blue-protocol-star-resonance": buildBpsrSearchIndex,
  "once-human": buildOnceHumanSearchIndex,
};

export async function GET(request: Request) {
  const appConfig = await getAppConfig();
  const builder = BUILDERS[appConfig.name];
  if (!builder) notFound();

  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || "en";
  const payload = await builder(locale);

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
