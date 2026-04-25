import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { fetchDatabase, fetchDict, localizePath } from "@repo/lib";
import { DatabaseSidebar } from "@/components/database-sidebar";
import { APP_CONFIG } from "@/config";
import { resolveDict, resolveDictWithFallback } from "@/components/resolve-dict";

export default async function Layout({
  params,
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const { locale = "en" } = await params;
  const enDict = await fetchDict(APP_CONFIG.name, locale);
  const database = await fetchDatabase(APP_CONFIG.name);
  const data = database.filter(
    (item) =>
      item.type === "factions" ||
      item.type === "specializations" ||
      item.type === "faction_laws",
  );

  const menu = data.map((item) => {
    return {
      category: {
        key: item.type,
        value: resolveDict(enDict, item.type),
      },
      items: item.items.map((subitem) => ({
        key: subitem.id,
        text: resolveDict(enDict, item.type === "factions" ? `faction_${subitem.id}` : subitem.id),
        href: localizePath(`/db/factions/${subitem.id}`, locale),
        subtitle: subitem.groupId ? (resolveDictWithFallback(enDict, `faction_${subitem.groupId}`, subitem.groupId)) : undefined,
      })),
    };
  });

  return (
    <HeaderOffset full>
      <ContentLayout
        id="homm-olden-era"
        header={
          <>
            <h2 className="text-2xl">{resolveDict(enDict, "factions")}</h2>
          </>
        }
        sidebar={<DatabaseSidebar menu={menu} />}
        content={children}
      />
    </HeaderOffset>
  );
}
