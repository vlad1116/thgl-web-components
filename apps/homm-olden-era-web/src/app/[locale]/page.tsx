import { type Metadata } from "next";
import Link from "next/link";
import { fetchDatabase, fetchVersion, getUpdateMessages, DEFAULT_LOCALE, getMetadataAlternates } from "@repo/lib";
import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { ReleaseNotes } from "@repo/ui/content";
import { APP_CONFIG } from "@/config";
import { HeroSearch } from "@/components/hero-search";

type PageProps = {
  params: Promise<{ locale?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = await params;
  const title =
    "Heroes of Might & Magic: Olden Era Database — The Hidden Gaming Lair";
  const description =
    "Complete database for Heroes of Might & Magic: Olden Era — browse units, heroes, spells, artifacts, skills, and factions with stats, abilities, and cross-references.";
  const { canonical, languageAlternates } = getMetadataAlternates(
    "/",
    locale,
    APP_CONFIG.supportedLocales,
  );
  return {
    title,
    description,
    keywords: APP_CONFIG.keywords,
    alternates: { canonical, languages: languageAlternates },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [{ url: "https://oldenera.th.gl/opengraph-image.jpg", width: 1200, height: 630 }],
    },
  };
}

const DB_SECTIONS = [
  {
    href: "/db/units",
    title: "Units",
    type: "units",
    icon: "⚔",
    desc: "All units across all factions with stats, abilities, upgrade paths, and class descriptions.",
  },
  {
    href: "/db/heroes",
    title: "Heroes",
    type: "heroes",
    icon: "👑",
    desc: "Hero stats, specializations, starting armies, and skill loadouts.",
  },
  {
    href: "/db/spells",
    title: "Spells",
    type: "spells",
    icon: "✦",
    desc: "Battle and world spells across Day, Night, Primal, Space, and Neutral schools.",
  },
  {
    href: "/db/items",
    title: "Artifacts",
    type: "items",
    icon: "◆",
    desc: "Equipment, scrolls, and item sets with bonuses and upgrade scaling.",
  },
  {
    href: "/db/skills",
    title: "Skills",
    type: "skills",
    icon: "◎",
    desc: "Hero skills with progression levels, sub-skills, and unlock requirements.",
    extraTypes: ["sub_skills"],
  },
  {
    href: "/db/factions",
    title: "Factions",
    type: "factions",
    icon: "⛊",
    desc: "Faction overviews, laws, specializations, and unique mechanics.",
    extraTypes: ["specializations", "faction_laws"],
  },
];

export default async function HomePage() {
  const [database, version, updateMessages] = await Promise.all([
    fetchDatabase(APP_CONFIG.name),
    fetchVersion(APP_CONFIG.name),
    getUpdateMessages(APP_CONFIG.name),
  ]);

  const lastUpdated = version.createdAt
    ? new Date(version.createdAt)
    : null;

  // Count items per section
  const counts = new Map<string, number>();
  for (const entry of database) {
    counts.set(entry.type, (counts.get(entry.type) ?? 0) + entry.items.length);
  }

  const totalItems = Array.from(counts.values()).reduce((a, b) => a + b, 0);

  return (
    <HeaderOffset full>
      <ContentLayout
        id={APP_CONFIG.name}
        header={
          <section className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Heroes of Might & Magic: Olden Era
              </h1>
              <p className="text-lg text-amber-400">Game Database</p>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                Browse the complete database of units, heroes, spells, artifacts,
                skills, and factions. All data extracted directly from the game
                files with cross-references and localization in 14 languages.
              </p>

              {/* Stats */}
              <div className="flex items-center justify-center gap-6 pt-2 text-muted-foreground flex-wrap">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground tabular-nums">
                    {totalItems.toLocaleString()}
                  </div>
                  <div className="text-xs uppercase tracking-wider">
                    Database Entries
                  </div>
                </div>
                <div className="h-8 w-px bg-muted" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground tabular-nums">
                    {counts.size}
                  </div>
                  <div className="text-xs uppercase tracking-wider">Categories</div>
                </div>
                <div className="h-8 w-px bg-muted" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground tabular-nums">
                    14
                  </div>
                  <div className="text-xs uppercase tracking-wider">Languages</div>
                </div>
                {lastUpdated && (
                  <>
                    <div className="h-8 w-px bg-muted" />
                    <div className="text-center">
                      <div className="text-sm font-medium text-foreground">
                        {lastUpdated.toLocaleDateString("en", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-xs uppercase tracking-wider">
                        Last Updated
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Hero Search */}
            <HeroSearch />

            {/* Database Sections Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
              {DB_SECTIONS.map((section) => {
                const count =
                  (counts.get(section.type) ?? 0) +
                  (section.extraTypes?.reduce(
                    (sum, t) => sum + (counts.get(t) ?? 0),
                    0,
                  ) ?? 0);

                return (
                  <Link
                    key={section.href}
                    href={section.href}
                    className="group relative border border-slate-800 hover:border-amber-800/50 rounded-lg p-5 transition-all hover:bg-slate-900/50"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                        {section.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold group-hover:text-amber-400 transition-colors">
                            {section.title}
                          </h2>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {count}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {section.desc}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        }
        content={<ReleaseNotes updateMessages={updateMessages} />}
      />
    </HeaderOffset>
  );
}
