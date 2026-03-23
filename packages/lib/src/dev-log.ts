const DEV_LOGGER_URL = "http://localhost:3333/log";

type LogLevel = "debug" | "info" | "warn" | "error";

interface DevLogOptions {
  source?: string;
}

/**
 * Send logs to the dev-logger MCP server for debugging.
 * Only works in development mode and fails silently if the server is not running.
 *
 * Usage:
 *   devLog.info("PrivateNode", "applyIcon called", { width, height });
 *   devLog.error("PrivateNode", "Failed to load icon", { error });
 */
function createDevLog() {
  const isDev =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  const send = (
    level: LogLevel,
    source: string,
    message: string,
    data?: unknown
  ) => {
    // Always log to console
    const consoleFn =
      level === "error"
        ? console.error
        : level === "warn"
          ? console.warn
          : level === "debug"
            ? console.debug
            : console.log;

    const prefix = source ? `[${source}]` : "";
    if (data !== undefined) {
      consoleFn(`${prefix} ${message}`, data);
    } else {
      consoleFn(`${prefix} ${message}`);
    }

    // Send to dev server in development
    if (isDev) {
      fetch(DEV_LOGGER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, source, message, data }),
      }).catch(() => {
        // Silently fail if dev server is not running
      });
    }
  };

  return {
    debug: (source: string, message: string, data?: unknown) =>
      send("debug", source, message, data),
    info: (source: string, message: string, data?: unknown) =>
      send("info", source, message, data),
    warn: (source: string, message: string, data?: unknown) =>
      send("warn", source, message, data),
    error: (source: string, message: string, data?: unknown) =>
      send("error", source, message, data),
  };
}

export const devLog = createDevLog();
