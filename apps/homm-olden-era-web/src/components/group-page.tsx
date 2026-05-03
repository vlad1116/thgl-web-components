import { notFound } from "next/navigation";
import { fetchDatabase, fetchDict, DEFAULT_LOCALE } from "@repo/lib";
import { APP_CONFIG } from "@/config";
import { resolveDict, resolveDictWithFallback } from "@/components/resolve-dict";
import { Breadcrumb } from "@/components/breadcrumb";
import { EntityGrid } from "@/components/entity-grid";

/**
 * Check if the given id is a groupId in the database for the given types.
 * Returns the matching entries filtered to that group, or null if not a group.
 */
export async function getGroupData(types: string[], groupId: string) {
  const database = await fetchDatabase(APP_CONFIG.name);
  const matching = database.filter((cat) => types.includes(cat.type));

  // Check if any items have this groupId
  const hasGroup = matching.some((cat) =>
    cat.items.some((item) => item.groupId === groupId),
  );
  if (!hasGroup) return null;

  // Filter items to only this group
  const filtered = matching.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) => item.groupId === groupId),
  })).filter((cat) => cat.items.length > 0);

  return filtered;
}

export async function GroupPageContent({
  groupId,
  section,
  sectionDictKey,
  types,
  groupLabelPrefix,
  locale = DEFAULT_LOCALE,
}: {
  groupId: string;
  section: string;
  sectionDictKey: string;
  types: string[];
  groupLabelPrefix: string;
  locale?: string;
}) {
  const [dict, entries] = await Promise.all([
    fetchDict(APP_CONFIG.name, locale),
    getGroupData(types, groupId),
  ]);

  if (!entries) notFound();

  const sectionLabel = resolveDict(dict, sectionDictKey);
  const groupLabel = groupLabelPrefix
    ? resolveDictWithFallback(dict, `${groupLabelPrefix}${groupId}`, groupId)
    : resolveDictWithFallback(dict, groupId, groupId);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Breadcrumb
          crumbs={[
            { label: sectionLabel, href: `/db/${section}` },
            { label: groupLabel },
          ]}
          locale={locale}
          dict={dict}
        />
        <h1 className="text-2xl font-bold mb-6">{groupLabel}</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <EntityGrid entries={entries} section={section} dict={dict} locale={locale} />
      </div>
    </>
  );
}
