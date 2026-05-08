import "@/styles/globals.css";
import "@repo/ui/styles/globals.css";

import type { Metadata } from "next";
import {
  createRootLayout,
  createRootLayoutMetadata,
  rootLayoutViewport,
} from "@repo/ui/apps";
import { getAppConfig } from "@/lib/get-app-config";

export const viewport = rootLayoutViewport;

export async function generateMetadata(): Promise<Metadata> {
  const config = await getAppConfig();
  return createRootLayoutMetadata(config);
}

export const revalidate = 60;

export default async function Layout(
  props: Parameters<ReturnType<typeof createRootLayout>>[0],
) {
  const config = await getAppConfig();
  const RootLayout = createRootLayout(config);
  return RootLayout(props);
}
