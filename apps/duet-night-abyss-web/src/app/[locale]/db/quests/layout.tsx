import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { fetchDatabase, fetchDict } from "@repo/lib";
import { APP_CONFIG } from "@/config";
import { DatabaseSidebar } from "@/components/database-sidebar";

export async function generateMetadata() {
  return {
    title: `Quests – ${APP_CONFIG.title}`,
    description: `Discover all quests in ${APP_CONFIG.title} including main story, character, world, and story quests.`,
  };
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const enDict = await fetchDict(APP_CONFIG.name);
  const database = await fetchDatabase(APP_CONFIG.name);

  // Filter quests by type (main quests and side quests)
  const data = database.filter(
    (item) =>
      item.type.startsWith("sidequests_") || item.type.startsWith("mainquests"),
  );

  // Build quest chains to detect multi-part quests
  const allQuests = data.flatMap((cat) => cat.items);
  const questChains = new Map<string, string[]>();

  // Group quests by episode to find chains
  const questsByEpisode = new Map<string, typeof allQuests>();
  allQuests.forEach((quest) => {
    const episode = quest.props.episode;
    if (episode) {
      if (!questsByEpisode.has(episode)) {
        questsByEpisode.set(episode, []);
      }
      questsByEpisode.get(episode)!.push(quest);
    }
  });

  // For quests in the same episode, build chains using showCondition/requiresQuest
  questsByEpisode.forEach((quests, episode) => {
    if (quests.length > 1) {
      // Build chain by finding dependencies
      const chain: string[] = [];

      // Find the first quest (one that doesn't require another quest in the same episode)
      const firstQuest = quests.find(
        (q) =>
          !q.props.showCondition ||
          !quests.some((other) => other.id === q.props.showCondition),
      );

      if (firstQuest) {
        let current = firstQuest;
        chain.push(current.id);

        // Follow the chain
        while (current) {
          const next = quests.find(
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

        // Store the chain
        chain.forEach((id, index) => {
          questChains.set(id, chain);
        });
      }
    }
  });

  const menu = data.map((item) => ({
    category: { key: item.type, value: enDict[item.type] },
    items: item.items.map((subitem) => {
      const chain = questChains.get(subitem.id);
      let displayName = subitem.props.name;

      // Add part number if this quest is part of a chain
      if (chain && chain.length > 1) {
        const partNumber = chain.indexOf(subitem.id) + 1;
        displayName = `${subitem.props.name} (Part ${partNumber})`;
      }

      return {
        key: subitem.id,
        text: displayName,
        href: `/db/quests/${subitem.id}`,
      };
    }),
  }));

  return (
    <HeaderOffset full>
      <ContentLayout
        id="duet-night-abyss"
        header={
          <>
            <h2 className="text-2xl">Quests</h2>
            <p className="text-sm my-2">
              Explore all quests in Duet Night Abyss, including main story
              quests, character quests, world quests, and story quests. Track
              your progress and discover new adventures throughout the game.
            </p>
          </>
        }
        sidebar={<DatabaseSidebar menu={menu} />}
        content={children}
      />
    </HeaderOffset>
  );
}
