import { libsql, arg } from "@/lib/libsql";

/**
 * Typed data access for the shared-filters feature.
 *
 * Tables (created in Bunny DB, see migration commit):
 *   user_filters   — owned filters; `payload` is opaque JSON ({ nodes, drawing })
 *   filter_votes   — one row per (filter, user); upvote-only
 *   filter_comments
 *
 * vote_count / comment_count on user_filters are denormalized and
 * kept in sync by the same statement batch that writes the votes /
 * comments row. Keeps catalog list queries cheap (no GROUP BY).
 */

export type Visibility = "private" | "public";

/**
 * 12-char URL-safe alphanumeric share code. Entropy is 62^12 ≈ 3e21;
 * collision probability is negligible for the size of catalog we
 * realistically care about (millions of rows). UNIQUE constraint on
 * the column will reject any actual collision.
 */
export function generateShareCode(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const buf = new Uint8Array(12);
  crypto.getRandomValues(buf);
  let out = "";
  for (let i = 0; i < buf.length; i++) {
    out += chars[buf[i] % chars.length];
  }
  return out;
}

export interface UserFilter {
  id: string;
  userId: string;
  game: string;
  name: string;
  payload: unknown;
  visibility: Visibility;
  shareCode: string | null;
  voteCount: number;
  commentCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface UserFilterMeta {
  id: string;
  userId: string;
  game: string;
  name: string;
  visibility: Visibility;
  shareCode: string | null;
  voteCount: number;
  commentCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface FilterComment {
  id: string;
  filterId: string;
  userId: string;
  body: string;
  createdAt: number;
}

// Columns selected for full filter (payload included).
const FILTER_COLS =
  "id, user_id, game, name, payload, visibility, share_code, vote_count, comment_count, created_at, updated_at";

// Columns for list views (no payload — payload can be huge).
const FILTER_META_COLS =
  "id, user_id, game, name, visibility, share_code, vote_count, comment_count, created_at, updated_at";

function rowToFilter(row: { type: string; value: string }[]): UserFilter {
  return {
    id: row[0].value,
    userId: row[1].value,
    game: row[2].value,
    name: row[3].value,
    payload: JSON.parse(row[4].value),
    visibility: row[5].value as Visibility,
    shareCode: row[6].type === "null" ? null : row[6].value,
    voteCount: Number(row[7].value),
    commentCount: Number(row[8].value),
    createdAt: Number(row[9].value),
    updatedAt: Number(row[10].value),
  };
}

function rowToMeta(row: { type: string; value: string }[]): UserFilterMeta {
  return {
    id: row[0].value,
    userId: row[1].value,
    game: row[2].value,
    name: row[3].value,
    visibility: row[4].value as Visibility,
    shareCode: row[5].type === "null" ? null : row[5].value,
    voteCount: Number(row[6].value),
    commentCount: Number(row[7].value),
    createdAt: Number(row[8].value),
    updatedAt: Number(row[9].value),
  };
}

export async function getFilterById(id: string): Promise<UserFilter | null> {
  const [result] = await libsql([
    {
      sql: `SELECT ${FILTER_COLS} FROM user_filters WHERE id = ?`,
      args: [arg.text(id)],
    },
  ]);
  const row = result.rows[0];
  return row ? rowToFilter(row) : null;
}

export async function getFilterByShareCode(
  code: string,
): Promise<UserFilter | null> {
  const [result] = await libsql([
    {
      sql: `SELECT ${FILTER_COLS} FROM user_filters WHERE share_code = ?`,
      args: [arg.text(code)],
    },
  ]);
  const row = result.rows[0];
  return row ? rowToFilter(row) : null;
}

export async function listMyFilters(
  userId: string,
  game: string,
): Promise<UserFilter[]> {
  // For "my filters" we send full payloads — clients need to render them.
  // Could move to meta-only + per-id fetch on demand if size becomes an issue.
  const [result] = await libsql([
    {
      sql: `SELECT ${FILTER_COLS} FROM user_filters WHERE user_id = ? AND game = ? ORDER BY updated_at DESC`,
      args: [arg.text(userId), arg.text(game)],
    },
  ]);
  return result.rows.map(rowToFilter);
}

export interface PublicCatalogQuery {
  game: string;
  q?: string;
  sort?: "top" | "new" | "recent";
  cursor?: number;
  limit?: number;
}

export interface PublicCatalogPage {
  items: UserFilterMeta[];
  nextCursor: number | null;
}

export async function listPublicFilters(
  query: PublicCatalogQuery,
): Promise<PublicCatalogPage> {
  const limit = Math.min(query.limit ?? 30, 100);
  // Cursor encoding depends on sort: it's the value of the sort column
  // from the last row of the previous page. Simpler than (value, id)
  // tiebreaks at the cost of skipping ties — fine for catalog browsing.
  let orderCol: "vote_count" | "created_at" | "updated_at";
  switch (query.sort ?? "top") {
    case "new":
      orderCol = "created_at";
      break;
    case "recent":
      orderCol = "updated_at";
      break;
    default:
      orderCol = "vote_count";
  }
  const conds: string[] = ["visibility = 'public'", "game = ?"];
  const args = [arg.text(query.game)];
  if (query.q) {
    conds.push("name LIKE ?");
    args.push(arg.text(`%${query.q}%`));
  }
  if (query.cursor !== undefined) {
    conds.push(`${orderCol} < ?`);
    args.push(arg.int(query.cursor));
  }
  const sql = `SELECT ${FILTER_META_COLS} FROM user_filters WHERE ${conds.join(" AND ")} ORDER BY ${orderCol} DESC LIMIT ?`;
  args.push(arg.int(limit + 1));
  const [result] = await libsql([{ sql, args }]);
  const items = result.rows.map(rowToMeta);
  const hasMore = items.length > limit;
  if (hasMore) items.pop();
  const colIdx = orderCol === "vote_count" ? 6 : orderCol === "created_at" ? 8 : 9;
  const lastRow = result.rows[items.length - 1];
  const nextCursor =
    hasMore && lastRow ? Number(lastRow[colIdx].value) : null;
  return { items, nextCursor };
}

export interface UpsertFilterInput {
  id: string;
  userId: string;
  game: string;
  name: string;
  payload: unknown;
  visibility: Visibility;
}

export async function upsertFilter(
  input: UpsertFilterInput,
): Promise<UserFilter> {
  const now = Math.floor(Date.now() / 1000);
  await libsql([
    {
      sql: `INSERT INTO user_filters (id, user_id, game, name, payload, visibility, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              payload = excluded.payload,
              visibility = excluded.visibility,
              updated_at = excluded.updated_at
            WHERE user_filters.user_id = excluded.user_id`,
      args: [
        arg.text(input.id),
        arg.text(input.userId),
        arg.text(input.game),
        arg.text(input.name),
        arg.text(JSON.stringify(input.payload)),
        arg.text(input.visibility),
        arg.int(now),
        arg.int(now),
      ],
    },
  ]);
  // Re-fetch to return the canonical row (handles the case where ON
  // CONFLICT's WHERE clause rejected the update because user_id didn't
  // match — caller must check ownership separately).
  const filter = await getFilterById(input.id);
  if (!filter) throw new Error("upsert failed to return a row");
  return filter;
}

export async function deleteFilter(id: string, userId: string): Promise<number> {
  const [result] = await libsql([
    {
      sql: "DELETE FROM user_filters WHERE id = ? AND user_id = ?",
      args: [arg.text(id), arg.text(userId)],
    },
  ]);
  return result.affected_row_count ?? 0;
}

export async function setShareCode(
  id: string,
  userId: string,
  code: string | null,
  visibility: Visibility,
): Promise<UserFilter | null> {
  const now = Math.floor(Date.now() / 1000);
  await libsql([
    {
      sql: `UPDATE user_filters
            SET share_code = ?, visibility = ?, updated_at = ?
            WHERE id = ? AND user_id = ?`,
      args: [
        code === null ? arg.null() : arg.text(code),
        arg.text(visibility),
        arg.int(now),
        arg.text(id),
        arg.text(userId),
      ],
    },
  ]);
  return getFilterById(id);
}

/**
 * Toggle a vote. Race-safe: relies on the (filter_id, user_id) PRIMARY
 * KEY + INSERT OR IGNORE to decide who actually wrote, then only
 * increments vote_count if our statement was the one to mutate. Two
 * concurrent toggles can't drift vote_count past 1 per user.
 */
export async function toggleVote(
  filterId: string,
  userId: string,
): Promise<{ voted: boolean; voteCount: number }> {
  const now = Math.floor(Date.now() / 1000);
  // Try to insert; if the (filter_id, user_id) row already exists,
  // INSERT OR IGNORE leaves affected_row_count = 0 and we know to
  // delete instead.
  const [insertResult] = await libsql([
    {
      sql: "INSERT OR IGNORE INTO filter_votes (filter_id, user_id, created_at) VALUES (?, ?, ?)",
      args: [arg.text(filterId), arg.text(userId), arg.int(now)],
    },
  ]);
  let voted: boolean;
  if ((insertResult.affected_row_count ?? 0) > 0) {
    // We added the vote — bump the denormalized count.
    await libsql([
      {
        sql: "UPDATE user_filters SET vote_count = vote_count + 1 WHERE id = ?",
        args: [arg.text(filterId)],
      },
    ]);
    voted = true;
  } else {
    // Row was already there → toggle off. Delete + decrement, but
    // only decrement if the delete actually removed a row (defends
    // against two concurrent "off" toggles double-decrementing).
    const [deleteResult] = await libsql([
      {
        sql: "DELETE FROM filter_votes WHERE filter_id = ? AND user_id = ?",
        args: [arg.text(filterId), arg.text(userId)],
      },
    ]);
    if ((deleteResult.affected_row_count ?? 0) > 0) {
      await libsql([
        {
          sql: "UPDATE user_filters SET vote_count = MAX(vote_count - 1, 0) WHERE id = ?",
          args: [arg.text(filterId)],
        },
      ]);
    }
    voted = false;
  }
  const [countResult] = await libsql([
    {
      sql: "SELECT vote_count FROM user_filters WHERE id = ?",
      args: [arg.text(filterId)],
    },
  ]);
  const voteCount = countResult.rows[0]
    ? Number(countResult.rows[0][0].value)
    : 0;
  return { voted, voteCount };
}

export async function hasVoted(
  filterId: string,
  userId: string,
): Promise<boolean> {
  const [result] = await libsql([
    {
      sql: "SELECT 1 FROM filter_votes WHERE filter_id = ? AND user_id = ?",
      args: [arg.text(filterId), arg.text(userId)],
    },
  ]);
  return result.rows.length > 0;
}

export async function listComments(
  filterId: string,
  cursor?: number,
  limit = 50,
): Promise<{ items: FilterComment[]; nextCursor: number | null }> {
  const cap = Math.min(limit, 200);
  const conds: string[] = ["filter_id = ?"];
  const args = [arg.text(filterId)];
  if (cursor !== undefined) {
    conds.push("created_at < ?");
    args.push(arg.int(cursor));
  }
  const sql = `SELECT id, filter_id, user_id, body, created_at FROM filter_comments WHERE ${conds.join(" AND ")} ORDER BY created_at DESC LIMIT ?`;
  args.push(arg.int(cap + 1));
  const [result] = await libsql([{ sql, args }]);
  const items: FilterComment[] = result.rows.map((row) => ({
    id: row[0].value,
    filterId: row[1].value,
    userId: row[2].value,
    body: row[3].value,
    createdAt: Number(row[4].value),
  }));
  const hasMore = items.length > cap;
  if (hasMore) items.pop();
  const last = items[items.length - 1];
  return { items, nextCursor: hasMore && last ? last.createdAt : null };
}

export async function createComment(
  filterId: string,
  userId: string,
  body: string,
): Promise<FilterComment> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  await libsql([
    {
      sql: "INSERT INTO filter_comments (id, filter_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [
        arg.text(id),
        arg.text(filterId),
        arg.text(userId),
        arg.text(body),
        arg.int(now),
      ],
    },
    {
      sql: "UPDATE user_filters SET comment_count = comment_count + 1 WHERE id = ?",
      args: [arg.text(filterId)],
    },
  ]);
  return { id, filterId, userId, body, createdAt: now };
}

export async function deleteComment(
  commentId: string,
  userId: string,
): Promise<{ deleted: boolean; filterId: string | null }> {
  // Need the filter_id before deleting so we can decrement the count.
  const [lookup] = await libsql([
    {
      sql: "SELECT filter_id FROM filter_comments WHERE id = ? AND user_id = ?",
      args: [arg.text(commentId), arg.text(userId)],
    },
  ]);
  const filterId = lookup.rows[0]?.[0].value ?? null;
  if (!filterId) return { deleted: false, filterId: null };
  await libsql([
    {
      sql: "DELETE FROM filter_comments WHERE id = ? AND user_id = ?",
      args: [arg.text(commentId), arg.text(userId)],
    },
    {
      sql: "UPDATE user_filters SET comment_count = MAX(comment_count - 1, 0) WHERE id = ?",
      args: [arg.text(filterId)],
    },
  ]);
  return { deleted: true, filterId };
}
