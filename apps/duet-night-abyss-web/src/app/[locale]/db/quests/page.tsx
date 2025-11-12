import { notFound } from "next/navigation";
import { type Metadata } from "next";
import Link from "next/link";
import { type Database } from "@repo/ui/providers";
import {
  fetchDatabase,
  DEFAULT_LOCALE,
  getMetadataAlternates,
} from "@repo/lib";
import { APP_CONFIG } from "@/config";

type PageProps = {
  params: Promise<{ locale?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = await params;

  const title = "Quests – Duet Night Abyss";
  const description =
    "Discover all quests in Duet Night Abyss including main story, character, world, and story quests with detailed information about unlock conditions and requirements.";

  const { canonical, languageAlternates } = getMetadataAlternates(
    "/db/quests",
    locale,
    APP_CONFIG.supportedLocales,
  );

  return {
    title,
    description,
    keywords: [
      ...APP_CONFIG.keywords,
      "Quests",
      "Main Story",
      "Character Quests",
      "World Quests",
      "Story Quests",
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

export default async function QuestsPage() {
  const database = await fetchDatabase(APP_CONFIG.name);
  const category = database.find(
    (item) =>
      item.type.startsWith("sidequests_") || item.type.startsWith("mainquests"),
  ) as Database[number];
  if (!category) {
    notFound();
  }
  const item = category.items[0];
  if (!item) {
    notFound();
  }

  return (
    <div className="py-6 text-left space-y-4">
      <h3 className="uppercase text-4xl">{item.props.name}</h3>
      <div className="space-y-2 text-muted-foreground">
        {item.props.chapterName && (
          <p>
            <span className="font-semibold">Chapter:</span>{" "}
            {item.props.chapterName}
          </p>
        )}
        {item.props.questType && (
          <p>
            <span className="font-semibold">Quest Type:</span>{" "}
            <span className="capitalize">{item.props.questType}</span>
          </p>
        )}
        {item.props.autoStart !== undefined && (
          <p>
            <span className="font-semibold">Auto-Start:</span>{" "}
            {item.props.autoStart ? "Yes" : "No"}
          </p>
        )}
        {item.props.unlockCondition === item.props.showCondition ? (
          // When both conditions are the same, show only one field
          item.props.unlockConditionName && (
            <p>
              <span className="font-semibold">Unlocks After:</span>{" "}
              {item.props.unlockCondition ? (
                <Link
                  href={`/db/quests/${item.props.unlockCondition}`}
                  className="text-primary hover:underline"
                >
                  {item.props.unlockConditionName}
                </Link>
              ) : (
                item.props.unlockConditionName
              )}
            </p>
          )
        ) : (
          // When conditions differ, show both with clearer labels
          <>
            {item.props.showConditionName && (
              <p>
                <span className="font-semibold">Appears After:</span>{" "}
                {item.props.showCondition ? (
                  <Link
                    href={`/db/quests/${item.props.showCondition}`}
                    className="text-primary hover:underline"
                  >
                    {item.props.showConditionName}
                  </Link>
                ) : (
                  item.props.showConditionName
                )}
              </p>
            )}
            {item.props.unlockConditionName && (
              <p>
                <span className="font-semibold">Available After:</span>{" "}
                {item.props.unlockCondition ? (
                  <Link
                    href={`/db/quests/${item.props.unlockCondition}`}
                    className="text-primary hover:underline"
                  >
                    {item.props.unlockConditionName}
                  </Link>
                ) : (
                  item.props.unlockConditionName
                )}
              </p>
            )}
          </>
        )}
        {item.props.requiresQuestName && (
          <p>
            <span className="font-semibold">Requires Quest:</span>{" "}
            {item.props.requiresQuest ? (
              <Link
                href={`/db/quests/${item.props.requiresQuest}`}
                className="text-primary hover:underline"
              >
                {item.props.requiresQuestName}
              </Link>
            ) : (
              item.props.requiresQuestName
            )}
          </p>
        )}
        {item.props.questNpcName && (
          <p>
            <span className="font-semibold">Quest NPC:</span>{" "}
            {item.props.questNpcName}
          </p>
        )}
        {item.props.rewards && (
          <div>
            <p className="font-semibold mb-2">Rewards:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              {item.props.rewards
                .split(", ")
                .map((reward: string, index: number) => (
                  <li key={index} className="text-sm">
                    {reward}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
