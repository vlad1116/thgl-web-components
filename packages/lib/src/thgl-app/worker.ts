import { generateUniqueId } from "./utils";
import { AppVersion } from "./version";
import { WEBVIEW_RECEIVE_MESSAGE, WEBVIEW_RESPONSE_MESSAGE } from "./webview";

export type WindowMode = "overlay" | "desktop" | "both";

type ActionRequestMap = {
  isRunningAsAdmin: null;
  isTaskInstalled: null;
  addScheduledTask: null;
  removeScheduledTask: null;
  getVersion: null;
  getWindowMode: null;
  setWindowMode: {
    mode: WindowMode;
  };
  openOverlayWebView: {
    url: string;
    title: string;
  };
  openDesktopWebView: {
    url: string;
    title: string;
  };
  updateHotkeys: {
    hotkeys: Record<string, string>; // { "toggle_app": "F6", ... }
  };
  setActorTypeFilter: {
    types: string[];
    processName?: string;
  };
  sendDebugSnapshot: {
    userContext: string;
  };
  openInBrowser: {
    url: string;
  };
};

type WebviewActionResponseMap = {
  openOverlayWebView: WEBVIEW_RESPONSE_MESSAGE;
  openDesktopWebView: WEBVIEW_RESPONSE_MESSAGE;
  updateHotkeys: WEBVIEW_RESPONSE_MESSAGE;
  setActorTypeFilter: WEBVIEW_RESPONSE_MESSAGE;
  sendDebugSnapshot: WEBVIEW_RESPONSE_MESSAGE;
  openInBrowser: WEBVIEW_RESPONSE_MESSAGE;
  getWindowMode: WEBVIEW_RESPONSE_MESSAGE<WindowMode>;
  setWindowMode: WEBVIEW_RESPONSE_MESSAGE;
};

type ActionResponseMap = {
  isRunningAsAdmin: boolean;
  isTaskInstalled: boolean;
  addScheduledTask: boolean;
  removeScheduledTask: boolean;
  getVersion: AppVersion;
  getWindowMode: WindowMode;
  setWindowMode: boolean;
} & WebviewActionResponseMap;

type WEBVIEW_REQUEST_MESSAGE = {
  [K in keyof WebviewActionResponseMap]: {
    action: K;
    requestId: string;
    payload: ActionRequestMap[K];
  };
}[keyof WebviewActionResponseMap];

type REQUEST_MESSAGE = {
  [K in keyof ActionRequestMap]: {
    action: K;
    requestId: string;
    payload: ActionRequestMap[K];
  };
}[keyof ActionRequestMap];

type PARTIAL_REQUEST_MESSAGE = {
  [K in keyof ActionRequestMap]: {
    action: K;
    payload: ActionRequestMap[K];
  };
}[keyof ActionRequestMap];

type WEBVIEW_ACTION_RESPONSE_MESSAGE<
  K extends keyof ActionResponseMap = keyof WebviewActionResponseMap,
> = {
  action: K;
  responseId: string;
  data: ActionResponseMap[K];
};

type RESPONSE_MESSAGE<
  K extends keyof ActionResponseMap = keyof ActionResponseMap,
> = {
  action: K;
  responseId: string;
  data: ActionResponseMap[K];
};

type FROM_MAIN_MESSAGE = null;

export type ConnectedClient = {
  id: number;
  href: string;
  role: "controller" | "dashboard" | "client";
};

type MAIN_BROADCAST_MESSAGE = WEBVIEW_RECEIVE_MESSAGE;

type WORKER_MESSAGE =
  | {
      type: "init";
      data: number;
    }
  | {
      type: "clientList";
      data: ConnectedClient[];
    }
  | {
      type: "broadcast";
      from: 0;
      data: MAIN_BROADCAST_MESSAGE;
    }
  | {
      type: "fromMain";
      from: 0;
      data: FROM_MAIN_MESSAGE;
    }
  | {
      type: "fromClient";
      from: number;
      data: REQUEST_MESSAGE;
    };

let worker: SharedWorker;
let workerInitialized: Promise<number>;
let workerInitializedResolve: (clientId: number) => void;

export function initMessageWorker(
  role: "controller" | "dashboard" | "client" = "client",
) {
  if (worker) {
    return workerInitialized;
  }

  // Create promise that resolves when worker sends "init" message
  workerInitialized = new Promise((resolve) => {
    workerInitializedResolve = resolve;
  });

  // Add session-based version to force new worker per app session (important for WebView2)
  // Controller generates session ID, dashboard reads it - ensures they use same worker
  let sessionId = localStorage.getItem("thgl-worker-session");
  if (!sessionId || role === "controller") {
    // Controller always creates new session, others reuse existing
    sessionId = Date.now().toString();
    localStorage.setItem("thgl-worker-session", sessionId);
  }

  const workerUrl = location.origin + "/worker.js?session=" + sessionId;
  console.log("Initializing SharedWorker for role:", role);

  worker = new SharedWorker(workerUrl);
  worker.port.postMessage({ type: "identify", href: location.href, role });

  worker.onerror = (e) => {
    console.error("Worker error", e);
  };

  window.addEventListener("beforeunload", () => {
    worker.port.postMessage({ type: "disconnect" });
  });

  return workerInitialized;
}

