import { DEFAULT_LOCALE, fetchDatabase, fetchDict, fetchVersion, getIconsUrl } from "@repo/lib";
import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { APP_CONFIG } from "@/config";
import { DetailSidebarClient } from "@/components/detail-sidebar-client";
import { resolveDict, resolveDictWithFallback } from "@/components/resolve-dict";

type IconSprite = { url: string; x: number; y: number; width: number; height: number };

export default async function ItemsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const { locale = DEFAULT_LOCALE } = await params;
  const [dict, database, version] = await Promise.all([
    fetchDict(APP_CONFIG.name, locale),
    fetchDatabase(APP_CONFIG.name),
    fetchVersion(APP_CONFIG.name),
  ]);

  // Items grouped by slot
  const items = database.filter((e) => e.type === "items");
  const itemSets = database.filter((e) => e.type === "item_sets");

  const groups: { label: string; items: { id: string; name: string; icon?: IconSprite }[] }[] = [];

  // Item groups by slot
  const slotGroups = new Map<string, { id: string; name: string; icon?: IconSprite }[]>();
  for (const entry of items) {
    for (const item of entry.items) {
      const groupKey = item.groupId ?? "other";
      if (!slotGroups.has(groupKey)) slotGroups.set(groupKey, []);
      const rawIcon = item.icon && typeof item.icon === "object" ? (item.icon as IconSprite) : undefined;
      const icon = rawIcon
        ? { url: getIconsUrl(APP_CONFIG.name, rawIcon.url, version.more.icons), x: rawIcon.x, y: rawIcon.y, width: rawIcon.width, height: rawIcon.height }
        : undefined;
      slotGroups.get(groupKey)!.push({ id: item.id, name: resolveDict(dict, item.id), icon });
    }
  }
  // Item sets first
  if (itemSets.length > 0) {
    const setItems: { id: string; name: string; icon?: IconSprite }[] = [];
    for (const entry of itemSets) {
      for (const item of entry.items) {
        setItems.push({ id: item.id, name: resolveDict(dict, item.id) });
      }
    }
    groups.push({ label: resolveDict(dict, "item_sets"), items: setItems });
  }

  // Then items by slot
  for (const [groupId, groupItems] of slotGroups) {
    groups.push({ label: resolveDictWithFallback(dict, `ui.slot_${groupId}`, groupId), items: groupItems });
  }

  return (
    <HeaderOffset full>
      <ContentLayout
        id={APP_CONFIG.name}
        sidebar={<DetailSidebarClient groups={groups} section="artifacts" locale={locale} />}
        header={null}
        content={children}
      />
    </HeaderOffset>
  );
}
