import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";

import { WindowMode } from "./apps";
import { RunningGame } from "./games";
import { AppVersion } from "./version";
import { GpuFlag } from "./webview";

export type ConnectedClient = {
  id: number;
  href: string;
  role: "controller" | "dashboard" | "client";
};

export type GameSessionInfo = {
  gameId: string;
  processName: string;
  pid: number;
  status: "connecting" | "connected" | "error" | "closed";
  detectorInitialized: boolean;
  lastError?: string;
  startedAt: number;
  endedAt?: number;
};

export const useLiveState = create<{
  isRunningAsAdmin: boolean | null;
  setIsRunningAsAdmin: (isRunningAsAdmin: boolean) => void;
  isTaskInstalled: boolean | null;
  setIsTaskInstalled: (isTaskInstalled: boolean) => void;
  version: AppVersion | null;
  setVersion: (version: AppVersion) => void;
  windowMode: WindowMode;
  setWindowMode: (mode: WindowMode) => void;
  gpuFlag: GpuFlag;
  setGpuFlag: (flag: GpuFlag) => void;
  runningGames: Array<RunningGame> | null;
  setRunningGames: (games: Array<RunningGame>) => void;
  connectedClients: Array<ConnectedClient> | null;
  setConnectedClients: (urls: Array<ConnectedClient>) => void;
}>((set) => ({
  isRunningAsAdmin: null,
  setIsRunningAsAdmin: (isRunningAsAdmin) => set({ isRunningAsAdmin }),
  isTaskInstalled: null,
  setIsTaskInstalled: (isTaskInstalled) => set({ isTaskInstalled }),
  version: null,
  setVersion: (version) => set({ version }),
  windowMode: "overlay",
  setWindowMode: (mode) => set({ windowMode: mode }),
  gpuFlag: "none",
  setGpuFlag: (flag) => set({ gpuFlag: flag }),
  runningGames: null,
  setRunningGames: (games) => set({ runningGames: games }),
  connectedClients: null,
  setConnectedClients: (clients) => set({ connectedClients: clients }),
}));

export const useTHGLAppState = create(
  subscribeWithSelector(
    persist<{
      _hasHydrated: boolean;
      setHasHydrated: (hydrated: boolean) => void;
      openDashboardOnStart: boolean;
      setOpenDashboardOnStart: (open: boolean) => void;
      disabledApps: Array<string>;
      toggleDisabledApp: (app: string) => void;
      autoRunGames: Record<string, boolean>;
      setAutoRunGame: (gameId: string, enabled: boolean) => void;
      sidebarExpanded: boolean;
      setSidebarExpanded: (expanded: boolean) => void;
      gameSessions: Array<GameSessionInfo>;
      updateGameSession: (session: GameSessionInfo) => void;
      clearClosedSessions: () => void;
    }>(
      (set) => ({
        _hasHydrated: false,
        setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
        openDashboardOnStart: true,
        setOpenDashboardOnStart: (open) => set({ openDashboardOnStart: open }),
        disabledApps: [],
        toggleDisabledApp: (app) =>
          set((state) => ({
            disabledApps: state.disabledApps.includes(app)
              ? state.disabledApps.filter((a) => a !== app)
              : [...state.disabledApps, app],
          })),
        autoRunGames: {},
        setAutoRunGame: (gameId, enabled) =>
          set((state) => ({
            autoRunGames: { ...state.autoRunGames, [gameId]: enabled },
          })),
        sidebarExpanded: true,
        setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
        gameSessions: [],
        updateGameSession: (session) =>
          set((state) => {
            const existing = state.gameSessions.findIndex(
              (s) => s.pid === session.pid,
            );
            if (existing >= 0) {
              const updated = [...state.gameSessions];
              updated[existing] = session;
              return { gameSessions: updated };
            }
            // Keep only last 20 sessions
            const sessions = [session, ...state.gameSessions].slice(0, 20);
            return { gameSessions: sessions };
          }),
        clearClosedSessions: () =>
          set((state) => ({
            gameSessions: state.gameSessions.filter((s) => s.status !== "closed"),
          })),
      }),
      {
        name: "thgl-app",
        version: 2,
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
        },
      },
    ),
  ),
);
