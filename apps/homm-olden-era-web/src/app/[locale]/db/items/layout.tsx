import { DEFAULT_LOCALE } from "@repo/lib";
import { DbSectionLayout } from "@/components/db-section-layout";

export default async function ItemsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const { locale = DEFAULT_LOCALE } = await params;
  return (
    <DbSectionLayout section="items" types={["items"]} groupLabelPrefix="ui.slot_" locale={locale}>
      {children}
    </DbSectionLayout>
  );
}
