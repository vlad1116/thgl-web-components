import { type Metadata } from "next";
import { generateCategoryMetadata } from "@/components/metadata";
import { fetchDatabase, fetchDict } from "@repo/lib";
import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { APP_CONFIG } from "@/config";
import { resolveDict } from "@/components/resolve-dict";
import { Breadcrumb } from "@/components/breadcrumb";
import { EntityGrid } from "@/components/entity-grid";

type PageProps = {
  params: Promise<{ locale?: string }>;
};


export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale = "en" } = await params;
  return generateCategoryMetadata(locale, "spells");
}

export default async function Page({ params }: PageProps) {
  const { locale = "en" } = await params;
  const dict = await fetchDict(APP_CONFIG.name, locale);
  const database = await fetchDatabase(APP_CONFIG.name);
  const data = database.filter(
    (item) => item.type === "spells",
  );

  const sectionLabel = resolveDict(dict, "spells");

  return (
    <HeaderOffset full>
      <ContentLayout
        id={APP_CONFIG.name}
        header={
          <div className="max-w-7xl mx-auto px-4 pt-6">
            <Breadcrumb crumbs={[{ label: sectionLabel }]} locale={locale} dict={dict} />
            <h1 className="text-2xl font-bold mb-6">{sectionLabel}</h1>
          </div>
        }
        content={
          <div className="max-w-7xl mx-auto px-4 pb-6">
            <EntityGrid
              entries={data}
              section="spells"
              dict={dict}
              locale={locale}
              groupLabelPrefix="ui.school_"
            />
          </div>
        }
      />
    </HeaderOffset>
  );
}
