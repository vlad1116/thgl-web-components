import { type Metadata } from "next";
import Link from "next/link";
import { DEFAULT_LOCALE, fetchDatabase, getMetadataAlternates } from "@repo/lib";
import { JSONLDScript } from "@repo/ui/apps";
import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { requireApp } from "@/lib/get-app-config";
import { WeaponsGrid, type WeaponItem } from "@/games/once-human/weapons-grid";
import { onceHuman } from "@/configs/once-human";

type PageProps = { params: Promise<{ locale?: string }> };

const TITLE = "All Weapons – The Hidden Gaming Lair";
const DESCRIPTION =
  "Browse all weapons in Once Human with stats, types, and rarities. Find the best weapons for your build and optimize your loadout.";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await requireApp("once-human");
  const { locale = DEFAULT_LOCALE } = await params;
  const { canonical, languageAlternates } = getMetadataAlternates(
    "/db/weapons",
    locale,
    onceHuman.supportedLocales,
  );
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical, languages: languageAlternates },
    openGraph: { title: TITLE, description: DESCRIPTION, url: canonical },
  };
}

export default async function WeaponsPage() {
  await requireApp("once-human");
  const database = await fetchDatabase("once-human");
  const cat = database.find((c) => c.type === "weapon");
  const weapons: WeaponItem[] = (cat?.items ?? []).map((item) => ({
    id: item.id,
    icon: typeof item.icon === "string" ? item.icon : "",
    name: (item.props as { name?: string }).name ?? item.id,
    quality: Number((item.props as { quality?: number }).quality ?? 1),
    durability: Number(
      (item.props as { durability?: number }).durability ?? 0,
    ),
    weight: Number((item.props as { weight?: number }).weight ?? 0),
  }));

  return (
    <>
      <JSONLDScript
        json={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: TITLE,
          description: DESCRIPTION,
          url: "https://oncehuman.th.gl/db/weapons",
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: weapons.length,
            itemListElement: weapons.slice(0, 100).map((w, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: w.name,
              url: `https://oncehuman.th.gl/db/weapons#${w.id}`,
            })),
          },
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
              item: "https://oncehuman.th.gl/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "All Weapons",
              item: "https://oncehuman.th.gl/db/weapons",
            },
          ],
        }}
      />
      <HeaderOffset full>
        <ContentLayout
          id="once-human"
          header={
            <div className="space-y-3">
              <nav
                aria-label="Breadcrumb"
                className="text-xs text-muted-foreground"
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
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  All Weapons
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {weapons.length} weapons across 5 rarities. Grouped by
                  Legendary → Common.
                </p>
              </div>
            </div>
          }
          content={<WeaponsGrid weapons={weapons} />}
        />
      </HeaderOffset>
    </>
  );
}
