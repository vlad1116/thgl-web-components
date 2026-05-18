import { DEFAULT_LOCALE } from "@repo/lib";
import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { DetailSidebarClient } from "@/lib/db/detail-sidebar-client";
import { requireApp } from "@/lib/get-app-config";
import { loadQuests } from "@/games/duet-night-abyss/quests";

export default async function QuestsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  await requireApp("duet-night-abyss");
  const { locale = DEFAULT_LOCALE } = await params;
  const { groups } = await loadQuests();

  const sidebarGroups = groups
    .filter((g) => g.quests.length > 0)
    .map((g) => ({
      label: g.label,
      items: g.quests.map((q) => ({ id: q.id, name: q.props.name })),
    }));

  return (
    <HeaderOffset full>
      <ContentLayout
        id="duet-night-abyss"
        sidebar={
          <DetailSidebarClient
            groups={sidebarGroups}
            section="/db/quests"
            locale={locale}
          />
        }
        header={null}
        content={children}
      />
    </HeaderOffset>
  );
}
