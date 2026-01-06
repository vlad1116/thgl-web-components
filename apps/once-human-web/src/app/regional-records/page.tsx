import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { type Database } from "@repo/ui/providers";
import { fetchDatabase, fetchDict, translate } from "@repo/lib";
import { APP_CONFIG } from "@/config";

export const metadata: Metadata = {
  alternates: {
    canonical: "/regional_records",
  },
  title: "All Regional Records Field Guide Entries – The Hidden Gaming Lair",
  description:
    "A comprehensive list of regional records for Once Human. It details the names, titles, authors and more details.",
};

export default async function Remnants() {
  const [database, enDict] = await Promise.all([
    fetchDatabase(APP_CONFIG.name),
    fetchDict(APP_CONFIG.name),
  ]);

  const category = database.find((item) =>
    item.type.startsWith("regional_records_"),
  ) as Database[number] | undefined;

  if (!category) {
    notFound();
  }
  const item = category.items.at(0);
  if (!item) {
    notFound();
  }

  return (
    <div className="py-6 text-left space-y-1">
      <h3 className="uppercase text-4xl">{translate(enDict, item.props.title)}</h3>
      <p className="text-primary">{translate(enDict, item.props.title1)}</p>
      <p className="text-primary">{translate(enDict, item.props.title2)}</p>
      <p className="text-primary">{translate(enDict, item.props.title3)}</p>
      <p className="pt-8 text-muted-foreground whitespace-break-spaces">
        {translate(enDict, item.props.content)}
      </p>
    </div>
  );
}
