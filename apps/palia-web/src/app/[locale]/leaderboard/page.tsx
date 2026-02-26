import { ExternalAnchor, HeaderOffset } from "@repo/ui/header";
import { type Metadata } from "next";
import { ContentLayout } from "@repo/ui/ads";
import { ExternalLink } from "lucide-react";
import { getT, getMetadataAlternates } from "@repo/lib";
import { APP_CONFIG } from "@/config";
import { getStaticDictionary } from "@repo/ui/dicts";
import LeaderboardContent from "./leaderboard-content";
import type { Player } from "./leaderboard-content";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const locale = (await params).locale ?? "en";
  const dict = await getStaticDictionary(APP_CONFIG.name, locale);
  const t = getT(dict);

  const { canonical, languageAlternates } = getMetadataAlternates(
    "/leaderboard",
    locale,
    APP_CONFIG.supportedLocales,
  );

  return {
    alternates: {
      canonical,
      languages: languageAlternates,
    },
    title: t("leaderboard.meta.title"),
    description: t("leaderboard.meta.description"),
  };
}

export default async function Leaderboard({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getStaticDictionary(APP_CONFIG.name, locale);
  const t = getT(dict);

  const response = await fetch(
    "https://palia-api.th.gl/nodes?type=players&limit=100",
    {
      headers: {
        authorization: process.env.PALIA_API_KEY || "",
      },
      cache: "force-cache",
      next: { tags: ["leaderboard"] },
    },
  );
  const data = (await response.json()) as APIPlayers;

  const players: Player[] = data
    .map((player) => ({
      name: player.name,
      level: player.level,
      skillLevels: player.skillLevels,
      lastKnownPrimaryHousingPlotValue:
        player.lastKnownPrimaryHousingPlotValue,
      timestamp: player.timestamp,
    }))
    .sort((a, b) => b.level - a.level);

  return (
    <HeaderOffset full>
      <ContentLayout
        id="palia"
        header={
          <>
            <h2 className="text-2xl">{t("leaderboard.heading")}</h2>
            <p className="text-sm">
              {t("leaderboard.description.part1")}{" "}
              <ExternalAnchor
                href="https://www.th.gl/companion-app"
                className="inline-flex gap-1 text-primary"
              >
                THGL Companion App
                <ExternalLink className="w-3 h-3" />
              </ExternalAnchor>{" "}
              or{" "}
              <ExternalAnchor
                href="https://www.overwolf.com/app/Leon_Machens-Palia_Map"
                className="inline-flex gap-1 text-primary"
              >
                {t("leaderboard.description.inGameApp")}
                <ExternalLink className="w-3 h-3" />
              </ExternalAnchor>{" "}
              {t("leaderboard.description.part2")}
            </p>
          </>
        }
        content={<LeaderboardContent players={players} />}
      />
    </HeaderOffset>
  );
}

// API response types

interface VillagerGiftHistory {
  villagerCoreId: number;
  itemPersistId: number;
  lastGiftedMs: number;
  associatedPreferenceVersion: number;
}

interface SkillLevels {
  type: string;
  level: number;
  xpGainedThisLevel: number;
}

type APIPlayers = {
  id: string;
  name: string;
  level: number;
  giftHistory: VillagerGiftHistory[];
  skillLevels: SkillLevels[];
  mapName: string;
  position: [number, number, number];
  lastKnownPrimaryHousingPlotValue?: number;
  timestamp: number;
}[];
