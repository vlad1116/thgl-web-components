import {
  corsPreflight,
  handle,
  jsonResponse,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  PayloadTooLargeError,
} from "@/lib/api-errors";
import { requireAccount } from "@/lib/auth";
import {
  deleteFilter,
  getFilterById,
  upsertFilter,
  type Visibility,
} from "@/lib/filters-db";

const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024;

interface UpsertBody {
  game: string;
  name: string;
  payload: unknown;
  visibility?: Visibility;
}

function isUpsertBody(x: unknown): x is UpsertBody {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  if (typeof o.game !== "string" || !o.game) return false;
  if (typeof o.name !== "string" || !o.name) return false;
  if (typeof o.payload !== "object" || o.payload === null) return false;
  if (
    o.visibility !== undefined &&
    o.visibility !== "private" &&
    o.visibility !== "public"
  )
    return false;
  return true;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    const filter = await getFilterById(id);
    if (!filter) throw new NotFoundError("Filter not found");
    // Private filters: anyone with the id can fetch IF they have a
    // share_code path, but we keep this endpoint strict — only public
    // filters are readable here. Private holders use by-code.
    if (filter.visibility !== "public") {
      // Owners can always read their own — but to know the caller is
      // the owner we'd need to verify the cookie. We do that softly:
      // import getUserIdFromCookies and check; otherwise 404.
      const { getUserIdFromCookies } = await import("@/lib/auth");
      const userId = await getUserIdFromCookies();
      if (userId !== filter.userId) throw new NotFoundError("Filter not found");
    }
    return jsonResponse({ filter });
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    const userId = await requireAccount();

    const contentLength = request.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_PAYLOAD_BYTES) {
      throw new PayloadTooLargeError("Filter payload exceeds 10 MB");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new BadRequestError("Invalid JSON body");
    }
    if (!isUpsertBody(body)) {
      throw new BadRequestError(
        "Body must be { game, name, payload, visibility? }",
      );
    }

    // Check existing ownership for upserts of an existing id.
    const existing = await getFilterById(id);
    if (existing && existing.userId !== userId) {
      throw new ForbiddenError("Not the owner of this filter");
    }

    const filter = await upsertFilter({
      id,
      userId,
      game: body.game,
      name: body.name,
      payload: body.payload,
      visibility: body.visibility ?? existing?.visibility ?? "private",
    });
    return jsonResponse({ filter });
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    const userId = await requireAccount();
    const deleted = await deleteFilter(id, userId);
    if (deleted === 0) {
      // Either nonexistent or not owned. We collapse both into 404 so
      // ownership probing is impossible from this endpoint.
      throw new NotFoundError("Filter not found");
    }
    return jsonResponse({ deleted: true });
  });
}

export function OPTIONS() {
  return corsPreflight();
}
