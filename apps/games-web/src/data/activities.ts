import { type Activity } from "@repo/ui/providers";
import { nightCrowsActivities } from "./night-crows-activities";

/**
 * Per-game activity definitions used by the Activities Tracker page.
 * Add a new game by importing its activities array and adding it here.
 */
export const ACTIVITIES_BY_GAME: Record<string, Activity[]> = {
  "night-crows": nightCrowsActivities,
};
