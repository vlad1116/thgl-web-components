import type { DiscordMessageData } from "./discord";
import type { Game } from "./games";

export type ChangelogEntry = {
  version: string;
  date: string | null;
  content: string;
  timestamp: number;
};

export type UpdateItem =
  | {
      type: "game";
      game: Game;
      message: DiscordMessageData;
      timestamp: number;
    }
  | {
      type: "changelog";
      version: string;
      date: string | null;
      content: string;
      timestamp: number;
    };

export function mergeUpdates(
  gameUpdates: Array<{ game: Game; message: DiscordMessageData }>,
  changelogEntries: ChangelogEntry[],
  limit: number = 8,
): UpdateItem[] {
  const allUpdates: UpdateItem[] = [
    ...gameUpdates.map(({ game, message }) => ({
      type: "game" as const,
      game,
      message,
      timestamp: message.timestamp,
    })),
    ...changelogEntries.map((entry) => ({
      type: "changelog" as const,
      version: entry.version,
      date: entry.date,
      content: entry.content,
      timestamp: entry.timestamp,
    })),
  ];

  // Sort by timestamp, most recent first
  allUpdates.sort((a, b) => b.timestamp - a.timestamp);

  return allUpdates.slice(0, limit);
}

export function parseChangelog(
  content: string,
  limit: number = 5,
): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const sections = content.split(/^#+ /m).filter(Boolean);

  for (const section of sections) {
    const lines = section.trim().split("\n");
    const versionLine = lines[0].trim();

    // Parse version and optional date: "2.22.0 (2025-12-01)" or "2.22.0"
    const match = versionLine.match(/^([\d.]+)(?:\s*\((\d{4}-\d{2}-\d{2})\))?/);
    if (!match) continue;

    const version = match[1];
    const date = match[2] || null;
    const timestamp = date ? new Date(date).getTime() : 0;
    const contentLines = lines.slice(1).join("\n").trim();

    if (version && contentLines) {
      entries.push({ version, date, content: contentLines, timestamp });
    }

    if (entries.length >= limit) break;
  }

  return entries;
}

export function formatChangelogContent(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
