import { type Metadata } from "next";
import { generateEntryMetadata, generateGroupMetadata } from "@/components/metadata";
import { fetchDict, DEFAULT_LOCALE } from "@repo/lib";
import { APP_CONFIG } from "@/config";
import { resolveDict } from "@/components/resolve-dict";
import { Breadcrumb } from "@/components/breadcrumb";
import { DatabaseEntryContent } from "@/components/database-entry";
import { getGroupData, GroupPageContent } from "@/components/group-page";

type Params = Promise<{ id: string; locale?: string }>;

const TYPES = ["units"];
const GROUP_PREFIX = "faction_";
const SECTION = "units";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id, locale = DEFAULT_LOCALE } = await params;
  const groupData = await getGroupData(TYPES, id);
  if (groupData) return generateGroupMetadata(locale, SECTION, id, GROUP_PREFIX, SECTION);
  return generateEntryMetadata(locale, SECTION, id);
}

export default async function EntryPage({ params }: { params: Params }) {
  const { id, locale = DEFAULT_LOCALE } = await params;
  const groupData = await getGroupData(TYPES, id);

  if (groupData) {
    return (
      <GroupPageContent
        groupId={id}
        section={SECTION}
        sectionDictKey={SECTION}
        types={TYPES}
        groupLabelPrefix={GROUP_PREFIX}
        locale={locale}
      />
    );
  }

  const dict = await fetchDict(APP_CONFIG.name, locale);
  const sectionLabel = resolveDict(dict, "units");
  const entryLabel = resolveDict(dict, id);

  return (
    <>
      <Breadcrumb
        crumbs={[
          { label: sectionLabel, href: "/db/units" },
          { label: entryLabel },
        ]}
        locale={locale}
        dict={dict}
      />
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <DatabaseEntryContent id={id} typePrefix="units" locale={locale} />
      </div>
    </>
  );
}
