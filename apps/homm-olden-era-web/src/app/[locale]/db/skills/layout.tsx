import { DEFAULT_LOCALE, fetchDatabaseIndex, fetchDatabaseType, fetchDict } from "@repo/lib";
import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { APP_CONFIG } from "@/config";
import { SkillTreeSidebar } from "@/components/skill-tree";
import { buildSkillNodes } from "@/components/skill-tree-data";

export default async function SkillsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const { locale = DEFAULT_LOCALE } = await params;
  const [dict, skillsCat, indexDb] = await Promise.all([
    fetchDict(APP_CONFIG.name, locale),
    fetchDatabaseType(APP_CONFIG.name, "skills"),
    fetchDatabaseIndex(APP_CONFIG.name),
  ]);
  const skillNodes = await buildSkillNodes(
    [skillsCat, ...indexDb.filter((c) => c.type === "sub_skills")],
    dict,
  );

  return (
    <HeaderOffset full>
      <ContentLayout
        id={APP_CONFIG.name}
        sidebar={<SkillTreeSidebar skills={skillNodes} locale={locale} />}
        header={null}
        content={children}
      />
    </HeaderOffset>
  );
}
