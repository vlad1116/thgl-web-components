import {
  corsPreflight,
  handle,
  jsonResponse,
  BadRequestError,
} from "@/lib/api-errors";
import { requireAccount } from "@/lib/auth";
import { listMyFilters } from "@/lib/filters-db";

export async function GET(request: Request) {
  return handle(async () => {
    const userId = await requireAccount();
    const game = new URL(request.url).searchParams.get("game");
    if (!game) throw new BadRequestError("game query param required");
    const filters = await listMyFilters(userId, game);
    return jsonResponse({ filters });
  });
}

export function OPTIONS() {
  return corsPreflight();
}
