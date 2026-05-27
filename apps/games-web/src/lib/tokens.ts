/**
 * Patreon token store backed by Bunny Database (libSQL/SQLite).
 *
 * Replaces the prior Upstash KV implementation — the container
 * couldn't reach Upstash eu-central-1 reliably (frequent
 * ConnectTimeoutErrors), so we moved to Bunny DB which lives on the
 * same edge network.
 *
 * Schema (applied manually via the libSQL HTTP API):
 *
 *   CREATE TABLE patreon_tokens (
 *     user_id       TEXT PRIMARY KEY,
 *     access_token  TEXT NOT NULL,
 *     refresh_token TEXT NOT NULL,
 *     expires_in    INTEGER NOT NULL,
 *     scope         TEXT NOT NULL,
 *     token_type    TEXT NOT NULL,
 *     expires_at    INTEGER NOT NULL,
 *     updated_at    INTEGER NOT NULL
 *   );
 *   CREATE INDEX patreon_tokens_expires ON patreon_tokens(expires_at);
 */

export interface PatreonToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: "Bearer";
}

// Patreon refresh tokens are good for ~31 days; we re-pin on every
// refresh.
const TTL_SECONDS = 60 * 60 * 24 * 31;

// libSQL exposes a `libsql://` URL; the HTTP pipeline API lives at
// the same host over https.
const BUNNY_DB_URL = process.env.BUNNY_DATABASE_URL?.replace(
  /^libsql:\/\//,
  "https://",
).replace(/\/+$/, "");
const BUNNY_DB_TOKEN = process.env.BUNNY_DATABASE_AUTH_TOKEN;

type LibSqlArg =
  | { type: "text"; value: string }
  | { type: "integer"; value: string }
  | { type: "null"; value: null };

interface LibSqlStmt {
  sql: string;
  args?: LibSqlArg[];
}

interface LibSqlResult {
  cols: { name: string }[];
  rows: { type: string; value: string }[][];
}

interface LibSqlResponse {
  results: Array<
    | { type: "ok"; response: { type: "execute"; result: LibSqlResult } }
    | { type: "error"; error: { message: string; code?: string } }
  >;
}

// 5s per-call timeout — Bunny DB is co-located with the container so
// anything slower is a hung connection, not legitimate work.
async function libsql(stmts: LibSqlStmt[]): Promise<LibSqlResult[]> {
  if (!BUNNY_DB_URL || !BUNNY_DB_TOKEN) {
    throw new Error(
      "BUNNY_DATABASE_URL or BUNNY_DATABASE_AUTH_TOKEN is not set",
    );
  }
  const ctrl = new AbortController();
  const timeoutId = setTimeout(() => ctrl.abort(), 5000);
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

export async function getToken(userId: string): Promise<PatreonToken | null> {
  const now = Math.floor(Date.now() / 1000);
  const [result] = await libsql([
    {
      sql: "SELECT access_token, refresh_token, expires_in, scope, token_type FROM patreon_tokens WHERE user_id = ? AND expires_at > ?",
      args: [
        { type: "text", value: userId },
        { type: "integer", value: String(now) },
      ],
    },
  ]);
  const row = result.rows[0];
  if (!row) return null;
  return {
    access_token: row[0].value,
    refresh_token: row[1].value,
    expires_in: Number(row[2].value),
    scope: row[3].value,
    token_type: row[4].value as "Bearer",
  };
}

export async function setToken(
  userId: string,
  token: PatreonToken,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await libsql([
    {
      sql: "INSERT INTO patreon_tokens (user_id, access_token, refresh_token, expires_in, scope, token_type, expires_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET access_token = excluded.access_token, refresh_token = excluded.refresh_token, expires_in = excluded.expires_in, scope = excluded.scope, token_type = excluded.token_type, expires_at = excluded.expires_at, updated_at = excluded.updated_at",
      args: [
        { type: "text", value: userId },
        { type: "text", value: token.access_token },
        { type: "text", value: token.refresh_token },
        { type: "integer", value: String(token.expires_in) },
        { type: "text", value: token.scope },
        { type: "text", value: token.token_type },
        { type: "integer", value: String(now + TTL_SECONDS) },
        { type: "integer", value: String(now) },
      ],
    },
  ]);
}

export async function delToken(userId: string): Promise<void> {
  await libsql([
    {
      sql: "DELETE FROM patreon_tokens WHERE user_id = ?",
      args: [{ type: "text", value: userId }],
    },
  ]);
}
