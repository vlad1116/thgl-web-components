import { type Metadata } from "next";
import { generateEntryMetadata } from "@/components/metadata";
import { fetchDatabase, fetchDict } from "@repo/lib";
import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { APP_CONFIG } from "@/config";
import { resolveDict } from "@/components/resolve-dict";
import { Breadcrumb } from "@/components/breadcrumb";
import { DatabaseEntryContent } from "@/components/database-entry";
import { DetailSidebar } from "@/components/detail-sidebar";

type Params = Promise<{ id: string; locale?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {  const { id, locale = "en" } = await params;  return generateEntryMetadata(locale, "spells", id);}
export default async function EntryPage({ params }: { params: Params }) {
  const { id, locale = "en" } = await params;
  const [dict, database] = await Promise.all([
    fetchDict(APP_CONFIG.name, locale),
    fetchDatabase(APP_CONFIG.name),
  ]);

  const sectionLabel = resolveDict(dict, "spells");
  const entryLabel = resolveDict(dict, id);
  const sidebarData = database.filter(
    (item) => item.type === "spells",
  );

  return (
    <HeaderOffset full>
      <ContentLayout
        id={APP_CONFIG.name}
        sidebar={
          <DetailSidebar
            entries={sidebarData}
            section="spells"
            activeId={id}
            dict={dict}
            locale={locale}
            groupLabelPrefix="ui.school_"
          />
        }
        header={
          <Breadcrumb
            crumbs={[
              { label: sectionLabel, href: "/db/spells" },
              { label: entryLabel },
            ]}
            locale={locale}
            dict={dict}
          />
        }
        content={
          <div className="max-w-7xl mx-auto px-4 pb-6">
            <DatabaseEntryContent id={id} typePrefix="spells" locale={locale} />
          </div>
        }
      />
    </HeaderOffset>
  );
}

