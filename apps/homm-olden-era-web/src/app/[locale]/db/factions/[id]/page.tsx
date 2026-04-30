import { type Metadata } from "next";
import { generateEntryMetadata } from "@/components/metadata";
import { fetchDict, DEFAULT_LOCALE } from "@repo/lib";
import { APP_CONFIG } from "@/config";
import { resolveDict } from "@/components/resolve-dict";
import { Breadcrumb } from "@/components/breadcrumb";
import { DatabaseEntryContent } from "@/components/database-entry";

type Params = Promise<{ id: string; locale?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id, locale = DEFAULT_LOCALE } = await params;
  return generateEntryMetadata(locale, "factions", id);
}

export default async function EntryPage({ params }: { params: Params }) {
  const { id, locale = DEFAULT_LOCALE } = await params;
  const dict = await fetchDict(APP_CONFIG.name, locale);

  const factionLabel = resolveDict(dict, `faction_${id}`);
  const directLabel = resolveDict(dict, id);
  const entryLabel = factionLabel !== `faction_${id}` ? factionLabel : directLabel;

  return (
    <>
      <Breadcrumb
        crumbs={[
          { label: resolveDict(dict, "factions"), href: "/db/factions" },
          { label: entryLabel },
        ]}
        locale={locale}
        dict={dict}
      />
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <DatabaseEntryContent id={id} typePrefix="factions" locale={locale} />
      </div>
    </>
  );
}
