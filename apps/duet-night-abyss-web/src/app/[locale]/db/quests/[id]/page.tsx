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

type Params = Promise<{ id: string; locale?: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id, locale = DEFAULT_LOCALE } = await params;
  const database = await fetchDatabase(APP_CONFIG.name);

  const category = database.find((item) =>
    item.items.some((i) => i.id === id),
  ) as Database[number] | undefined;
  if (!category) {
    return {};
  }
  const item = category.items.find((i) => i.id === id);
  if (!item) {
    return {};
  }

  const title = `${item.props.name} – Quests – Duet Night Abyss`;
  const description = `${item.props.name} - ${item.props.questType ? `${item.props.questType} quest` : "quest"} in Duet Night Abyss.`;

  const { canonical, languageAlternates } = getMetadataAlternates(
    `/db/quests/${id}`,
    locale,
    APP_CONFIG.supportedLocales,
  );

  return {
    title,
    description,
    keywords: [
      ...APP_CONFIG.keywords,
      "Quests",
      item.props.name,
      item.props.questType,
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

export default async function QuestPage({
  params,
}: {
  params: Params;
}): Promise<JSX.Element> {
  const { id } = await params;
  const database = await fetchDatabase(APP_CONFIG.name);

  const category = database.find((item) =>
    item.items.some((i) => i.id === id),
  ) as Database[number] | undefined;
  if (!category) {
    notFound();
  }
  const item = category.items.find((i) => i.id === id);
  if (!item) {
    notFound();
  }

  // Build full quest chain
  const allQuests = database.flatMap((cat) => cat.items);

  // Find all quests with the same episode (more reliable than name)
  const questsInSameEpisode = allQuests.filter(
    (q) => q.props.episode && q.props.episode === item.props.episode,
  );

  let questChain: typeof allQuests = [];
  let currentIndex = -1;

  if (questsInSameEpisode.length > 1) {
    // Build the chain by following dependencies
    const chain: string[] = [];

    // Find the first quest (one that doesn't require another quest in the same episode)
    const firstQuest = questsInSameEpisode.find(
      (q) =>
        !q.props.showCondition ||
        !questsInSameEpisode.some(
          (other) => other.id === q.props.showCondition,
        ),
    );

    if (firstQuest) {
      let current = firstQuest;
      chain.push(current.id);

      // Follow the chain
      while (current) {
        const next = questsInSameEpisode.find(
          (q) =>
            (q.props.showCondition === current.id ||
              q.props.requiresQuest === current.id) &&
            !chain.includes(q.id),
        );
        if (next) {
          chain.push(next.id);
          current = next;
        } else {
          break;
        }
      }

      // Build the quest chain array
      questChain = chain
        .map((questId) => allQuests.find((q) => q.id === questId))
        .filter((q): q is NonNullable<typeof q> => q !== undefined);

      // Find current quest index
      currentIndex = questChain.findIndex((q) => q.id === id);
    }
  }

  return (
    <div className="py-6 text-left space-y-4">
      <h3 className="uppercase text-4xl">{item.props.name}</h3>

      {/* Quest Chain Display */}
      {questChain.length > 1 && (
        <div className="border border-border rounded-lg p-4 space-y-2">
          <div className="text-sm font-semibold text-muted-foreground mb-3">
            Quest Chain (Part {currentIndex + 1} of {questChain.length})
          </div>
          <div className="space-y-2">
            {questChain.map((chainQuest, index) => {
              const isCurrent = chainQuest.id === id;
              return (
                <div key={chainQuest.id}>
                  {isCurrent ? (
                    <div className="px-3 py-2 rounded bg-primary/10 border border-primary/20 font-medium text-primary">
                      {index + 1}. {chainQuest.props.name}
                    </div>
                  ) : (
                    <Link
                      href={`/db/quests/${chainQuest.id}`}
                      className="block px-3 py-2 rounded bg-muted hover:bg-muted/80 transition-colors"
                    >
                      {index + 1}. {chainQuest.props.name}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
