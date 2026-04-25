import { DatabaseEntryContent } from "@/components/database-entry";

type Params = Promise<{ id: string; locale?: string }>;

export default async function EntryPage({
  params,
}: {
  params: Params;
}) {
  const { id, locale = "en" } = await params;
  return <DatabaseEntryContent id={id} typePrefix="items" locale={locale} />;
}
