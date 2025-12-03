import {
  games,
  getUpdateMessages,
  getSuggestionsAndIssues,
  mergeUpdates,
  Game,
  DiscordMessageData,
} from "@repo/lib";
import { getChangelogEntries } from "@repo/lib/server";
import { HomePageClient } from "./home-client";
import path from "path";

export default async function DashboardHome() {
  // Get recent updates from all companion games
  const companionGames = games.filter((game) => game.companion);

  const gameUpdates: Array<{
    game: Game;
    message: DiscordMessageData;
  }> = [];

  const changelogPath = path.join(process.cwd(), "public", "changelog.md");

  // Fetch updates, suggestions, and changelog in parallel
  const [, suggestions, changelogEntries] = await Promise.all([
    // Fetch updates for each game
    Promise.all(
      companionGames.slice(0, 6).map(async (game) => {
        const messages = await getUpdateMessages(game.discordId);
        if (messages.length > 0) {
          gameUpdates.push({ game, message: messages[0] });
        }
      }),
    ),
    // Fetch community suggestions
    getSuggestionsAndIssues(5),
    // Get changelog entries
    getChangelogEntries(changelogPath, 5),
  ]);

  // Merge game updates and changelog into a single list
  const updates = mergeUpdates(gameUpdates, changelogEntries, 8);

  return <HomePageClient updates={updates} suggestions={suggestions} />;
}
