import { type Metadata } from "next";
import { generateCategoryMetadata } from "@/components/metadata";
import { fetchDatabase, fetchDict } from "@repo/lib";
import { HeaderOffset } from "@repo/ui/header";
import { APP_CONFIG } from "@/config";
import { resolveDict } from "@/components/resolve-dict";
import { Breadcrumb } from "@/components/breadcrumb";
import { EntityGrid } from "@/components/entity-grid";

type PageProps = {
  params: Promise<{ locale?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale = "en" } = await params;
  return generateCategoryMetadata(locale, "factions");
}

export default async function Page({ params }: PageProps) {
  const { locale = "en" } = await params;
  const dict = await fetchDict(APP_CONFIG.name, locale);
  const database = await fetchDatabase(APP_CONFIG.name);

  const factions = database.filter((item) => item.type === "factions");
  const specializations = database.filter((item) => item.type === "specializations");
  const factionLaws = database.filter((item) => item.type === "faction_laws");

  const sectionLabel = resolveDict(dict, "factions");

  return (
    <HeaderOffset full>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumb crumbs={[{ label: sectionLabel }]} locale={locale} />
        <h1 className="text-2xl font-bold mb-6">{sectionLabel}</h1>

        <EntityGrid
          entries={factions}
          section="factions"
          dict={dict}
          locale={locale}
        />

        <h2 className="text-lg font-semibold mt-8 mb-4">
          {resolveDict(dict, "specializations")}
        </h2>
        <EntityGrid
          entries={specializations}
          section="factions"
          dict={dict}
          locale={locale}
          groupLabelPrefix="faction_"
        />

        <h2 className="text-lg font-semibold mt-8 mb-4">
          {resolveDict(dict, "faction_laws")}
        </h2>
        <EntityGrid
          entries={factionLaws}
          section="factions"
          dict={dict}
          locale={locale}
          groupLabelPrefix="faction_"
        />
      </div>
    </HeaderOffset>
  );
}
