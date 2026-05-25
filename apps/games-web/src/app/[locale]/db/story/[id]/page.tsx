// Multi-tenant /db/story/[id] route. See the parent page.tsx for the
// dispatch rationale.

import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE } from "@repo/lib";
import { getAppConfig } from "@/lib/get-app-config";
import {
  bpsrStoryEntryMetadata,
  BpsrStoryEntryPage,
} from "@/games/blue-protocol-star-resonance/story-pages";
import { makeEntryPage } from "@/games/drakantos/entry-page";

type Params = Promise<{ id: string; locale?: string }>;

const drakantosStoryEntry = makeEntryPage("story", ["story", "guide"]);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const config = await getAppConfig();
  if (config.name === "blue-protocol-star-resonance") {
    const { id, locale = DEFAULT_LOCALE } = await params;
    return bpsrStoryEntryMetadata(id, locale);
  }
  if (config.name === "drakantos") {
    return drakantosStoryEntry.generateMetadata({ params });
  }
  notFound();
}

export default async function Page({ params }: { params: Params }) {
  const config = await getAppConfig();
  if (config.name === "blue-protocol-star-resonance") {
    const { id, locale = DEFAULT_LOCALE } = await params;
    return BpsrStoryEntryPage({ id, locale });
  }
  if (config.name === "drakantos") {
    return drakantosStoryEntry.Page({ params });
  }
  notFound();
}
