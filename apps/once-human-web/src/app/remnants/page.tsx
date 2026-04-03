import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { type Database } from "@repo/ui/providers";
import { fetchDatabase } from "@repo/lib";
import { JSONLDScript } from "@repo/ui/apps";
import { PageTitle } from "@repo/ui/header";
import Link from "next/link";
import { APP_CONFIG } from "@/config";

export const metadata: Metadata = {
  alternates: {
    canonical: "/remnants",
  },
  title: "All Remnants Field Guide Entries – The Hidden Gaming Lair",
  description:
    "A comprehensive list of remnants records for Once Human. It details the names, titles, authors and more details.",
  openGraph: {
    title: "All Remnants Field Guide Entries – The Hidden Gaming Lair",
    description:
      "A comprehensive list of remnants records for Once Human. It details the names, titles, authors and more details.",
    url: "/remnants",
  },
};

export default async function Remnants() {
  const database = await fetchDatabase(APP_CONFIG.name);

  const category = database.find((item) =>
    item.type.startsWith("remnants_"),
  ) as Database[number];
  if (!category) {
    notFound();
  }
  const item = category.items[0];
  if (!item) {
    notFound();
  }

  return (
    <>
      <JSONLDScript
        json={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline:
            "All Remnants Field Guide Entries – The Hidden Gaming Lair",
          description:
            "A comprehensive list of remnants records for Once Human. It details the names, titles, authors and more details.",
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
          mainEntityOfPage: "https://once-human.th.gl/remnants",
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
              name: "All Remnants Field Guide Entries",
              item: "https://once-human.th.gl/remnants",
            },
          ],
        }}
      />
      <PageTitle title="All Remnants Field Guide Entries" />
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
          <li aria-current="page">All Remnants Field Guide Entries</li>
        </ol>
      </nav>
      <div className="py-6 text-left space-y-1">
      <h3 className="uppercase text-4xl">{item.props.title}</h3>
      <p className="text-primary">{item.props.title1}</p>
      <p className="text-primary">{item.props.title2}</p>
      <p className="text-primary">{item.props.title3}</p>
      <p className="pt-8 text-muted-foreground whitespace-break-spaces">
        {item.props.content}
      </p>
      </div>
    </>
  );
}
