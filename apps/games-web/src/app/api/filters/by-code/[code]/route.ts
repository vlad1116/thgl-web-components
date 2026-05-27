import {
  corsPreflight,
  handle,
  jsonResponse,
  NotFoundError,
} from "@/lib/api-errors";
import { getFilterByShareCode } from "@/lib/filters-db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  return handle(async () => {
    const { code } = await params;
    const filter = await getFilterByShareCode(code);
    if (!filter) throw new NotFoundError("Share code not found");
    return jsonResponse({ filter });
  });
}

export function OPTIONS() {
  return corsPreflight();
}
