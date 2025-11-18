/**
 * Maps specific tags to broader, more useful categories
 * This helps reduce tag clutter while maintaining discoverability
 */
export const TAG_MAPPING: Record<string, string> = {
  // Technical/Development tags - consolidate into broader categories
  "thgl-web-components": "Development",
  "monorepo": "Development",
  "TurboRepo": "Development",
  "Leaflet": "Development",
  "WebGL2": "Development",
  "WM_INPUT": "Development",
  "PostMessage": "Development",
  "RegisterRawInputDevices": "Development",
  "message queue": "Development",
  "input thread": "Development",
  "DX injection": "Development",
  "overlay rendering": "Development",
  "Claude Code": "Development",
  "CLAUDE.md": "Development",
  "GitHub": "Development",
  "open source": "Development",
  "source-available": "Development",
  "contributions": "Development",
  "pull requests": "Development",

  // Location-specific tags - consolidate by game
  // Duet Night Abyss
  "Purgatorio Island": "Duet Night Abyss",
  "Eastern District": "Duet Night Abyss",
  "Icelake": "Duet Night Abyss",
  "Glevum Pit": "Duet Night Abyss",
  "Icelake Sewers": "Duet Night Abyss",
  "Galea Theatre": "Duet Night Abyss",
  "Lonza Fortress": "Duet Night Abyss",
  "Geniemon": "Duet Night Abyss",

  // Dune Awakening
  "Hagga Basin": "Dune Awakening",
  "Arrakeen": "Dune Awakening",
  "Harko Village": "Dune Awakening",
  "The Deep Desert": "Dune Awakening",
  "xREALM": "Dune Awakening",
  "dune.gaming.tools": "Dune Awakening",

  // Palia
  "Elderwood": "Palia",
  "Elderwood Expansion": "Palia",
  "Ogopuu": "Palia",
  "Shmole": "Palia",
  "Rockhopper": "Palia",

  // Feature tags - consolidate similar ones
  "activity tracker": "Features",
  "weekly wants": "Features",
  "star level tracking": "Features",
  "guild planning": "Features",
  "whiteboard mode": "Features",
  "PvP coordination": "Features",
  "private servers": "Features",
  "second-screen": "Features",
  "interactive maps": "Features",

  // Community/Support tags
  "Elite Supporters": "Community",
  "r/TheHiddenGamingLair": "Community",
  "Reddit": "Community",
  "Discord": "Community",
  "Patreon": "Community",
  "Support Me": "Community",
  "preview access": "Community",
  "suggestions-issues": "Community",
  "summer break": "Announcements",

  // Game-specific apps
  "Trophy Hunter": "League of Legends",
};

/**
 * Apply tag mapping to transform specific tags into broader categories
 */
export function normalizeTag(tag: string): string {
  return TAG_MAPPING[tag] || tag;
}

/**
 * Normalize an array of tags, removing duplicates after mapping
 */
export function normalizeTags(tags: string[]): string[] {
  const normalized = tags.map(normalizeTag);
  return Array.from(new Set(normalized));
}
