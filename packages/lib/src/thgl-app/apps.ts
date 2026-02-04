import { useGameState } from "../game";
import { useSettingsStore } from "../settings";
import { RunningGame } from "./games";
import { useLiveState, useTHGLAppState } from "./states";
import { getInitialStateFromWebview } from "./version";
import { postWebviewMessage } from "./webview";

export type WindowMode = "overlay" | "desktop" | "both";

export function openDashboadWebView() {
  return postWebviewMessage({
    action: "openDashboardWebView",
    payload: {},
  });
}
export function openOverlayWebView(url: string, title: string) {
  let fullUrl = url;
  if (!fullUrl.startsWith("http")) {
    fullUrl = location.origin + fullUrl;
  }
  return postWebviewMessage({
    action: "openOverlayWebView",
    payload: {
      url: fullUrl,
      title,
    },
  });
}
export function updateHotkeys(hotkeys: Record<string, string>) {
  return postWebviewMessage({
    action: "updateHotkeys",
    payload: hotkeys,
  });
}

// Sync current hotkeys from settings store to C++
function syncHotkeysToNative() {
  const hotkeys = useSettingsStore.getState().hotkeys;
  // Filter out empty values but keep the action->combo mapping
  const filteredHotkeys: Record<string, string> = {};
  for (const [action, combo] of Object.entries(hotkeys)) {
    if (combo) {
      filteredHotkeys[action] = combo;
    }
  }
  if (Object.keys(filteredHotkeys).length > 0) {
    console.log("Syncing hotkeys to native:", filteredHotkeys);
    updateHotkeys(filteredHotkeys).catch(console.error);
  }
}

export function updateActorTypeFilters(types: string[], processName?: string) {
  return postWebviewMessage({
    action: "setActorTypeFilter",
    payload: {
      types,
      processName,
    },
  });
}

export function sendDebugSnapshot(userContext: string) {
  return postWebviewMessage({
    action: "sendDebugSnapshot",
    payload: {
      userContext,
    },
  });
}

export function openInBrowser(url: string) {
  return postWebviewMessage({
    action: "openInBrowser",
    payload: {
      url,
    },
  });
}

export function openDesktopWebView(url: string, title: string) {
  let fullUrl = url;
  if (!fullUrl.startsWith("http")) {
    fullUrl = location.origin + fullUrl;
  }
  return postWebviewMessage({
    action: "openDesktopWebView",
    payload: {
      url: fullUrl,
      title,
    },
  });
}

export function openDevTools() {
  window.chrome.webview.postMessage("openDevTools");
}

export function openDevToolsForUrl(url: string) {
  return postWebviewMessage({
    action: "openDevTools",
    payload: { url },
  });
}

export function closeWebViews(urls: string[]) {
  return postWebviewMessage({
    action: "closeWebViews",
    payload: { urls },
  });
}

export function getVersion() {
  return postWebviewMessage<{
    buildDate: string;
    buildTime: string;
    buildVersion: string;
  }>({
    action: "getVersion",
    payload: {},
  });
}

export function getIsTaskInstalled() {
  return postWebviewMessage<boolean>({
    action: "isTaskInstalled",
    payload: {},
  });
}

export function addScheduledTask() {
  return postWebviewMessage({
    action: "addScheduledTask",
    payload: {},
  });
}

export function removeScheduledTask() {
  return postWebviewMessage({
    action: "removeScheduledTask",
    payload: {},
  });
}

export function getWindowMode() {
  return postWebviewMessage<WindowMode>({
    action: "getWindowMode",
    payload: {},
  });
}

export function setWindowMode(mode: WindowMode) {
  return postWebviewMessage({
    action: "setWindowMode",
    payload: {
      mode,
    },
  });
}

