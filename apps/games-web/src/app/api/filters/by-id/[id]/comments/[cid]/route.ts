import {
  corsPreflight,
  handle,
  jsonResponse,
  NotFoundError,
} from "@/lib/api-errors";
import { requireAccount } from "@/lib/auth";
import { deleteComment } from "@/lib/filters-db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; cid: string }> },
) {
  return handle(async () => {
    const { cid } = await params;
    const userId = await requireAccount();
    const result = await deleteComment(cid, userId);
    if (!result.deleted) {
      // Collapses "not yours" and "doesn't exist" into 404.
      throw new NotFoundError("Comment not found");
    }
    return jsonResponse({ deleted: true });
  });
}

export function OPTIONS() {
  return corsPreflight();
}
