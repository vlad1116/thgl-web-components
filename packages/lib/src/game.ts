import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { ActorPlayer, Actor } from "./overwolf/plugin";

export const useGameState = create(subscribeWithSelector<{
  player: ActorPlayer | null;
  setPlayer: (player: ActorPlayer | null) => void;
  character: Record<string, any> | null;
  setCharacter: (character: Record<string, any> | null) => void;
  actors: Actor[];
  setActors: (actors: Actor[]) => void;
  error: string | null;
  setError: (error: string | null) => void;
  highlightSpawnIDs: string[];
  addHighlightSpawnIDs: (id: string[]) => void;
  removeHighlightSpawnIDs: (id: string[]) => void;
  isUpdatingApp: boolean;
  setIsUpdatingApp: (isUpdatingApp: boolean) => void;
  showLabelsActive: boolean;
  setShowLabelsActive: (active: boolean) => void;
  /**
   * True when a live data source is feeding this session via Peer Link
   * (mesh joined with a "Me" sender selected). Companion apps feed actors
   * directly and signal liveness via their own context, so they don't set
   * this. Consumed by the map to decide whether live/combined mode has a
   * real source — without it, predicted spawns are shown unconfirmed.
   */
  peerLiveConnected: boolean;
  setPeerLiveConnected: (peerLiveConnected: boolean) => void;
}>((set) => ({
  windowInfo: null,
  isOverlay: null,
  player: null,
  setPlayer: (player) => set({ player }),
  character: null,
  setCharacter: (character) => set({ character }),
  actors: [],
  setActors: (actors) => set({ actors }),
  error: null,
  setError: (error) => set({ error }),
  highlightSpawnIDs: [],
  addHighlightSpawnIDs: (id) =>
    set((state) => ({
      highlightSpawnIDs: Array.from(
        new Set([...state.highlightSpawnIDs, ...id]),
      ),
    })),
  removeHighlightSpawnIDs: (id) =>
    set((state) => ({
      highlightSpawnIDs: state.highlightSpawnIDs.filter((i) => !id.includes(i)),
    })),
  isUpdatingApp: false,
  setIsUpdatingApp: (isUpdatingApp) => set({ isUpdatingApp }),
  showLabelsActive: false,
  setShowLabelsActive: (active) => set({ showLabelsActive: active }),
  peerLiveConnected: false,
  setPeerLiveConnected: (peerLiveConnected) => set({ peerLiveConnected }),
})));