let initialized = false;
export async function initializeApp(role: "client" | "dashboard" = "client") {
  if (initialized) {
    return;
  }
  initialized = true;

  const gameState = useGameState.getState();
  const liveState = useLiveState.getState();

  // Listen for direct WebView messages from C++
  if (typeof window !== "undefined" && window.chrome?.webview) {
    window.chrome.webview.addEventListener("message", (event: MessageEvent) => {
      try {
        const message = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (typeof message === "object" && typeof message.action === "string") {
          // Client (Overlay/Desktop) specific handlers
          if (role === "client") {
            if (message.action === "player") {
              gameState.setPlayer({
                ...message.payload,
                address: 0,
                type: "player",
              });
            } else if (message.action === "actors") {
              gameState.setActors(message.payload);
            } else if (message.action === "characterData") {
              gameState.setCharacter(message.payload);
            } else if (message.action === "windowModeChanged") {
              liveState.setWindowMode(message.payload);
            } else if (message.action === "alwaysRunAsAdminChanged") {
              liveState.setAlwaysRunAsAdmin(message.payload);
            }
          }
          // Dashboard specific handlers - receive directly from C++
          if (role === "dashboard") {
            if (message.action === "runningGames") {
              liveState.setRunningGames(message.payload);
              // Cleanup stale sessions - mark sessions as closed if their PID is no longer active
              const activePids = message.payload.map((g: RunningGame) => g.pid);
              useTHGLAppState.getState().cleanupStaleSessions(activePids);
            } else if (message.action === "gameSession") {
              useTHGLAppState.getState().updateGameSession(message.payload);
            } else if (message.action === "connectedClients") {
              liveState.setConnectedClients(message.payload);
            } else if (message.action === "version") {
              liveState.setVersion(message.payload);
            } else if (message.action === "isTaskInstalled") {
              liveState.setIsTaskInstalled(message.payload);
            } else if (message.action === "windowModeChanged") {
              liveState.setWindowMode(message.payload);
            } else if (message.action === "alwaysRunAsAdminChanged") {
              liveState.setAlwaysRunAsAdmin(message.payload);
            }
          }
          // Client (Overlay/Desktop) handlers for DevTools and close requests
          if (role === "client") {
            if (message.action === "openDevTools") {
              if (message.payload.url === location.href) {
                openDevTools();
              }
            } else if (message.action === "closeWebViews") {
              if (message.payload.includes(location.href)) {
                postWebviewMessage({
                  action: "clickthroughOverlayWebView",
                  payload: {
                    clickthrough: true,
                  },
                }).catch(() => {});
                window.chrome.webview.postMessage("close");
              }
            }
          }
        }
      } catch (e) {
        // Ignore parse errors for non-JSON messages
      }
    });
    console.log("Direct WebView message listener registered for", role);
  }

  // For dashboard role, request initial state from C++ when ready
  if (role === "dashboard") {
    const fetchInitialState = async (retries = 3, delay = 500): Promise<void> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const res = await getInitialStateFromWebview();
          const data = res.data;
          liveState.setVersion(data.version);
          // isTaskInstalled is fetched separately to avoid blocking
          if (data.isTaskInstalled !== null) {
            liveState.setIsTaskInstalled(data.isTaskInstalled);
          }
          liveState.setWindowMode(data.windowMode);
          liveState.setGpuFlag(data.gpuFlag);
          liveState.setIsRunningAsAdmin(data.isRunningAsAdmin ?? false);
          liveState.setAlwaysRunAsAdmin(data.alwaysRunAsAdmin ?? false);
          console.log("Dashboard received initial state:", data);

          // Cleanup stale sessions on startup - use current running games if available, else empty
          const currentRunningGames = liveState.runningGames ?? [];
          const activePids = currentRunningGames.map((g) => g.pid);
          useTHGLAppState.getState().cleanupStaleSessions(activePids);
          return; // Success, exit
        } catch (e) {
          console.warn(`Failed to get initial state (attempt ${attempt}/${retries}):`, e);
          if (attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
      console.error("Failed to get initial state after all retries");
    };
    fetchInitialState();
  }

  // For client role, fetch window mode directly from C++
  if (role === "client") {
    getWindowMode()
      .then((res) => {
        liveState.setWindowMode(res.data);
      })
      .catch(console.error);

    // Sync initial hotkeys to C++ and subscribe to changes
    syncHotkeysToNative();
    let prevHotkeys = useSettingsStore.getState().hotkeys;
    useSettingsStore.subscribe((state) => {
      if (state.hotkeys !== prevHotkeys) {
        prevHotkeys = state.hotkeys;
        syncHotkeysToNative();
      }
    });
  }
}
