import { useGameState } from "../game";
import { useSettingsStore } from "../settings";
import { useLiveState, usePersistentState } from "./states";
import { postWebviewMessage } from "./webview";
import {
  initMessageWorker,
  listenToWorkerMessages,
  requestFromMain,
  WindowMode,
} from "./worker";

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

  const workerReady = initMessageWorker(role);

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
            }
          }
          // Dashboard specific handlers - receive directly from C++
          if (role === "dashboard") {
            if (message.action === "runningGames") {
              liveState.setRunningGames(message.payload);
            } else if (message.action === "gameSession") {
              usePersistentState.getState().updateGameSession(message.payload);
            }
          }
        }
      } catch (e) {
        // Ignore parse errors for non-JSON messages
      }
    });
    console.log("Direct WebView message listener registered for", role);
  }

  listenToWorkerMessages((msg) => {
    switch (msg.type) {
      case "init":
        console.log("Worker initialized with ID: ", msg.data);
        break;
      case "broadcast":
        if (
          typeof msg.data === "object" &&
          typeof msg.data.action === "string"
        ) {
          // These actions are still routed via SharedWorker
          if (msg.data.action === "connectedClients") {
            liveState.setConnectedClients(msg.data.payload);
          } else if (msg.data.action === "openDevTools") {
            if (msg.data.payload.url === location.href) {
              openDevTools();
            }
          } else if (msg.data.action === "closeWebViews") {
            if (msg.data.payload.includes(location.href)) {
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
        break;
    }
  });

  if (role === "dashboard") {
    // Wait for worker to be initialized before sending requests
    await workerReady;

    requestFromMain({ action: "isRunningAsAdmin", payload: null })
      .then((res) => {
        liveState.setIsRunningAsAdmin(res.data);
      })
      .catch(console.error);
    requestFromMain({ action: "isTaskInstalled", payload: null })
      .then((res) => {
        liveState.setIsTaskInstalled(res.data);
      })
      .catch(console.error);
    requestFromMain({ action: "getVersion", payload: null })
      .then((res) => {
        liveState.setVersion(res.data);
      })
      .catch(console.error);
    requestFromMain({ action: "getWindowMode", payload: null })
      .then((res) => {
        liveState.setWindowMode(res.data);
      })
      .catch(console.error);
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
