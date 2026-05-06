import { type Metadata } from "next";
import { generateCategoryMetadata } from "@/components/metadata";
import { fetchDatabaseIndex, fetchDict, fetchVersion, DEFAULT_LOCALE } from "@repo/lib";
import { APP_CONFIG } from "@/config";
import { resolveDict } from "@/components/resolve-dict";
import { Breadcrumb } from "@/components/breadcrumb";
import { EntityGrid } from "@/components/entity-grid";

type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = await params;
  return generateCategoryMetadata(locale, "factions");
}

export default async function Page({ params }: PageProps) {
  const { locale = DEFAULT_LOCALE } = await params;
  const [dict, database, version] = await Promise.all([
    fetchDict(APP_CONFIG.name, locale),
    fetchDatabaseIndex(APP_CONFIG.name),
    fetchVersion(APP_CONFIG.name),
  ]);

  const factions = database.filter((item) => item.type === "factions");
  const specializations = database.filter((item) => item.type === "specializations");
  const factionLaws = database.filter((item) => item.type === "faction_laws");
  const sectionLabel = resolveDict(dict, "factions");
  const iconsHash = version.more.icons;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Breadcrumb crumbs={[{ label: sectionLabel }]} locale={locale} dict={dict} />
        <h1 className="text-2xl font-bold mb-6">{sectionLabel}</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <EntityGrid entries={factions} section="factions" dict={dict} locale={locale} nameLabelPrefix="faction_" iconsHash={iconsHash} />

        <h2 className="text-lg font-semibold mt-8 mb-4">
          {resolveDict(dict, "specializations")}
        </h2>
        <EntityGrid entries={specializations} section="factions" dict={dict} locale={locale} groupLabelPrefix="faction_" iconsHash={iconsHash} />

        <h2 className="text-lg font-semibold mt-8 mb-4">
          {resolveDict(dict, "faction_laws")}
        </h2>
        <EntityGrid entries={factionLaws} section="factions" dict={dict} locale={locale} groupLabelPrefix="faction_" iconsHash={iconsHash} />
      </div>
    </>
  );
}
