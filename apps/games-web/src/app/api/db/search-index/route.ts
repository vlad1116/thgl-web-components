import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { getAppConfig } from "@/lib/get-app-config";
import { buildHommSearchIndex } from "@/games/homm-olden-era/search-index";
import { buildBpsrSearchIndex } from "@/games/blue-protocol-star-resonance/search-index";
import { buildOnceHumanSearchIndex } from "@/games/once-human/search-index";
import { buildDnaSearchIndex } from "@/games/duet-night-abyss/search-index";
import { buildGenericSearchIndex } from "@/lib/db/generic-search-index";

/**
 * Per-game header-search index. Games with bespoke entity models register a
 * builder here keyed by `appConfig.name`; any other DB-mode tenant (e.g.
 * Gothic 1 Remake) falls back to the generic builder, which indexes every
 * database entry by name. Map-only hosts (no `appConfig.db`) return 404 so the
 * client-side `<DbSearch>` no-ops.
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
  "duet-night-abyss": buildDnaSearchIndex,
};

export async function GET(request: Request) {
  const appConfig = await getAppConfig();
  const builder = BUILDERS[appConfig.name];
  if (!builder && !appConfig.db) notFound();

  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || "en";
  const payload = builder
    ? await builder(locale)
    : await buildGenericSearchIndex(appConfig, locale);

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
