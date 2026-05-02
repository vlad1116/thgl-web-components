import { fetchDatabase, fetchDict, fetchVersion, getIconsUrl, DEFAULT_LOCALE } from "@repo/lib";
import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { APP_CONFIG } from "@/config";
import { DetailSidebarClient } from "@/components/detail-sidebar-client";
import { resolveDict, resolveDictWithFallback } from "@/components/resolve-dict";

type IconSprite = { url: string; x: number; y: number; width: number; height: number };

export async function buildSidebarGroups({
  types,
  groupLabelPrefix,
  locale = "en",
  nameLabelPrefixByType,
}: {
  types: string[];
  groupLabelPrefix: string;
  locale?: string;
  nameLabelPrefixByType?: Record<string, string>;
}) {
  const [dict, database, version] = await Promise.all([
    fetchDict(APP_CONFIG.name, locale),
    fetchDatabase(APP_CONFIG.name),
    fetchVersion(APP_CONFIG.name),
  ]);

  const sidebarData = database.filter((item) => types.includes(item.type));
  const hasMultipleTypes = new Set(sidebarData.map((e) => e.type)).size > 1;

  const groups = new Map<string, { id: string; name: string; icon?: IconSprite }[]>();

  for (const entry of sidebarData) {
    for (const item of entry.items) {
      const groupKey = hasMultipleTypes ? entry.type : (item.groupId ?? "other");
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      const rawIcon = item.icon && typeof item.icon === "object" ? (item.icon as IconSprite) : undefined;
      const icon = rawIcon
        ? {
            url: getIconsUrl(APP_CONFIG.name, rawIcon.url, version.more.icons),
            x: rawIcon.x,
            y: rawIcon.y,
            width: rawIcon.width,
            height: rawIcon.height,
          }
        : undefined;
      const namePrefix = nameLabelPrefixByType?.[entry.type] ?? "";
      const dictKey = namePrefix ? `${namePrefix}${item.id}` : item.id;
      groups.get(groupKey)!.push({ id: item.id, name: resolveDict(dict, dictKey), icon });
    }
  }

  // Sort groups to match the order in `types` when grouping by type
  const sortedEntries = hasMultipleTypes
    ? [...groups.entries()].sort((a, b) => types.indexOf(a[0]) - types.indexOf(b[0]))
    : [...groups.entries()];

  return sortedEntries.map(([groupId, items]) => ({
    label: groupLabelPrefix
      ? resolveDictWithFallback(dict, `${groupLabelPrefix}${groupId}`, groupId)
      : resolveDictWithFallback(dict, groupId, groupId),
    items,
  }));
}

export async function DbSectionLayout({
  children,
  section,
  types,
  groupLabelPrefix,
  locale = "en",
  nameLabelPrefixByType,
  sidebar,
}: {
  children: React.ReactNode;
  section: string;
  types: string[];
  groupLabelPrefix: string;
  locale?: string;
  nameLabelPrefixByType?: Record<string, string>;
  sidebar?: React.ReactNode;
}) {
  const resolvedSidebar = sidebar ?? (
    <DetailSidebarClient
      groups={await buildSidebarGroups({ types, groupLabelPrefix, locale, nameLabelPrefixByType })}
      section={section}
      locale={locale}
    />
  );

  return (
    <HeaderOffset full>
      <ContentLayout
        id={APP_CONFIG.name}
        sidebar={resolvedSidebar}
        header={null}
        content={children}
      />
    </HeaderOffset>
  );
}
