import { type Metadata } from "next";
import { generateCategoryMetadata } from "@/components/metadata";
import { fetchDatabase, fetchDict, DEFAULT_LOCALE } from "@repo/lib";
import { APP_CONFIG } from "@/config";
import { resolveDict } from "@/components/resolve-dict";
import { Breadcrumb } from "@/components/breadcrumb";
import { EntityGrid } from "@/components/entity-grid";

type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = await params;
  return generateCategoryMetadata(locale, "buildings");
}

export default async function Page({ params }: PageProps) {
  const { locale = DEFAULT_LOCALE } = await params;
  const dict = await fetchDict(APP_CONFIG.name, locale);
  const database = await fetchDatabase(APP_CONFIG.name);
  const data = database.filter((item) => item.type === "buildings");
  const sectionLabel = resolveDict(dict, "buildings");

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Breadcrumb crumbs={[{ label: sectionLabel }]} locale={locale} dict={dict} />
        <h1 className="text-2xl font-bold mb-2">{sectionLabel}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Click a faction header to see its full build tree.
        </p>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <EntityGrid entries={data} section="buildings" dict={dict} locale={locale} groupLabelPrefix="faction_" linkGroups groupSection="factions" />
      </div>
    </>
  );
}
