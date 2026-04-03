import { HeaderOffset, PageTitle } from "@repo/ui/header";
import { type Metadata } from "next";
import { ContentLayout } from "@repo/ui/ads";
import { JSONLDScript } from "@repo/ui/apps";
import { notFound } from "next/navigation";
import { fetchDatabase, fetchDict } from "@repo/lib";
import { type Database } from "@repo/ui/providers";
import Link from "next/link";
import { APP_CONFIG } from "@/config";
import { DataTableColumns } from "./columns";

export const metadata: Metadata = {
  alternates: {
    canonical: "/weapons",
  },
  title: "All Weapons – The Hidden Gaming Lair",
  description:
    "Browse all weapons in Once Human with stats, types, and details. Find the best weapons for your build and optimize your loadout.",
  openGraph: {
    title: "All Weapons – The Hidden Gaming Lair",
    description: "A comprehensive list of weapons for Once Human.",
    url: "/weapons",
  },
};

export default async function Weapons() {
  const database = await fetchDatabase(APP_CONFIG.name);
  const enDict = await fetchDict(APP_CONFIG.name);

  const category = database.find(
    (item) => item.type === `weapon`,
  ) as Database[number];
  if (!category) {
    notFound();
  }
  const data = category.items
    .map((item) => ({
      icon: item.icon!,
      name: item.props.name as string,
      ...item.props,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <JSONLDScript
        json={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "All Weapons – The Hidden Gaming Lair",
          description: "A comprehensive list of weapons for Once Human.",
          author: {
            "@type": "Organization",
            name: "The Hidden Gaming Lair",
            url: "https://www.th.gl",
          },
          publisher: {
            "@type": "Organization",
            name: "The Hidden Gaming Lair",
            url: "https://www.th.gl",
          },
          mainEntityOfPage: "https://once-human.th.gl/weapons",
        }}
      />
      <JSONLDScript
        json={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://once-human.th.gl/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "All Weapons",
              item: "https://once-human.th.gl/weapons",
            },
          ],
        }}
      />
      <HeaderOffset full>
        <PageTitle title="All Weapons" />
        <nav
          aria-label="Breadcrumb"
          className="text-xs text-muted-foreground px-4 py-2"
        >
          <ol className="flex items-center gap-1">
            <li>
              <Link
                href="/"
                className="hover:text-foreground transition-colors"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">All Weapons</li>
          </ol>
        </nav>
        <ContentLayout
          id="once-human"
          header={
            <>
              <h2 className="text-2xl">All Weapons</h2>
              <p className="text-sm">
                A comprehensive list of weapons for Once Human.
              </p>
            </>
          }
          content={
            <DataTableColumns data={data} database={database} enDict={enDict} />
          }
        />
      </HeaderOffset>
    </>
  );
}
