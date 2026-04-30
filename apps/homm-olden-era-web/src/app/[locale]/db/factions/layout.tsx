import { DEFAULT_LOCALE } from "@repo/lib";
import { DbSectionLayout } from "@/components/db-section-layout";

export default async function FactionsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const { locale = DEFAULT_LOCALE } = await params;
  return (
    <DbSectionLayout
      section="factions"
      types={["factions", "specializations", "faction_laws"]}
      groupLabelPrefix=""
      nameLabelPrefixByType={{ factions: "faction_" }}
      locale={locale}
    >
      {children}
    </DbSectionLayout>
  );
}
