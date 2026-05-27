import {
  corsPreflight,
  handle,
  jsonResponse,
  NotFoundError,
} from "@/lib/api-errors";
import { requireAccount } from "@/lib/auth";
import { getFilterById, toggleVote } from "@/lib/filters-db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    const userId = await requireAccount();
    const existing = await getFilterById(id);
    if (!existing) throw new NotFoundError("Filter not found");
    // Voting is only meaningful for public filters. Private filters
    // wouldn't show in the catalog; refuse to vote on them.
    if (existing.visibility !== "public") {
      throw new NotFoundError("Filter not found");
    }
    const result = await toggleVote(id, userId);
    return jsonResponse(result);
  });
}

export function OPTIONS() {
  return corsPreflight();
}
