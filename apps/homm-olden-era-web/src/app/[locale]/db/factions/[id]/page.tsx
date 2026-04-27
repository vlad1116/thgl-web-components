import { type Metadata } from "next";
import { fetchDatabase, fetchDict } from "@repo/lib";
import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { APP_CONFIG } from "@/config";
import { resolveDict } from "@/components/resolve-dict";
import { Breadcrumb } from "@/components/breadcrumb";
import { DatabaseEntryContent } from "@/components/database-entry";
import { DetailSidebar } from "@/components/detail-sidebar";
import { generateEntryMetadata } from "@/components/metadata";

type Params = Promise<{ id: string; locale?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id, locale = "en" } = await params;
  return generateEntryMetadata(locale, "factions", id);
}

export default async function EntryPage({ params }: { params: Params }) {
  const { id, locale = "en" } = await params;
  const [dict, database] = await Promise.all([
    fetchDict(APP_CONFIG.name, locale),
    fetchDatabase(APP_CONFIG.name),
  ]);

  const sectionLabel = resolveDict(dict, "factions");
  const factionLabel = resolveDict(dict, `faction_${id}`);
  const directLabel = resolveDict(dict, id);
  const entryLabel = factionLabel !== `faction_${id}` ? factionLabel : directLabel;

  // Find which type this entry belongs to, and only show that type in sidebar
  const entryType =
    database.find((e) => e.items.some((i) => i.id === id))?.type ?? "factions";
  const sidebarData = database.filter((item) => item.type === entryType);

  // Specializations group by faction, faction_laws group by faction, factions have no groupId
  const groupPrefix =
    entryType === "specializations"
      ? "faction_"
      : entryType === "faction_laws"
        ? "faction_"
        : "";

  return (
    <HeaderOffset full>
      <ContentLayout
        id={APP_CONFIG.name}
        sidebar={
          <DetailSidebar
            entries={sidebarData}
            section="factions"
            activeId={id}
            dict={dict}
            locale={locale}
            groupLabelPrefix={groupPrefix}
          />
        }
        header={
          <Breadcrumb
            crumbs={[
              { label: sectionLabel, href: "/db/factions" },
              { label: entryLabel },
            ]}
            locale={locale}
            dict={dict}
          />
        }
        content={
          <div className="max-w-7xl mx-auto px-4 pb-6">
            <DatabaseEntryContent id={id} typePrefix="factions" locale={locale} />
          </div>
        }
      />
    </HeaderOffset>
  );
}
