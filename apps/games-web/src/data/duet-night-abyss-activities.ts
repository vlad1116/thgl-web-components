import { type Activity } from "@repo/ui/providers";

export const duetNightAbyssActivities: Activity[] = [
  // === DAILY ACTIVITIES ===
  // Main Activities
  { title: "Memo", category: "Main Activities", max: 1, frequently: "daily" },
  { title: "Battlepass Missions (Daily)", category: "Main Activities", max: 1, frequently: "daily" },
  { title: "Overworld Geniemon Respawn", category: "Main Activities", max: 5, frequently: "daily" },
  { title: "Expeditions", category: "Main Activities", max: 6, frequently: "daily" },
  { title: "Daily Inspiration (Battle Pass; 650 Stanza)", category: "Main Activities", max: 1, frequently: "daily" },

  // Hardcore/Optional Daily
  { title: "Fishing Spot 1 (30-45 mins)", category: "Hardcore", max: 1, frequently: "daily" },
  { title: "Fishing Spot 2 (30-45 mins)", category: "Hardcore", max: 1, frequently: "daily" },
  { title: "Fishing Spot 3 (30-45 mins)", category: "Hardcore", max: 1, frequently: "daily" },
  { title: "Demon Wedge Carmine Extraction", category: "Hardcore", max: 1, frequently: "daily" },

  // === WEEKLY ACTIVITIES ===
  { title: "Battlepass Missions (8000 XP)", category: "Weekly Activities", max: 1, frequently: "weekly" },
  { title: "Bounty Commissions", category: "Weekly Activities", max: 1, frequently: "weekly" },
  { title: "Nocturnal Echoes", category: "Weekly Activities", max: 1, frequently: "weekly" },
  { title: "Mystic Maze (Trace Points + Shop)", category: "Weekly Activities", max: 1, frequently: "weekly" },
  { title: "Fishing Bait", category: "Weekly Activities", max: 1, frequently: "weekly" },
  { title: "Geniemon Mission Cap", category: "Weekly Activities", max: 20, frequently: "weekly" },
  { title: "II Manuals buy-out in Shop", category: "Weekly Activities", max: 15, frequently: "weekly" },

  // === SEASONAL ===
  { title: "Immersive Theatre (Featured Repertoire)", category: "Seasonal", max: 1, frequently: "weekly" },
  { title: "Immersive Theatre (Immortal Repertoire)", category: "Seasonal", max: 1, frequently: "weekly" },
  { title: "Immersive Theatre Shop", category: "Seasonal", max: 1, frequently: "weekly" },
  { title: "Mystic Maze Shop (Demon Wedges)", category: "Seasonal", max: 1, frequently: "weekly" },
  { title: "Battlepass Progress", category: "Seasonal", max: 1, frequently: "weekly" },
  { title: "Fishing Shop (Seasonal Refresh)", category: "Seasonal", max: 1, frequently: "weekly" },
];
