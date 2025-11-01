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

  const title = "Activities Tracker – Blue Protocol: Star Resonance";
  const description =
    "Track your progress in Blue Protocol: Star Resonance with this Activity Tracker. Monitor your daily and weekly activities, quests, and challenges!";

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
          id="blue-protocol-star-resonance"
          header={
            <>
              <h2 className="text-2xl">Activities Tracker</h2>
              <p className="text-sm">
                This tracker puts you in control of your Blue Protocol: Star
                Resonance journey. Customize and track the in-game activities
                and resources that matter most to you. Keep tabs on your
                progress and optimize your gameplay.
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
    title: "Season Pass EXP (500 points goal)",
    category: "Main Activities",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Bureau Commissions",
    category: "Main Activities",
    max: 3,
    frequently: "daily",
  },
  {
    title: "Unstable Space Daily Dungeon",
    category: "Main Activities",
    max: 2,
    frequently: "daily",
  },
  {
    title: "Life Skill Stamina (400 used)",
    category: "Main Activities",
    max: 1,
    frequently: "daily",
  },
  {
    title: "World Boss Keys",
    category: "Main Activities",
    max: 2,
    frequently: "daily",
  },
  {
    title: "Elite Monster Keys",
    category: "Main Activities",
    max: 2,
    frequently: "daily",
  },
  {
    title: "Mystery Shop Refresh",
    category: "Main Activities",
    max: 1,
    frequently: "daily",
  },
  {
    title: "World Boss Crusade",
    category: "Main Activities",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Guild Check-in",
    category: "Guild",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Guild Cargo",
    category: "Guild",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Alchemy Daily Experimentation",
    category: "Main Activities",
    max: 1,
    frequently: "daily",
  },
  {
    title: "World Boss Drops",
    category: "Main Activities",
    max: 50,
    frequently: "daily",
  },

  // Leisure Activities
  {
    title: "Dance Novice",
    category: "Leisure",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Street Theater",
    category: "Leisure",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Ancient City Patrol",
    category: "Leisure",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Brigand Camp Control",
    category: "Leisure",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Muku Camp Control",
    category: "Leisure",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Starlight Fireworks",
    category: "Leisure",
    max: 1,
    frequently: "daily",
  },
  {
    title: "City Rally",
    category: "Leisure",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Wasteland Race",
    category: "Leisure",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Friendship Activity",
    category: "Leisure",
    max: 1,
    frequently: "weekly",
  },

  // Optional
  {
    title: "Homestead (Life Skill Materials)",
    category: "Optional",
    max: 1,
    frequently: "daily",
  },

  // Special Days
  {
    title: "Guild Dance (Friday)",
    category: "Guild",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Guild Hunt (Weekend)",
    category: "Guild",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Guild Activity",
    category: "Guild",
    max: 1,
    frequently: "weekly",
  },

  // === WEEKLY ACTIVITIES ===
  // Dungeons & Combat
  {
    title: "Stimen Vaults (Bi-weekly)",
    category: "Dungeons",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "World Boss Crusade Path (1200 Points)",
    category: "Dungeons",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Pioneer",
    category: "Dungeons",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Dragon Runs",
    category: "Dungeons",
    max: 9,
    frequently: "weekly",
  },
  {
    title: "Dungeon Clears (Reforge Cap)",
    category: "Dungeons",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Friendship Support",
    category: "Dungeons",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Bane Lord",
    category: "Dungeons",
    max: 5,
    frequently: "weekly",
  },

  // Shops
  {
    title: "Guild Shop",
    category: "Shops",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Friendship Shop",
    category: "Shops",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Honor Shop",
    category: "Shops",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Reputation Shop",
    category: "Shops",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Catch-up Shop",
    category: "Shops",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Season Shop",
    category: "Shops",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Orb Shop",
    category: "Shops",
    max: 1,
    frequently: "weekly",
  },

  // NPC Exchanges
  {
    title: "Module from Gear NPC",
    category: "NPC Exchanges",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Luna Bag from Gear NPC",
    category: "NPC Exchanges",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Life Skill Supply Collector Side Quests",
    category: "NPC Exchanges",
    max: 9,
    frequently: "weekly",
  },

  // Events

  {
    title: "Halloween Quest",
    category: "Events",
    max: 1,
    frequently: "daily",
  },
];
