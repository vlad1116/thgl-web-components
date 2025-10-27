import { create } from "zustand";
import { persist } from "zustand/middleware";
import { withStorageDOMEvents } from "./dom";
import { putSharedFilters } from "./shared-nodes";

export type PrivateNode = {
  id: string;
  name?: string;
  description?: string;
  icon: {
    name: string;
    url: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  } | null;
  color?: string;
  radius: number;
  p: [number, number];
  mapName: string;
};

export type Drawing = {
  id: string;
  polylines?: {
    positions: [number, number][];
    size: number;
    color: string;
    mapName: string;
  }[];
  rectangles?: {
    positions: [number, number][];
    size: number;
    color: string;
    mapName: string;
  }[];
  polygons?: {
    positions: [number, number][];
    size: number;
    color: string;
    mapName: string;
  }[];
  circles?: {
    center: [number, number];
    radius: number;
    size: number;
    color: string;
    mapName: string;
  }[];
  texts?: {
    position: [number, number];
    text: string;
    size: number;
    color: string;
    mapName: string;
  }[];
};

export type DrawingsAndNodes = {
  name: string;
  isShared?: boolean;
  url?: string;
  nodes?: PrivateNode[];
  drawing?: Drawing;
};

export type ColorBlindMode =
  | "none"
  | "protanopia"
  | "deuteranopia"
  | "tritanopia";

export type MapTransform = {
  borderRadius: string;
  transform: string;
  width: string;
  height: string;
};

export const DEFAULT_PROFILE_SETTINGS: ProfileSettings = {
  hotkeys: {},
  groupName: "",
  liveMode: true,
  overlayMode: null,
  overlayFullscreen: false,
  lockedWindow: false,
  colorBlindMode: "none",
  colorBlindSeverity: 1,
  transforms: {},
  mapTransform: null,
  mapFilter: "none",
  windowOpacity: 1,
  discoveredNodes: [],
  hideDiscoveredNodes: false,
  actorsPollingRate: 100,
  showTraceLine: true,
  traceLineLength: 100,
  traceLineRate: 5,
  traceLineColor: "#1ccdd1B3",
  displayDiscordActivityStatus: true,
  presets: {},
  tempPrivateNode: null,
  tempPrivateDrawing: null,
  drawingColor: "#FFFFFFAA",
  drawingSize: 4,
  textColor: "#1ccdd1",
  textSize: 20,
  baseIconSize: 1,
  playerIconSize: 1,
  iconSizeByGroup: {},
  iconSizeByFilter: {},
  fitBoundsOnChange: false,
  myFilters: [],
  showGrid: false,
  showFilters: true,
  expandedFilters: false,
  // Peer Link / Mesh settings
  peerCode: "",
  lastMeSenderId: "",
  playerName: "",
  autoJoinPeer: false,
  autoLiveModeWithMe: true,
};

export const DEFAULT_PROFILE = {
  id: "default",
  name: "Default",
  settings: DEFAULT_PROFILE_SETTINGS,
};

export type ProfileSettings = {
  hotkeys: Record<string, string>;
  groupName: string;
  liveMode: boolean;
  overlayMode: boolean | null;
  overlayFullscreen: boolean;
  lockedWindow: boolean;
  colorBlindMode: ColorBlindMode;
  colorBlindSeverity: number;
  transforms: Record<string, string>;
  mapTransform: MapTransform | null;
  mapFilter: string;
  windowOpacity: number;
  discoveredNodes: string[];
  hideDiscoveredNodes: boolean;
  actorsPollingRate: number;
  showTraceLine: boolean;
  traceLineLength: number;
  traceLineRate: number;
  traceLineColor: string;
  displayDiscordActivityStatus: boolean;
  presets: Record<string, string[]>;
  tempPrivateNode: (Partial<PrivateNode> & { filter?: string }) | null;
  tempPrivateDrawing: (Partial<Drawing> & { name?: string }) | null;
  drawingColor: string;
  drawingSize: number;
  textColor: string;
  textSize: number;
  baseIconSize: number;
  playerIconSize: number;
  iconSizeByGroup: Record<string, number>;
  iconSizeByFilter: Record<string, number>;
  fitBoundsOnChange: boolean;
  myFilters: DrawingsAndNodes[];
  showGrid: boolean;
  showFilters: boolean;
  expandedFilters: boolean;
  // Peer Link / Mesh settings
  peerCode: string;
  lastMeSenderId: string;
  playerName: string;
  autoJoinPeer: boolean;
  autoLiveModeWithMe: boolean;

  // Deprecated
  privateNodes?: PrivateNode[];
  privateDrawings?: Drawing[];
  sharedFilters?: {
    url: string;
    filter: string;
  }[];
};

