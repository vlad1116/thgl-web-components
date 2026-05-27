import { libsql, arg } from "@/lib/libsql";

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

export async function getToken(userId: string): Promise<PatreonToken | null> {
  const now = Math.floor(Date.now() / 1000);
  const [result] = await libsql([
    {
      sql: "SELECT access_token, refresh_token, expires_in, scope, token_type FROM patreon_tokens WHERE user_id = ? AND expires_at > ?",
      args: [arg.text(userId), arg.int(now)],
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
        arg.text(userId),
        arg.text(token.access_token),
        arg.text(token.refresh_token),
        arg.int(token.expires_in),
        arg.text(token.scope),
        arg.text(token.token_type),
        arg.int(now + TTL_SECONDS),
        arg.int(now),
      ],
    },
  ]);
}

export async function delToken(userId: string): Promise<void> {
  await libsql([
    {
      sql: "DELETE FROM patreon_tokens WHERE user_id = ?",
      args: [arg.text(userId)],
    },
  ]);
}
