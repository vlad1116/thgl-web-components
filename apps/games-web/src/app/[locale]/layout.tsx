import "@/styles/globals.css";
import "@repo/ui/styles/globals.css";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  createRootLayout,
  createRootLayoutMetadata,
  rootLayoutViewport,
} from "@repo/ui/apps";
import { createDbRootLayout } from "@/lib/db/root-layout";
import { getAppConfig } from "@/lib/get-app-config";

export const viewport = rootLayoutViewport;

export async function generateMetadata(): Promise<Metadata> {
  const config = await getAppConfig();
  if (config.name === "thgl-app") return {};
  return createRootLayoutMetadata(config);
}

export default async function Layout(
  props: Parameters<ReturnType<typeof createRootLayout>>[0],
) {
  const config = await getAppConfig();
  // thgl-app has its own root layout under (app)/ — refuse to render the
  // games-web public chrome (which would try to fetch a CDN version.json
  // that doesn't exist for the app tenant). Hitting /, /maps, /guides
  // etc. on app.th.gl returns 404, matching production behaviour where
  // those URLs were never served.
  if (config.name === "thgl-app") notFound();
  const RootLayout = config.db
    ? createDbRootLayout(config)
    : createRootLayout(config);
  return RootLayout(props);
}
