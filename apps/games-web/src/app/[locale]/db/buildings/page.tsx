import { type Metadata } from "next";
import { fetchDatabaseIndex, fetchDict, fetchVersion, DEFAULT_LOCALE } from "@repo/lib";
import { generateCategoryMetadata } from "@/games/homm-olden-era/metadata";
import { requireApp } from "@/lib/get-app-config";
import { resolveDict } from "@/lib/db/resolve-dict";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { EntityGrid } from "@/lib/db/entity-grid";
import { SectionJsonLd } from "@/lib/db/section-jsonld";

type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await requireApp("homm-olden-era");
  const { locale = DEFAULT_LOCALE } = await params;
  return generateCategoryMetadata(locale, "buildings");
}

export default async function Page({ params }: PageProps) {
  const appConfig = await requireApp("homm-olden-era");
  const { locale = DEFAULT_LOCALE } = await params;
  const [dict, database, version] = await Promise.all([
    fetchDict(appConfig.name, locale),
    fetchDatabaseIndex(appConfig.name),
    fetchVersion(appConfig.name),
  ]);
  const data = database.filter((item) => item.type === "buildings");
  const sectionLabel = resolveDict(dict, "buildings");
  const iconsHash = version.more.icons;

  return (
    <>
      <SectionJsonLd
        appConfig={appConfig}
        section="buildings"
        sectionLabel={sectionLabel}
        description={`Browse all ${sectionLabel.toLowerCase()} in ${appConfig.title}.`}
        dict={dict}
        database={database}
        types={["buildings"]}
        locale={locale}
      />
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Breadcrumb crumbs={[{ label: sectionLabel }]} locale={locale} dict={dict} />
        <h1 className="text-2xl font-bold mb-2">{sectionLabel}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Click a faction header to see its full build tree.
        </p>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <EntityGrid
          entries={data}
          section="buildings"
          dict={dict}
          locale={locale}
          groupLabelPrefix="faction_"
          linkGroups
          groupSection="factions"
          iconsHash={iconsHash}
          appName={appConfig.name}
        />
      </div>
    </>
  );
}
