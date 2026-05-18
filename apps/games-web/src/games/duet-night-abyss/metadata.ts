import type { Metadata } from "next";
import { getMetadataAlternates } from "@repo/lib";
import { duetNightAbyss } from "@/configs/duet-night-abyss";

const APP = duetNightAbyss;
const GAME_TITLE = APP.title;
const OG_IMAGE = "https://duetnightabyss.th.gl/opengraph-image.jpg";

function buildMeta({
  locale,
  path,
  title,
  description,
  keywords,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
  keywords: string[];
}): Metadata {
  const { canonical, languageAlternates } = getMetadataAlternates(
    path,
    locale,
    APP.supportedLocales,
  );
  return {
    title,
    description,
    keywords,
    alternates: { canonical, languages: languageAlternates },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [OG_IMAGE],
    },
  };
}

export function questsIndexMetadata(locale: string): Metadata {
  return buildMeta({
    locale,
    path: "/db/quests",
    title: `Quests Database – ${GAME_TITLE}`,
    description:
      "Browse every main, character, story, and world quest in Duet Night Abyss. Follow quest chains, see prerequisites, and check rewards.",
    keywords: [...APP.keywords, "Quests", "Quest Chain", "Walkthrough"],
  });
}

export function questDetailMetadata(
  id: string,
  questName: string,
  locale: string,
): Metadata {
  return buildMeta({
    locale,
    path: `/db/quests/${id}`,
    title: `${questName} – Quests – ${GAME_TITLE}`,
    description: `Walkthrough, prerequisites, and rewards for ${questName} in Duet Night Abyss.`,
    keywords: [...APP.keywords, "Quests", questName],
  });
}
