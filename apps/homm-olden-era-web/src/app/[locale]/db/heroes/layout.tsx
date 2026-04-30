import { DEFAULT_LOCALE } from "@repo/lib";
import { DbSectionLayout } from "@/components/db-section-layout";

export default async function HeroesLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const { locale = DEFAULT_LOCALE } = await params;
  return (
    <DbSectionLayout section="heroes" types={["heroes"]} groupLabelPrefix="faction_" locale={locale}>
      {children}
    </DbSectionLayout>
  );
}
