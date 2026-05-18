import { createHomePage, createHomePageGenerateMetadata } from "@repo/ui/apps";
import {
  createDbHomePage,
  createDbHomePageGenerateMetadata,
} from "@/lib/db/home-page";
import { getAppConfig } from "@/lib/get-app-config";

type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata(props: PageProps) {
  const config = await getAppConfig();
  const factory = config.db
    ? createDbHomePageGenerateMetadata
    : createHomePageGenerateMetadata;
  return factory(config)(props);
}

export default async function Page(props: PageProps) {
  const config = await getAppConfig();
  const factory = config.db ? createDbHomePage : createHomePage;
  return factory(config)(props);
}
