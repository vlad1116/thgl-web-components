import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const PORT = 3333;
const MAX_LOGS = 1000;

interface LogEntry {
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  data?: unknown;
  source?: string;
}

// In-memory log storage (only used by primary instance)
const logs: LogEntry[] = [];
let isPrimaryInstance = false;

// Try to start HTTP server - only the first instance will succeed
async function tryStartHttpServer(): Promise<boolean> {
  try {
    Bun.serve({
      port: PORT,
      async fetch(req) {
        // Handle CORS preflight
        if (req.method === "OPTIONS") {
          return new Response(null, {
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          });
        }

        // Receive logs from browser
        if (req.method === "POST" && new URL(req.url).pathname === "/log") {
          try {
            const body = await req.json();
            const entry: LogEntry = {
              timestamp: new Date().toISOString(),
              level: body.level || "info",
              message: body.message || "",
              data: body.data,
              source: body.source,
            };

            logs.push(entry);

            // Keep only last MAX_LOGS entries
            if (logs.length > MAX_LOGS) {
              logs.shift();
            }

            // Also print to console for visibility
            const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : "";
            console.error(
              `[${entry.level.toUpperCase()}] ${entry.source ? `[${entry.source}] ` : ""}${entry.message}${dataStr}`
            );

            return new Response(JSON.stringify({ success: true }), {
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            });
          } catch (e) {
            return new Response(JSON.stringify({ error: "Invalid JSON" }), {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            });
          }
        }

        // API endpoint for secondary instances to fetch logs
        if (req.method === "GET" && new URL(req.url).pathname === "/logs") {
          return new Response(JSON.stringify(logs), {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }

        // API endpoint to clear logs
        if (req.method === "POST" && new URL(req.url).pathname === "/clear") {
          const count = logs.length;
          logs.length = 0;
          return new Response(JSON.stringify({ cleared: count }), {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }

        return new Response("Dev Logger MCP Server (primary)", { status: 200 });
      },
    });
    return true;
  } catch (e: any) {
    if (e?.code === "EADDRINUSE") {
      return false;
    }
    throw e;
  }
}

// Fetch logs from primary instance
async function fetchLogsFromPrimary(): Promise<LogEntry[]> {
  try {
    const response = await fetch(`http://localhost:${PORT}/logs`);
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    // Primary might not be running
  }
  return [];
}

// Clear logs on primary instance
async function clearLogsOnPrimary(): Promise<number> {
  try {
    const response = await fetch(`http://localhost:${PORT}/clear`, {
      method: "POST",
    });
    if (response.ok) {
      const data = await response.json();
      return data.cleared || 0;
    }
  } catch (e) {
    // Primary might not be running
  }
  return 0;
}

// Get logs (works for both primary and secondary instances)
async function getLogs(): Promise<LogEntry[]> {
  if (isPrimaryInstance) {
    return logs;
  }
  return fetchLogsFromPrimary();
}

// Start HTTP server
isPrimaryInstance = await tryStartHttpServer();

if (isPrimaryInstance) {
  console.error(`Dev Logger HTTP server running on http://localhost:${PORT} (primary instance)`);
} else {
  console.error(`Dev Logger running as secondary instance (connecting to primary on port ${PORT})`);
}

// MCP Server
const server = new McpServer({
  name: "dev-logger",
  version: "1.0.0",
});

// Tool: Get logs
server.tool(
  "getLogs",
  "Get browser console logs. Use this to debug frontend issues.",
  {
    limit: z
      .number()
      .optional()
      .describe("Maximum number of logs to return (default: 50)"),
    level: z
      .enum(["debug", "info", "warn", "error"])
      .optional()
      .describe("Filter by log level"),
    source: z.string().optional().describe("Filter by source/component name"),
    search: z.string().optional().describe("Search in message text"),
  },
  async ({ limit = 50, level, source, search }) => {
    let filtered = [...(await getLogs())];

    if (level) {
      filtered = filtered.filter((l) => l.level === level);
    }

    if (source) {
      filtered = filtered.filter((l) =>
        l.source?.toLowerCase().includes(source.toLowerCase())
      );
    }

    if (search) {
      filtered = filtered.filter(
        (l) =>
          l.message.toLowerCase().includes(search.toLowerCase()) ||
          JSON.stringify(l.data).toLowerCase().includes(search.toLowerCase())
      );
    }

    // Get last N logs
    const result = filtered.slice(-limit);

    if (result.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No logs found matching the criteria. (${isPrimaryInstance ? "primary" : "secondary"} instance)`,
          },
        ],
      };
    }

    const formatted = result
      .map((l) => {
        const dataStr = l.data ? `\n  Data: ${JSON.stringify(l.data, null, 2)}` : "";
        return `[${l.timestamp}] [${l.level.toUpperCase()}]${l.source ? ` [${l.source}]` : ""} ${l.message}${dataStr}`;
      })
      .join("\n\n");

    return {
      content: [
        {
          type: "text" as const,
          text: `Found ${result.length} log(s) (${isPrimaryInstance ? "primary" : "secondary"} instance):\n\n${formatted}`,
        },
      ],
    };
  }
);

// Tool: Clear logs
server.tool(
  "clearLogs",
  "Clear all stored logs",
  {},
  async () => {
    let count: number;
    if (isPrimaryInstance) {
      count = logs.length;
      logs.length = 0;
    } else {
      count = await clearLogsOnPrimary();
    }
    return {
      content: [
        {
          type: "text" as const,
          text: `Cleared ${count} log(s).`,
        },
      ],
    };
  }
);

// Tool: Get log stats
server.tool(
  "getLogStats",
  "Get statistics about stored logs",
  {},
  async () => {
    const allLogs = await getLogs();
    const stats = {
      total: allLogs.length,
      isPrimaryInstance,
      byLevel: {
        debug: allLogs.filter((l) => l.level === "debug").length,
        info: allLogs.filter((l) => l.level === "info").length,
        warn: allLogs.filter((l) => l.level === "warn").length,
        error: allLogs.filter((l) => l.level === "error").length,
      },
      sources: [...new Set(allLogs.map((l) => l.source).filter(Boolean))],
    };

    return {
      content: [
        {
          type: "text" as const,
          text: `Log Statistics:\n${JSON.stringify(stats, null, 2)}`,
        },
      ],
    };
  }
);

// Start MCP server
const transport = new StdioServerTransport();
await server.connect(transport);
