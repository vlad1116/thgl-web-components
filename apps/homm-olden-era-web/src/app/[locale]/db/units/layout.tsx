import { fetchDatabase, fetchDict, fetchVersion, getIconsUrl, DEFAULT_LOCALE } from "@repo/lib";
import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { APP_CONFIG } from "@/config";
import { DetailSidebarClient } from "@/components/detail-sidebar-client";
import { resolveDict, resolveDictWithFallback } from "@/components/resolve-dict";

export default async function UnitsLayout({
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

  const sidebarData = database.filter((item) => item.type === "units");

  // Pre-resolve sidebar data
  const groups = new Map<string, { id: string; name: string; icon?: { url: string; x: number; y: number; width: number; height: number } }[]>();

  for (const entry of sidebarData) {
    for (const item of entry.items) {
      const groupKey = item.groupId ?? "other";
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      const icon = item.icon && typeof item.icon === "object"
        ? {
            url: getIconsUrl(APP_CONFIG.name, (item.icon as any).url, version.more.icons),
            x: (item.icon as any).x,
            y: (item.icon as any).y,
            width: (item.icon as any).width,
            height: (item.icon as any).height,
          }
        : undefined;
      groups.get(groupKey)!.push({
        id: item.id,
        name: resolveDict(dict, item.id),
        icon,
      });
    }
  }

  const resolvedGroups = Array.from(groups.entries()).map(([groupId, items]) => ({
    label: resolveDictWithFallback(dict, `faction_${groupId}`, groupId),
    items,
  }));

  return (
    <HeaderOffset full>
      <ContentLayout
        id={APP_CONFIG.name}
        sidebar={
          <DetailSidebarClient
            groups={resolvedGroups}
            section="units"
            locale={locale}
          />
        }
        header={null}
        content={children}
      />
    </HeaderOffset>
  );
}
