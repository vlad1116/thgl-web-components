import {
  corsPreflight,
  handle,
  jsonResponse,
  BadRequestError,
  NotFoundError,
} from "@/lib/api-errors";
import { requireAccount } from "@/lib/auth";
import {
  createComment,
  getFilterById,
  listComments,
} from "@/lib/filters-db";

const MAX_COMMENT_LEN = 4000;

interface CreateCommentBody {
  body: string;
}

function isCreateCommentBody(x: unknown): x is CreateCommentBody {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as { body?: unknown }).body === "string"
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    const url = new URL(request.url);
    const cursorParam = url.searchParams.get("cursor");
    const cursor = cursorParam ? Number(cursorParam) : undefined;
    if (cursorParam && !Number.isFinite(cursor)) {
      throw new BadRequestError("cursor must be a number");
    }
    // Don't reveal comment counts on filters that don't exist, but
    // public + private + shared-via-code all return their comments.
    // The filter id is opaque enough that this isn't a probing risk.
    const filter = await getFilterById(id);
    if (!filter) throw new NotFoundError("Filter not found");
    const page = await listComments(id, cursor);
    return jsonResponse(page);
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    const userId = await requireAccount();

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      throw new BadRequestError("Invalid JSON body");
    }
    if (!isCreateCommentBody(raw)) {
      throw new BadRequestError("Body must be { body: string }");
    }
    const body = raw.body.trim();
    if (!body) throw new BadRequestError("Comment body cannot be empty");
    if (body.length > MAX_COMMENT_LEN) {
      throw new BadRequestError(
        `Comment body exceeds ${MAX_COMMENT_LEN} characters`,
      );
    }

    const filter = await getFilterById(id);
    if (!filter) throw new NotFoundError("Filter not found");

    const comment = await createComment(id, userId, body);
    return jsonResponse({ comment });
  });
}

export function OPTIONS() {
  return corsPreflight();
}
