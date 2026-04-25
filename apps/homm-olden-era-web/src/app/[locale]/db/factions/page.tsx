import { DatabaseEntryContent } from "@/components/database-entry";

type PageProps = {
  params: Promise<{ locale?: string }>;
};

export default async function Page({ params }: PageProps) {
  const { locale = "en" } = await params;
  return <DatabaseEntryContent typePrefix="factions" locale={locale} />;
}
