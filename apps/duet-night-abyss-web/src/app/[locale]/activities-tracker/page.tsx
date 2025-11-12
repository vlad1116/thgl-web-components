import { APP_CONFIG } from "@/config";
import { ContentLayout } from "@repo/ui/ads";
import { Activities, ActivityReset, CustomActivities } from "@repo/ui/data";
import { HeaderOffset } from "@repo/ui/header";
import { ActivitiesProvider, type Activity } from "@repo/ui/providers";
import { type Metadata } from "next";
import { DEFAULT_LOCALE, getMetadataAlternates } from "@repo/lib";

type PageProps = {
  params: Promise<{ locale?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = await params;

  const title = "Activities Tracker – Duet Night Abyss";
  const description =
    "Track your progress in Duet Night Abyss with this Activity Tracker. Monitor your daily and weekly activities, quests, and challenges!";

  const { canonical, languageAlternates } = getMetadataAlternates(
    "/activities-tracker",
    locale,
    APP_CONFIG.supportedLocales,
  );

  return {
    title,
    description,
    keywords: [
      ...APP_CONFIG.keywords,
      "Activities Tracker",
      "Daily Activities",
      "Weekly Activities",
      "Season Pass",
      "Guild Activities",
    ],
    alternates: {
      canonical,
      languages: languageAlternates,
    },
    openGraph: {
      title,
      description,
      url: canonical,
    },
  };
}

export default function ActivitiesTracker(): JSX.Element {
  return (
    <ActivitiesProvider activities={activities}>
      <HeaderOffset full>
        <ContentLayout
          id="duet-night-abyss"
          header={
            <>
              <h2 className="text-2xl">Activities Tracker</h2>
              <p className="text-sm">
                This tracker puts you in control of your Duet Night Abyss
                journey. Customize and track the in-game activities and
                resources that matter most to you. Keep tabs on your progress
                and optimize your gameplay.
              </p>
            </>
          }
          content={
            <div className="flex flex-col gap-4 grow">
              <div className="ml-auto flex gap-2 mt-4">
                <CustomActivities />
                <ActivityReset />
              </div>
              <Activities />
            </div>
          }
        />
      </HeaderOffset>
    </ActivitiesProvider>
  );
}

const activities: Activity[] = [
  // === DAILY ACTIVITIES ===
  // Main Activities
  {
    title: "Memo",
    category: "Main Activities",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Battlepass Missions (Daily)",
    category: "Main Activities",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Overworld Geniemon Respawn",
    category: "Main Activities",
    max: 5,
    frequently: "daily",
  },
  {
    title: "Expeditions",
    category: "Main Activities",
    max: 6,
    frequently: "daily",
  },
  {
    title: "Daily Inspiration (Battle Pass; 650 Stanza)",
    category: "Main Activities",
    max: 1,
    frequently: "daily",
  },

  // Hardcore/Optional Daily
  {
    title: "Fishing Spot 1 (30-45 mins)",
    category: "Hardcore",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Fishing Spot 2 (30-45 mins)",
    category: "Hardcore",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Fishing Spot 3 (30-45 mins)",
    category: "Hardcore",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Demon Wedge Carmine Extraction",
    category: "Hardcore",
    max: 1,
    frequently: "daily",
  },

  // === WEEKLY ACTIVITIES ===
  {
    title: "Battlepass Missions (8000 XP)",
    category: "Weekly Activities",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Bounty Commissions",
    category: "Weekly Activities",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Nocturnal Echoes",
    category: "Weekly Activities",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Mystic Maze (Trace Points + Shop)",
    category: "Weekly Activities",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Fishing Bait",
    category: "Weekly Activities",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Geniemon Mission Cap",
    category: "Weekly Activities",
    max: 20,
    frequently: "weekly",
  },
  {
    title: "II Manuals buy-out in Shop",
    category: "Weekly Activities",
    max: 15,
    frequently: "weekly",
  },

  // === SEASONAL/MONTHLY ACTIVITIES ===
  {
    title: "Immersive Theatre (Featured Repertoire)",
    category: "Seasonal",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Immersive Theatre (Immortal Repertoire)",
    category: "Seasonal",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Immersive Theatre Shop",
    category: "Seasonal",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Mystic Maze Shop (Demon Wedges)",
    category: "Seasonal",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Battlepass Progress",
    category: "Seasonal",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Fishing Shop (Seasonal Refresh)",
    category: "Seasonal",
    max: 1,
    frequently: "weekly",
  },
];
