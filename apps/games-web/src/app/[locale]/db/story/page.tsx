// Multi-tenant /db/story route. Dispatches to the per-game implementation
// based on the resolved AppConfig. Currently hosts BPSR's story explorer
// and Drakantos's story chapters.

import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE } from "@repo/lib";
import { getAppConfig } from "@/lib/get-app-config";
import { bpsrStoryMetadata, BpsrStoryListPage } from "@/games/blue-protocol-star-resonance/story-pages";
import { makeCategoryPage } from "@/games/drakantos/category-page";

type PageProps = { params: Promise<{ locale?: string }> };

const drakantosStory = makeCategoryPage("story", ["guide"]);

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const config = await getAppConfig();
  if (config.name === "blue-protocol-star-resonance") {
    const { locale = DEFAULT_LOCALE } = await props.params;
    return bpsrStoryMetadata(locale);
  }
  if (config.name === "drakantos") {
    return drakantosStory.generateMetadata(props);
  }
  notFound();
}

export default async function Page(props: PageProps) {
  const config = await getAppConfig();
  if (config.name === "blue-protocol-star-resonance") {
    const { locale = DEFAULT_LOCALE } = await props.params;
    return BpsrStoryListPage({ locale });
  }
  if (config.name === "drakantos") {
    return drakantosStory.Page(props);
  }
  notFound();
}
