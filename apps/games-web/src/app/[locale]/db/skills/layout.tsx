import { DEFAULT_LOCALE, fetchDatabaseIndex, fetchDatabaseType, fetchDict } from "@repo/lib";
import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { requireApp } from "@/lib/get-app-config";
import { SkillTreeSidebar } from "@/games/homm-olden-era/skill-tree";
import { buildSkillNodes } from "@/games/homm-olden-era/skill-tree-data";

export default async function SkillsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const appConfig = await requireApp("homm-olden-era");
  const { locale = DEFAULT_LOCALE } = await params;
  const [dict, skillsCat, indexDb] = await Promise.all([
    fetchDict(appConfig.name, locale),
    fetchDatabaseType(appConfig.name, "skills"),
    fetchDatabaseIndex(appConfig.name),
  ]);
  const skillNodes = await buildSkillNodes(
    [skillsCat, ...indexDb.filter((c) => c.type === "sub_skills")],
    dict,
  );

  return (
    <HeaderOffset full>
      <ContentLayout
        id={appConfig.name}
        sidebar={<SkillTreeSidebar skills={skillNodes} locale={locale} />}
        header={null}
        content={children}
      />
    </HeaderOffset>
  );
}
