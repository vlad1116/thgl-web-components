import { createSitemapIndex } from "@repo/lib";
import { getAppConfig } from "@/lib/get-app-config";

export async function GET() {
  const config = await getAppConfig();
  return createSitemapIndex(config)();
}
