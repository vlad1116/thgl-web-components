/**
 * Thin HTTP client for the Bunny Database libSQL endpoint.
 *
 * Bunny exposes libsql:// URLs; the pipeline API lives at the same
 * host over https. We don't use the official @libsql/client SDK
 * because:
 *   1. It's heavyweight (WASM, hrana protocol negotiation) for what
 *      amounts to a JSON POST.
 *   2. The HTTP pipeline API is stable and tiny — one fetch per batch.
 *
 * Per-call timeout is 5s. Bunny DB is co-located with the Magic
 * Container, so anything slower than that is a hung connection,
 * not legitimate work.
 */

const BUNNY_DB_URL = process.env.BUNNY_DATABASE_URL?.replace(
  /^libsql:\/\//,
  "https://",
).replace(/\/+$/, "");
const BUNNY_DB_TOKEN = process.env.BUNNY_DATABASE_AUTH_TOKEN;

export type LibSqlArg =
  | { type: "text"; value: string }
  | { type: "integer"; value: string }
  | { type: "null"; value: null };

export interface LibSqlStmt {
  sql: string;
  args?: LibSqlArg[];
}

export interface LibSqlResult {
  cols: { name: string }[];
  rows: { type: string; value: string }[][];
  affected_row_count?: number;
}

interface LibSqlResponse {
  results: Array<
    | { type: "ok"; response: { type: "execute"; result: LibSqlResult } }
    | { type: "error"; error: { message: string; code?: string } }
  >;
}

export async function libsql(
  stmts: LibSqlStmt[],
  timeoutMs = 5000,
): Promise<LibSqlResult[]> {
  if (!BUNNY_DB_URL || !BUNNY_DB_TOKEN) {
    throw new Error(
      "BUNNY_DATABASE_URL or BUNNY_DATABASE_AUTH_TOKEN is not set",
    );
  }
  const ctrl = new AbortController();
  const timeoutId = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BUNNY_DB_URL}/v2/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${BUNNY_DB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: stmts.map((stmt) => ({ type: "execute", stmt })),
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      throw new Error(
        `libsql HTTP ${res.status}: ${await res.text().catch(() => "")}`.slice(
          0,
          300,
        ),
      );
    }
    const body = (await res.json()) as LibSqlResponse;
    return body.results.map((r, i) => {
      if (r.type === "error") {
        throw new Error(`libsql stmt ${i}: ${r.error.message}`);
      }
      return r.response.result;
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export const arg = {
  text: (value: string): LibSqlArg => ({ type: "text", value }),
  int: (value: number | string): LibSqlArg => ({
    type: "integer",
    value: String(value),
  }),
  null: (): LibSqlArg => ({ type: "null", value: null }),
};