export function listenToWorkerMessages(
  callback: (msg: WORKER_MESSAGE) => void,
) {
  if (typeof SharedWorker === "undefined") {
    return () => {};
  }
  const handler = (e: MessageEvent<any>) => {
    const msg = e.data;
    const msgType = msg.type as
      | "init"
      | "clientList"
      | "broadcast"
      | "fromMain"
      | "fromClient";

    switch (msgType) {
      case "init":
        // Resolve the initialization promise
        if (workerInitializedResolve) {
          workerInitializedResolve(msg.data);
        }
        callback({ type: "init", data: msg.data });
        break;
      case "clientList":
        callback({ type: "clientList", data: msg.data });
        break;
      case "broadcast":
        callback({ type: "broadcast", from: msg.from, data: msg.data });
        break;
      case "fromMain":
        callback({ type: "fromMain", from: msg.from, data: msg.data });
        break;
      case "fromClient":
        callback({ type: "fromClient", from: msg.from, data: msg.data });
        break;
    }
  };

  worker.port.addEventListener("message", handler);
  worker.port.start();

  return () => {
    worker.port.removeEventListener("message", handler);
  };
}

export function answerRequest<K extends keyof ActionResponseMap>(
  targetClientId: number,
  request: Extract<REQUEST_MESSAGE, { action: K }>,
  data: ActionResponseMap[K],
) {
  const response: RESPONSE_MESSAGE<K> = {
    action: request.action,
    responseId: request.requestId,
    data,
  };

  worker.port.postMessage({
    type: "toClient",
    targetClientId,
    data: response,
  });
}

export async function answerWebViewRequest<
  K extends keyof WebviewActionResponseMap,
>(
  targetClientId: number,
  request: Extract<WEBVIEW_REQUEST_MESSAGE, { action: K }>,
  webviewPromise: Promise<WEBVIEW_RESPONSE_MESSAGE<any>>,
) {
  const data = await webviewPromise;
  const response = {
    action: request.action,
    responseId: request.requestId,
    data,
  } as WEBVIEW_ACTION_RESPONSE_MESSAGE<K>;

  worker.port.postMessage({
    type: "toClient",
    targetClientId,
    data: response,
  });
}

export function sendBroadcast(message: MAIN_BROADCAST_MESSAGE) {
  worker.port.postMessage({
    type: "sendBroadcast",
    data: message,
  });
}

export function requestFromMain<K extends keyof ActionRequestMap>(
  message: Extract<PARTIAL_REQUEST_MESSAGE, { action: K }>,
) {
  return new Promise<RESPONSE_MESSAGE<K>>((resolve, reject) => {
    const requestId = generateUniqueId();

    // Message event handler to capture the response.
    const handler = (e: MessageEvent<any>) => {
      const msg = e.data;
      if (msg.type === "fromMain" && msg.data.responseId === requestId) {
        worker.port.removeEventListener("message", handler);
        resolve(msg.data);
      }
    };

    worker.port.addEventListener("message", handler);

    // Attach unique ID to the request
    const payload = { ...message, requestId };

    worker.port.postMessage({
      type: "toClient",
      targetClientId: 0,
      data: payload,
    });
    worker.port.start();

    setTimeout(() => {
      worker.port.removeEventListener("message", handler);
      reject(new Error(`${message.action} timed out`));
    }, 10000);
  });
}

export const openWebView = (url: string, title: string) =>
  requestFromMain({
    action: "openDesktopWebView",
    payload: { url, title },
  });

export const requestUpdateHotkeys = (hotkeys: Record<string, string>) =>
  requestFromMain({
    action: "updateHotkeys",
    payload: {
      hotkeys, // Pass full mapping { "toggle_app": "F6", ... }
    },
  });

export const requestOpenOverlayWebView = (url: string, title: string) =>
  requestFromMain({
    action: "openOverlayWebView",
    payload: { url: url, title: title },
  });

export const requestSetActorTypeFilter = (
  types: string[],
  processName?: string,
) =>
  requestFromMain({
    action: "setActorTypeFilter",
    payload: { types, processName },
  });

export const requestOpenInBrowser = (url: string) =>
  requestFromMain({
    action: "openInBrowser",
    payload: { url },
  });

export const requestGetWindowMode = () =>
  requestFromMain({
    action: "getWindowMode",
    payload: null,
  });

export const requestSetWindowMode = (mode: WindowMode) =>
  requestFromMain({
    action: "setWindowMode",
    payload: { mode },
  });
