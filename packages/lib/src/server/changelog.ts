import { promises as fs } from "fs";
import { parseChangelog, type ChangelogEntry } from "../changelog";

export async function getChangelogEntries(
  changelogPath: string,
  limit: number = 5,
): Promise<ChangelogEntry[]> {
  try {
    const content = await fs.readFile(changelogPath, "utf-8");
    return parseChangelog(content, limit);
  } catch {
    return [];
  }
}
