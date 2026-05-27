import {
  corsPreflight,
  handle,
  jsonResponse,
  BadRequestError,
} from "@/lib/api-errors";
import { listPublicFilters } from "@/lib/filters-db";

export async function GET(request: Request) {
  return handle(async () => {
    const params = new URL(request.url).searchParams;
    const game = params.get("game");
    if (!game) throw new BadRequestError("game query param required");
    const rawSort = params.get("sort") ?? "top";
    if (!["top", "new", "recent"].includes(rawSort)) {
      throw new BadRequestError("sort must be top | new | recent");
    }
    const cursorParam = params.get("cursor");
    const cursor = cursorParam ? Number(cursorParam) : undefined;
    if (cursorParam && !Number.isFinite(cursor)) {
      throw new BadRequestError("cursor must be a number");
    }
    const limitParam = params.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;
    if (limitParam && !Number.isFinite(limit)) {
      throw new BadRequestError("limit must be a number");
    }
    const q = params.get("q") ?? undefined;
    const page = await listPublicFilters({
      game,
      q,
      sort: rawSort as "top" | "new" | "recent",
      cursor,
      limit,
    });
    return jsonResponse(page);
  });
}

export function OPTIONS() {
  return corsPreflight();
}
