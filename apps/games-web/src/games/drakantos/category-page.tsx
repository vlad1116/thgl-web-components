import { type Metadata } from "next";
import {
  fetchDatabaseIndex,
  fetchVersion,
  DEFAULT_LOCALE,
} from "@repo/lib";
import { getFullDictionary } from "@repo/ui/dicts";
import { generateCategoryMetadata } from "./metadata";
import { requireApp } from "@/lib/get-app-config";
import { resolveDict } from "@/lib/db/resolve-dict";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { EntityGrid } from "@/lib/db/entity-grid";
import { SectionJsonLd } from "@/lib/db/section-jsonld";

type PageProps = { params: Promise<{ locale?: string }> };

/**
 * Factory: returns Next.js page + generateMetadata for a Drakantos DB
 * section. Each `/db/<section>/page.tsx` is a 3-line wrapper around this.
 *
 * @param section URL slug AND the corresponding database `type` value (e.g.
 *                "items" maps to `database.json` entries with `type: "items"`)
 * @param extraTypes Additional types to include in the same section (e.g.
 *                   `"outfits"` section also shows effects + distances).
 */
export function makeCategoryPage(section: string, extraTypes: string[] = []) {
  const allTypes = [section, ...extraTypes];

  async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    await requireApp("drakantos");
    const { locale = DEFAULT_LOCALE } = await params;
    return generateCategoryMetadata(locale, section);
  }

  async function Page({ params }: PageProps) {
    const appConfig = await requireApp("drakantos");
    const { locale = DEFAULT_LOCALE } = await params;
    const [dict, database, version] = await Promise.all([
      getFullDictionary(appConfig.name, locale),
      fetchDatabaseIndex(appConfig.name),
      fetchVersion(appConfig.name),
    ]);
    const data = database.filter((cat) => allTypes.includes(cat.type));
    const sectionLabel = resolveDict(
      dict,
      `config.internalLinks.${section}.title`,
    );
    const iconsHash = version.more.icons;
    const totalCount = data.reduce((sum, cat) => sum + cat.items.length, 0);

    return (
      <>
        <SectionJsonLd
          appConfig={appConfig}
          section={section}
          sectionLabel={sectionLabel}
          description={`Browse all ${sectionLabel.toLowerCase()} in ${appConfig.title}.`}
          dict={dict}
          database={database}
          types={allTypes}
          locale={locale}
        />
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <Breadcrumb
            crumbs={[{ label: sectionLabel }]}
            locale={locale}
            dict={dict}
          />
          <h1 className="text-2xl font-bold mb-2">{sectionLabel}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {totalCount.toLocaleString()} entries
          </p>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-6">
          <EntityGrid
            entries={data}
            section={section}
            dict={dict}
            locale={locale}
            iconsHash={iconsHash}
            appName={appConfig.name}
          />
        </div>
      </>
    );
  }

  return { Page, generateMetadata };
}
