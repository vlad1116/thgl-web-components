import { type Metadata } from "next";
import { generateEntryMetadata } from "@/components/metadata";
import { fetchDatabase, fetchDict } from "@repo/lib";
import { HeaderOffset } from "@repo/ui/header";
import { APP_CONFIG } from "@/config";
import { resolveDict } from "@/components/resolve-dict";
import { Breadcrumb } from "@/components/breadcrumb";
import { DatabaseEntryContent } from "@/components/database-entry";
import { SkillTreeSidebar } from "@/components/skill-tree";
import { buildSkillNodes } from "@/components/skill-tree-data";

type Params = Promise<{ id: string; locale?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id, locale = "en" } = await params;
  return generateEntryMetadata(locale, "skills", id);
}

export default async function EntryPage({ params }: { params: Params }) {
  const { id, locale = "en" } = await params;
  const [dict, database] = await Promise.all([
    fetchDict(APP_CONFIG.name, locale),
    fetchDatabase(APP_CONFIG.name),
  ]);

  const sectionLabel = resolveDict(dict, "skills");
  const entryLabel = resolveDict(dict, id);
  const skillNodes = await buildSkillNodes(database, dict);

  return (
    <HeaderOffset full>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumb
          crumbs={[
            { label: sectionLabel, href: "/db/skills" },
            { label: entryLabel },
          ]}
          locale={locale}
          dict={dict}
        />
        <div className="flex gap-6">
          <SkillTreeSidebar
            skills={skillNodes}
            activeId={id}
            locale={locale}
          />
          <div className="flex-1 min-w-0">
            <DatabaseEntryContent id={id} typePrefix="skills" locale={locale} />
          </div>
        </div>
      </div>
    </HeaderOffset>
  );
}