export interface ProfileActions {
  setHotkey: (key: string, value: string) => void;
  setHotkeys: (hotkeys: Record<string, string>) => void;
  setGroupName: (groupName: string) => void;
  setLiveMode: (liveMode: boolean) => void;
  toggleLiveMode: () => void;
  setOverlayMode: (overlayMode: boolean) => void;
  toggleOverlayFullscreen: () => void;
  toggleLockedWindow: () => void;
  setColorBlindMode: (mode: ColorBlindMode) => void;
  setColorBlindSeverity: (severity: number) => void;
  setTransform: (id: string, transform: string) => void;
  setMapTransform: (mapTransform: MapTransform | null) => void;
  setMapFilter: (mapFilter: string) => void;
  setWindowOpacity: (windowOpacity: number) => void;
  resetTransform: () => void;
  isDiscoveredNode: (nodeId: string) => boolean;
  toggleDiscoveredNode: (nodeId: string) => void;
  setDiscoverNode: (nodeId: string, discovered: boolean) => void;
  toggleHideDiscoveredNodes: () => void;
  setDiscoveredNodes: (discoveredNodes: string[]) => void;
  setActorsPollingRate: (actorsPollingRate: number) => void;
  toggleShowTraceLine: () => void;
  setTraceLineLength: (traceLineLength: number) => void;
  setTraceLineRate: (traceLineRate: number) => void;
  setTraceLineColor: (traceLineColor: string) => void;
  setDisplayDiscordActivityStatus: (
    displayDiscordActivityStatus: boolean,
  ) => void;
  addPreset: (presetName: string, filters: string[]) => void;
  removePreset: (presetName: string) => void;
  setTempPrivateNode: (
    tempPrivateNode: (Partial<PrivateNode> & { filter?: string }) | null,
  ) => void;
  setTempPrivateDrawing: (
    tempPrivateDrawing: (Partial<Drawing> & { name?: string }) | null,
  ) => void;
  setDrawingColor: (drawingColor: string) => void;
  setDrawingSize: (drawingSize: number) => void;
  setTextColor: (textColor: string) => void;
  setTextSize: (textSize: number) => void;
  setBaseIconSize: (baseIconSize: number) => void;
  setPlayerIconSize: (playerIconSize: number) => void;
  setIconSizeByGroup: (group: string, size: number) => void;
  setIconSizeByFilter: (id: string, size: number) => void;
  toggleFitBoundsOnChange: () => void;
  setMyFilters: (myFilters: DrawingsAndNodes[]) => void;
  setMyFilter: (name: string, myFilter: Partial<DrawingsAndNodes>) => void;
  addMyFilter: (myFilter: DrawingsAndNodes) => void;
  removeMyFilter: (myFilterName: string) => void;
  removeMyNode: (nodeId: string) => void;
  toggleShowGrid: () => void;
  toggleShowFilters: () => void;
  toggleExpandedFilters: () => void;
  // Peer Link / Mesh settings
  setPeerCode: (code: string) => void;
  setLastMeSenderId: (id: string) => void;
  setPlayerName: (name: string) => void;
  setAutoJoinPeer: (autoJoin: boolean) => void;
  setAutoLiveModeWithMe: (autoLiveMode: boolean) => void;
}

export type Profile = {
  id: string;
  name: string;
  settings: ProfileSettings;
  createdAt: number;
  updatedAt: number;
};

