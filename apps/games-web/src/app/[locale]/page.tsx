import { fetchVersion } from "@repo/lib";
import { createHomePage, createHomePageGenerateMetadata } from "@repo/ui/apps";
import {
  createDbHomePage,
  createDbHomePageGenerateMetadata,
} from "@/lib/db/home-page";
import { getAppConfig } from "@/lib/get-app-config";

type PageProps = { params: Promise<{ locale?: string }> };

/**
 * DB-only sites (homm — has `appConfig.db` AND no map filters) render
 * the bespoke DB landing with entity-count stats. Hybrid DB sites
 * (BPSR — has both maps and DB) and pure map games fall through to
 * the standard map-home page with internalLinks + recent updates.
 *
 * Using `version.data.filters.length === 0` as the signal because a
 * map-shipped game always has filters, while a DB-only deployment
 * publishes an empty filters array.
 */
async function isDbOnly(name: string, hasDb: boolean): Promise<boolean> {
  if (!hasDb) return false;
  const version = await fetchVersion(name).catch(() => null);
  return version ? version.data.filters.length === 0 : false;
}

export async function generateMetadata(props: PageProps) {
  const config = await getAppConfig();
  const dbOnly = await isDbOnly(config.name, !!config.db);
  const factory = dbOnly
    ? createDbHomePageGenerateMetadata
    : createHomePageGenerateMetadata;
  return factory(config)(props);
}

export default async function Page(props: PageProps) {
  const config = await getAppConfig();
  const dbOnly = await isDbOnly(config.name, !!config.db);
  const factory = dbOnly ? createDbHomePage : createHomePage;
  return factory(config)(props);
}
