import {
  corsPreflight,
  handle,
  jsonResponse,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/api-errors";
import { requireAccount } from "@/lib/auth";
import {
  generateShareCode,
  getFilterById,
  setShareCode,
  type Visibility,
} from "@/lib/filters-db";

interface ShareBody {
  visibility?: Visibility;
  // If true, generate a new share code (or replace the existing one).
  // If the filter has no code, the first call to /share with
  // generateCode=true (default) creates one.
  generateCode?: boolean;
  // If true, clear the existing share code (revoke link sharing).
  // Mutually exclusive with generateCode.
  revokeCode?: boolean;
}

function isShareBody(x: unknown): x is ShareBody {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  if (
    o.visibility !== undefined &&
    o.visibility !== "private" &&
    o.visibility !== "public"
  )
    return false;
  if (o.generateCode !== undefined && typeof o.generateCode !== "boolean")
    return false;
  if (o.revokeCode !== undefined && typeof o.revokeCode !== "boolean")
    return false;
  return true;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    const userId = await requireAccount();

    let body: unknown = {};
    if (request.headers.get("content-length") !== "0") {
      try {
        body = await request.json();
      } catch {
        // Empty body is fine — treat as defaults.
      }
    }
    if (!isShareBody(body)) {
      throw new BadRequestError(
        "Body must be { visibility?, generateCode?, revokeCode? }",
      );
    }
    if (body.generateCode && body.revokeCode) {
      throw new BadRequestError(
        "generateCode and revokeCode are mutually exclusive",
      );
    }

    const existing = await getFilterById(id);
    if (!existing) throw new NotFoundError("Filter not found");
    if (existing.userId !== userId)
      throw new ForbiddenError("Not the owner of this filter");

    const nextVisibility: Visibility =
      body.visibility ?? existing.visibility;

    let nextCode: string | null = existing.shareCode;
    if (body.revokeCode) {
      nextCode = null;
    } else if (body.generateCode || (!existing.shareCode && body.generateCode !== false)) {
      // Default behaviour on first /share call: mint a code if there
      // isn't one yet. Callers can opt out with generateCode=false.
      nextCode = generateShareCode();
    }

    const updated = await setShareCode(id, userId, nextCode, nextVisibility);
    if (!updated) throw new NotFoundError("Filter not found");
    return jsonResponse({ filter: updated });
  });
}

export function OPTIONS() {
  return corsPreflight();
}