class ProfileManager {
  static createProfileId() {
    return `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDefaultProfile(): Profile {
    const defaultProfile = {
      ...DEFAULT_PROFILE,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return defaultProfile;
  }

  static createProfile(name: string): Profile {
    const newProfile = {
      id: this.createProfileId(),
      name,
      settings: { ...DEFAULT_PROFILE_SETTINGS },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return newProfile;
  }

  static duplicateProfile(profile: Profile, name: string): Profile {
    // Deep clone the profile object
    const newProfile: Profile = JSON.parse(JSON.stringify(profile));
    newProfile.name = name;
    newProfile.id = this.createProfileId();
    newProfile.createdAt = Date.now();
    newProfile.updatedAt = Date.now();
    return newProfile;
  }
}

// SettingsStore now has flattened ProfileSettings at root level
export interface SettingsStore extends ProfileSettings, ProfileActions {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  // Profile Management (only profiles array and currentProfileId are persisted)
  profiles: Profile[];
  currentProfileId: string;
  createProfile: (name: string) => void;
  switchProfile: (profileId: string) => void;
  renameProfile: (profileId: string, newName: string) => void;
  deleteProfile: (profileId: string) => void;
  exportProfile: (profileId: string) => Profile | null;
  importProfile: (profile: Profile) => void;
  duplicateProfile: (profileId: string, name: string) => void;
}

const getStorageName = () => {
  if (typeof window !== "undefined") {
    if (window.location.pathname.startsWith("/apps/")) {
      const appId = window.location.pathname.split("/")[2];
      return `thgl-settings-${appId}`;
    }
  }
  return "settings-storage";
};

export const useSettingsStore = create(
  persist<SettingsStore>(
    (set, get) => {
      // Helper to update both flat state and profiles array
      const updateSettings = (settings: Partial<ProfileSettings>) => {
        const state = get();
        const updatedProfiles = state.profiles.map((p) =>
          p.id === state.currentProfileId
            ? {
                ...p,
                settings: { ...p.settings, ...settings },
                updatedAt: Date.now(),
              }
            : p,
        );

        set({
          ...settings,
          profiles: updatedProfiles,
        });
      };

      return {
        _hasHydrated: false,
        setHasHydrated: (state) => {
          set({
            _hasHydrated: state,
          });
        },

        // Profile Management
        currentProfileId: DEFAULT_PROFILE.id,
        profiles: [ProfileManager.getDefaultProfile()],

        createProfile: (name: string) => {
          const state = get();
          const newProfile = ProfileManager.createProfile(name);
          set({
            profiles: [...state.profiles, newProfile],
            currentProfileId: newProfile.id,
            ...newProfile.settings, // Flatten new profile settings to root
          });
        },

        switchProfile: (profileId: string) => {
          const state = get();
          const profile = state.profiles.find((p) => p.id === profileId);
          if (!profile) return;

          set({
            currentProfileId: profileId,
            ...profile.settings, // Flatten switched profile settings to root
          });
        },

        renameProfile: (profileId: string, newName: string) => {
          set((state) => ({
            profiles: state.profiles.map((p) =>
              p.id === profileId
                ? { ...p, name: newName, updatedAt: Date.now() }
                : p,
            ),
          }));
        },

        deleteProfile: (profileId: string) => {
          const state = get();
          if (state.profiles.length <= 1) return; // Don't delete the last profile

          const newProfiles = state.profiles.filter((p) => p.id !== profileId);
          const newCurrentProfileId =
            state.currentProfileId === profileId
              ? newProfiles[0].id
              : state.currentProfileId;

          // If we're switching to a different profile, load its settings
          if (newCurrentProfileId !== state.currentProfileId) {
            const newProfile = newProfiles.find(
              (p) => p.id === newCurrentProfileId,
            );
            if (newProfile) {
              set({
                profiles: newProfiles,
                currentProfileId: newCurrentProfileId,
                ...newProfile.settings, // Flatten settings to root
              });
              return;
            }
          }

          set({
            profiles: newProfiles,
            currentProfileId: newCurrentProfileId,
          });
        },

        exportProfile: (profileId: string) => {
          const state = get();
          const profile = state.profiles.find((p) => p.id === profileId);
          return profile || null;
        },

        importProfile: (profile: Profile) => {
          set((state) => {
            // Check if profile with same ID already exists
            const exists = state.profiles.some((p) => p.id === profile.id);
            if (exists) {
              // Generate new ID
              profile.id = ProfileManager.createProfileId();
            }
            return {
              profiles: [...state.profiles, profile],
            };
          });
        },

        duplicateProfile: (profileId: string, name: string) => {
          const state = get();
          const profile = state.profiles.find((p) => p.id === profileId);
          if (!profile) return;

          const newProfile = ProfileManager.duplicateProfile(profile, name);

          set({
            profiles: [...state.profiles, newProfile],
            currentProfileId: newProfile.id,
            ...newProfile.settings, // Flatten new profile settings to root
          });
        },

        // Flattened ProfileSettings (initial values from DEFAULT_PROFILE_SETTINGS)
        ...DEFAULT_PROFILE_SETTINGS,

        // Actions for updating settings (update both flat state and profiles array)
        setHotkey: (key, value) => {
          const state = get();
          updateSettings({
            hotkeys: { ...state.hotkeys, [key]: value },
          });
        },

        setHotkeys: (hotkeys) => {
          updateSettings({ hotkeys });
        },

        setGroupName: (groupName) => {
          updateSettings({ groupName });
        },

        setLiveMode: (liveMode) => {
          updateSettings({ liveMode });
        },

        toggleLiveMode: () => {
          const state = get();
          updateSettings({
            liveMode: !state.liveMode,
          });
        },

        setOverlayMode: (overlayMode) => {
          updateSettings({ overlayMode });
        },

        toggleOverlayFullscreen: () => {
          const state = get();
          updateSettings({
            overlayFullscreen: !state.overlayFullscreen,
          });
        },

        toggleLockedWindow: () => {
          const state = get();
          updateSettings({
            lockedWindow: !state.lockedWindow,
          });
        },

        setColorBlindMode: (mode) => {
          updateSettings({ colorBlindMode: mode });
        },

        setColorBlindSeverity: (severity: number) => {
          updateSettings({
            colorBlindSeverity: Math.max(0, Math.min(1, severity)),
          });
        },

        setTransform: (id: string, transform: string) => {
          const state = get();
          updateSettings({
            transforms: {
              ...state.transforms,
              [id]: transform,
            },
          });
        },

        setMapTransform: (mapTransform) => {
          updateSettings({ mapTransform });
        },

        setMapFilter: (mapFilter) => {
          updateSettings({ mapFilter });
        },

        setWindowOpacity: (windowOpacity) => {
          updateSettings({ windowOpacity });
        },

        resetTransform: () => {
          updateSettings({
            transforms: {},
            mapTransform: null,
            playerIconSize: 1,
            baseIconSize: 1,
            iconSizeByFilter: {},
            iconSizeByGroup: {},
          });
        },

        isDiscoveredNode: (nodeId) => {
          const state = get();
          const discoveredNodes = state.discoveredNodes;
          if (nodeId.includes("@")) {
            return (
              discoveredNodes.includes(nodeId) ||
              discoveredNodes.some((id) => id === nodeId.split("@")[0])
            );
          }
          return discoveredNodes.includes(nodeId);
        },

        toggleDiscoveredNode: (nodeId: string) => {
          const state = get();
          const discoveredNodes = state.discoveredNodes;
          const isDiscovered = state.isDiscoveredNode(nodeId);

          const updatedNodes = isDiscovered
            ? discoveredNodes.filter((id) => {
                if (id === nodeId) {
                  return false;
                }
                if (nodeId.includes("@") && nodeId.split("@")[0] === id) {
                  return false;
                }
                return true;
              })
            : [...new Set([...discoveredNodes, nodeId])];

          updateSettings({ discoveredNodes: updatedNodes });
        },

        setDiscoverNode: (nodeId, discovered) => {
          const state = get();
          updateSettings({
            discoveredNodes: discovered
              ? [...new Set([...state.discoveredNodes, nodeId])]
              : state.discoveredNodes.filter((id) => {
                  if (id === nodeId) {
                    return false;
                  }
                  if (nodeId.includes("@") && nodeId.split("@")[0] === id) {
                    return false;
                  }
                  return true;
                }),
          });
        },

        toggleHideDiscoveredNodes: () => {
          const state = get();
          updateSettings({
            hideDiscoveredNodes: !state.hideDiscoveredNodes,
          });
        },

        setDiscoveredNodes: (discoveredNodes: string[]) => {
          updateSettings({ discoveredNodes });
        },

        setActorsPollingRate: (actorsPollingRate: number) => {
          updateSettings({ actorsPollingRate });
        },

        toggleShowTraceLine: () => {
          const state = get();
          updateSettings({
            showTraceLine: !state.showTraceLine,
          });
        },

        setTraceLineLength: (traceLineLength: number) => {
          updateSettings({ traceLineLength });
        },

        setTraceLineRate: (traceLineRate: number) => {
          updateSettings({ traceLineRate });
        },

        setTraceLineColor: (traceLineColor: string) => {
          updateSettings({ traceLineColor });
        },

        setDisplayDiscordActivityStatus: (
          displayDiscordActivityStatus: boolean,
        ) => {
          updateSettings({ displayDiscordActivityStatus });
        },

        addPreset: (presetName: string, filters: string[]) => {
          const state = get();
          updateSettings({
            presets: {
              ...state.presets,
              [presetName]: filters,
            },
          });
        },

        removePreset: (presetName: string) => {
          const state = get();
          const newPresets = { ...state.presets };
          delete newPresets[presetName];
          updateSettings({ presets: newPresets });
        },

        setTempPrivateNode: (tempPrivateNode) => {
          const state = get();
          updateSettings({
            tempPrivateNode: tempPrivateNode
              ? {
                  ...(state.tempPrivateNode ?? {}),
                  ...tempPrivateNode,
                }
              : null,
          });
        },

        setTempPrivateDrawing: (tempPrivateDrawing) => {
          const state = get();
          updateSettings({
            tempPrivateDrawing: tempPrivateDrawing
              ? {
                  ...(state.tempPrivateDrawing ?? {}),
                  ...tempPrivateDrawing,
                }
              : null,
          });
        },

        setDrawingColor: (drawingColor) => {
          updateSettings({ drawingColor });
        },

        setDrawingSize: (drawingSize) => {
          updateSettings({ drawingSize });
        },

        setTextColor: (textColor) => {
          updateSettings({ textColor });
        },

        setTextSize: (textSize) => {
          updateSettings({ textSize });
        },

        setBaseIconSize: (baseIconSize) => {
          updateSettings({ baseIconSize });
        },

        setPlayerIconSize: (playerIconSize) => {
          updateSettings({ playerIconSize });
        },

        setIconSizeByGroup: (group, size) => {
          const state = get();
          updateSettings({
            iconSizeByGroup: {
              ...state.iconSizeByGroup,
              [group]: size,
            },
          });
        },

        setIconSizeByFilter: (id, size) => {
          const state = get();
          updateSettings({
            iconSizeByFilter: {
              ...state.iconSizeByFilter,
              [id]: size,
            },
          });
        },

        toggleFitBoundsOnChange: () => {
          const state = get();
          updateSettings({
            fitBoundsOnChange: !state.fitBoundsOnChange,
          });
        },

        setMyFilters: (myFilters) => {
          updateSettings({ myFilters });
        },

        setMyFilter: (name, myFilter) => {
          const state = get();
          const updatedFilters = state.myFilters.map((filter) =>
            filter.name === name ? { ...filter, ...myFilter } : filter,
          );
          updateSettings({ myFilters: updatedFilters });
          // Update shared filters if this filter has a URL
          const updatedFilter = updatedFilters.find((f) => f.name === name);
          if (updatedFilter?.url) {
            putSharedFilters(updatedFilter.name, updatedFilter);
          }
        },

        addMyFilter: async (myFilter) => {
          if (myFilter.isShared && !myFilter.url) {
            const blob = await putSharedFilters(myFilter.name, myFilter);
            myFilter.url = blob.url;
          }

          const state = get();

          if (
            myFilter.isShared &&
            myFilter.url &&
            state.myFilters.some(
              (filter) => filter.isShared && filter.url === myFilter.url,
            )
          ) {
            return;
          }

          updateSettings({
            myFilters: [...state.myFilters, myFilter],
          });
        },

        removeMyFilter: (myFilterName: string) => {
          const state = get();
          const updatedFilters = state.myFilters.filter(
            (filter) => filter.name !== myFilterName,
          );
          updateSettings({ myFilters: updatedFilters });
        },

        removeMyNode: async (nodeId: string) => {
          const state = get();
          const myFilter = state.myFilters.find((filter) =>
            filter.nodes?.some((node) => node.id === nodeId),
          );
          if (!myFilter) {
            return;
          }
          myFilter.nodes = myFilter.nodes?.filter((node) => node.id !== nodeId);
          if (myFilter.url) {
            await putSharedFilters(myFilter.url, myFilter);
          }
          updateSettings({
            myFilters: state.myFilters.map((filter) =>
              filter.name === myFilter.name ? myFilter : filter,
            ),
          });
        },

        toggleShowGrid: () => {
          const state = get();
          updateSettings({
            showGrid: !state.showGrid,
          });
        },

        toggleShowFilters: () => {
          const state = get();
          updateSettings({
            showFilters: !state.showFilters,
          });
        },

        toggleExpandedFilters: () => {
          const state = get();
          updateSettings({
            expandedFilters: !state.expandedFilters,
          });
        },

        // Peer Link / Mesh settings
        setPeerCode: (code: string) => {
          updateSettings({ peerCode: code });
        },

        setLastMeSenderId: (id: string) => {
          updateSettings({ lastMeSenderId: id });
        },

        setPlayerName: (name: string) => {
          updateSettings({ playerName: name });
        },

        setAutoJoinPeer: (autoJoin: boolean) => {
          updateSettings({ autoJoinPeer: autoJoin });
        },

        setAutoLiveModeWithMe: (autoLiveMode: boolean) => {
          updateSettings({ autoLiveModeWithMe: autoLiveMode });
        },
      };
    },
    {
      name: getStorageName(),
      // Only persist profiles array and currentProfileId (not flattened settings)
      partialize: (state) =>
        ({
          profiles: state.profiles,
          currentProfileId: state.currentProfileId,
        }) as SettingsStore,
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        if (!state._hasHydrated) {
          state.setHasHydrated(true);
        }

        // Flatten current profile settings to root level
        const currentProfile = state.profiles.find(
          (p) => p.id === state.currentProfileId,
        );
        if (currentProfile) {
          Object.assign(state, currentProfile.settings);
        }
      },
      version: 4,
      // @ts-ignore
      migrate: (persistedState, version) => {
        if (version < 3) {
          const storageName = getStorageName();
          if (storageName !== "settings-storage") {
            const oldStorage = localStorage.getItem("settings-storage");
            if (oldStorage) {
              const oldState = JSON.parse(oldStorage).state;
              Object.assign(persistedState || {}, oldState);
            }
          }
        }

        if (version < 4) {
          // Initialize profiles from existing settings
          const state = persistedState as any;

          // Create or update the default profile with existing settings
          let defaultProfile: Profile;
          let isNewProfile = false;

          if (!state.profiles?.length) {
            // No profiles exist - create new one
            defaultProfile = ProfileManager.getDefaultProfile();
            isNewProfile = true;
          } else {
            // Profiles exist - use the current one or first one
            const currentProfileId = state.currentProfileId || state.profiles[0]?.id;
            defaultProfile = state.profiles.find((p: Profile) => p.id === currentProfileId) || state.profiles[0];
          }

          // Preserve existing settings from version 3 root level
          Object.keys(DEFAULT_PROFILE_SETTINGS).forEach((key) => {
            if (key in state && state[key] !== undefined) {
              // @ts-ignore
              defaultProfile.settings[key] = state[key];
            }
          });

          if (isNewProfile) {
            state.profiles = [defaultProfile];
            state.currentProfileId = defaultProfile.id;
          } else {
            // Update the existing profile in the array
            state.profiles = state.profiles.map((p: Profile) =>
              p.id === defaultProfile.id ? defaultProfile : p
            );
            state.currentProfileId = defaultProfile.id;
          }
        }

        return persistedState;
      },
    },
  ),
);

withStorageDOMEvents(useSettingsStore);
