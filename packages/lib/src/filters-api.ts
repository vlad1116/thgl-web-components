import { useAccountStore } from "./account";
import { TH_GL_URL } from "./config";
import { isOverwolf } from "./env";
import { type DrawingsAndNodes } from "./settings";

/**
 * Client for the new /api/filters endpoints.
 *
 * Routing model:
 *   - Web (any *.th.gl tenant, dev *.localhost): relative paths.
 *     Same-origin, browser auto-sends the cookie.
 *   - Overwolf (overwolf-extension:// origin): absolute paths against
 *     TH_GL_URL. Cookies don't traverse origins; instead we send the
 *     stored userId JWT via the X-User-Id header so the server can
 *     authenticate the same way it would via cookie.
 *
 * The X-User-Id fallback is honoured by lib/auth.ts.
 */
const API_BASE_RELATIVE = "";

function apiBase(): string {
  return isOverwolf ? TH_GL_URL : API_BASE_RELATIVE;
}

function authHeaders(): Record<string, string> {
  if (!isOverwolf) return {};
  const userId = useAccountStore.getState().userId;
  return userId ? { "X-User-Id": userId } : {};
}

export type Visibility = "private" | "public";

export interface ServerFilter {
  id: string;
  userId: string;
  game: string;
  name: string;
  payload: { nodes?: unknown[]; drawing?: unknown };
  visibility: Visibility;
  shareCode: string | null;
  voteCount: number;
  commentCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface ServerFilterMeta {
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

async function jsonOrThrow<T>(res: Response): Promise<T> {
  const body = await res.text();
  const parsed = body ? (JSON.parse(body) as unknown) : ({} as unknown);
  if (!res.ok) {
    const message =
      (parsed && typeof parsed === "object" && "error" in parsed
        ? String((parsed as { error: unknown }).error)
        : `HTTP ${res.status}`) || `HTTP ${res.status}`;
    throw new FiltersApiError(message, res.status);
  }
  return parsed as T;
}

export class FiltersApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "FiltersApiError";
    this.status = status;
  }
}

export async function apiListFilters(game: string): Promise<ServerFilter[]> {
  const res = await fetch(
    `${apiBase()}/api/filters?game=${encodeURIComponent(game)}`,
    { credentials: "include", headers: authHeaders() },
  );
  const body = await jsonOrThrow<{ filters: ServerFilter[] }>(res);
  return body.filters;
}

export interface PutFilterInput {
  game: string;
  name: string;
  payload: { nodes?: unknown[]; drawing?: unknown };
  visibility?: Visibility;
}

export async function apiPutFilter(
  id: string,
  input: PutFilterInput,
): Promise<ServerFilter> {
  const res = await fetch(
    `${apiBase()}/api/filters/by-id/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(input),
    },
  );
  const body = await jsonOrThrow<{ filter: ServerFilter }>(res);
  return body.filter;
}

export async function apiDeleteFilter(id: string): Promise<void> {
  const res = await fetch(
    `${apiBase()}/api/filters/by-id/${encodeURIComponent(id)}`,
    { method: "DELETE", credentials: "include", headers: authHeaders() },
  );
  await jsonOrThrow<{ deleted: boolean }>(res);
}

export interface ShareInput {
  visibility?: Visibility;
  generateCode?: boolean;
  revokeCode?: boolean;
}

export async function apiSetShare(
  id: string,
  input: ShareInput,
): Promise<ServerFilter> {
  const res = await fetch(
    `${apiBase()}/api/filters/by-id/${encodeURIComponent(id)}/share`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(input),
    },
  );
  const body = await jsonOrThrow<{ filter: ServerFilter }>(res);
  return body.filter;
}

export async function apiGetByCode(code: string): Promise<ServerFilter> {
  const res = await fetch(
    `${apiBase()}/api/filters/by-code/${encodeURIComponent(code)}`,
  );
  const body = await jsonOrThrow<{ filter: ServerFilter }>(res);
  return body.filter;
}

export interface PublicCatalogQuery {
  game: string;
  q?: string;
  sort?: "top" | "new" | "recent";
  cursor?: number;
  limit?: number;
}

export async function apiGetPublic(
  query: PublicCatalogQuery,
): Promise<{ items: ServerFilterMeta[]; nextCursor: number | null }> {
  const params = new URLSearchParams({ game: query.game });
  if (query.q) params.set("q", query.q);
  if (query.sort) params.set("sort", query.sort);
  if (query.cursor !== undefined) params.set("cursor", String(query.cursor));
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  const res = await fetch(
    `${apiBase()}/api/filters/public?${params.toString()}`,
  );
  return jsonOrThrow<{ items: ServerFilterMeta[]; nextCursor: number | null }>(
    res,
  );
}

export async function apiGetFilter(id: string): Promise<ServerFilter> {
  const res = await fetch(
    `${apiBase()}/api/filters/by-id/${encodeURIComponent(id)}`,
    { credentials: "include", headers: authHeaders() },
  );
  const body = await jsonOrThrow<{ filter: ServerFilter }>(res);
  return body.filter;
}

export async function apiVote(
  id: string,
): Promise<{ voted: boolean; voteCount: number }> {
  const res = await fetch(
    `${apiBase()}/api/filters/by-id/${encodeURIComponent(id)}/vote`,
    { method: "POST", credentials: "include", headers: authHeaders() },
  );
  return jsonOrThrow<{ voted: boolean; voteCount: number }>(res);
}

export async function apiGetComments(
  id: string,
  cursor?: number,
): Promise<{ items: FilterComment[]; nextCursor: number | null }> {
  const params = new URLSearchParams();
  if (cursor !== undefined) params.set("cursor", String(cursor));
  const res = await fetch(
    `${apiBase()}/api/filters/by-id/${encodeURIComponent(id)}/comments?${params.toString()}`,
    { headers: authHeaders() },
  );
  return jsonOrThrow<{ items: FilterComment[]; nextCursor: number | null }>(
    res,
  );
}

export async function apiPostComment(
  id: string,
  body: string,
): Promise<FilterComment> {
  const res = await fetch(
    `${apiBase()}/api/filters/by-id/${encodeURIComponent(id)}/comments`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ body }),
    },
  );
  const out = await jsonOrThrow<{ comment: FilterComment }>(res);
  return out.comment;
}

export async function apiDeleteComment(
  id: string,
  commentId: string,
): Promise<void> {
  const res = await fetch(
    `${apiBase()}/api/filters/by-id/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}`,
    { method: "DELETE", credentials: "include", headers: authHeaders() },
  );
  await jsonOrThrow<{ deleted: boolean }>(res);
}

/** Convert a server filter into the client-side DrawingsAndNodes shape. */
export function serverFilterToLocal(server: ServerFilter): DrawingsAndNodes {
  return {
    id: server.id,
    name: server.name,
    game: server.game,
    visibility: server.visibility,
    shareCode: server.shareCode ?? undefined,
    voteCount: server.voteCount,
    commentCount: server.commentCount,
    updatedAt: server.updatedAt,
    nodes: (server.payload?.nodes as DrawingsAndNodes["nodes"]) ?? undefined,
    drawing: (server.payload?.drawing as DrawingsAndNodes["drawing"]) ?? undefined,
  };
}
