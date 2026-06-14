import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { ActorPlayer, Actor } from "./overwolf/plugin";

// `player` updates at the memory-read rate (~16×/s while moving), so any
// component that subscribes to it re-renders that often. Most consumers only
// need a coarse position (audio alerts, height arrows, follow-recentre): they
// should subscribe to `throttledPlayer`, which `setPlayer` advances at most
// ~1×/s. Only the things that must look smooth (the player marker, trace line)
// subscribe to the raw `player`. Generalizes to other high-frequency state.
const THROTTLED_PLAYER_MS = 1000;
let _lastThrottledPlayerAt = 0;

export const useGameState = create(
  subscribeWithSelector<{
    player: ActorPlayer | null;
    /** `player` throttled to ~1Hz (advanced inside setPlayer). */
    throttledPlayer: ActorPlayer | null;
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
    throttledPlayer: null,
    setPlayer: (player) => {
      set({ player });
      const now = Date.now();
      if (
        player === null ||
        now - _lastThrottledPlayerAt >= THROTTLED_PLAYER_MS
      ) {
        _lastThrottledPlayerAt = now;
        set({ throttledPlayer: player });
      }
    },
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
        highlightSpawnIDs: state.highlightSpawnIDs.filter(
          (i) => !id.includes(i),
        ),
      })),
    isUpdatingApp: false,
    setIsUpdatingApp: (isUpdatingApp) => set({ isUpdatingApp }),
    showLabelsActive: false,
    setShowLabelsActive: (active) => set({ showLabelsActive: active }),
    peerLiveConnected: false,
    setPeerLiveConnected: (peerLiveConnected) => set({ peerLiveConnected }),
  })),
);
