import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE } from "@repo/lib";
import { JSONLDScript } from "@repo/ui/apps";
import { requireApp } from "@/lib/get-app-config";
import { entityPageJsonLd } from "@/lib/db/json-ld";
import { findEntry } from "@/games/blue-protocol-star-resonance/data";
import { BPSR_SECTIONS } from "@/games/blue-protocol-star-resonance/sections";
import { EntryDetail } from "@/games/blue-protocol-star-resonance/entry-detail";
import { entryMetadata } from "@/games/blue-protocol-star-resonance/metadata";
import { excerpt } from "@/games/blue-protocol-star-resonance/html";
import { blueProtocolStarResonance } from "@/configs/blue-protocol-star-resonance";

type Params = Promise<{ id: string; locale?: string }>;

const SECTION = BPSR_SECTIONS.story;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  await requireApp("blue-protocol-star-resonance");
  const { id, locale = DEFAULT_LOCALE } = await params;
  const found = await findEntry(SECTION, id, locale);
  if (!found) return {};
  const summary = excerpt(found.item.props.content ?? "", 160);
  return entryMetadata(SECTION, id, found.item.props.title, summary, locale);
}

export default async function Page({ params }: { params: Params }) {
  await requireApp("blue-protocol-star-resonance");
  const { id, locale = DEFAULT_LOCALE } = await params;
  const found = await findEntry(SECTION, id, locale);
  if (!found) notFound();

  const summary = excerpt(found.item.props.content ?? "", 200);

  return (
    <>
      <JSONLDScript
        json={entityPageJsonLd({
          appConfig: blueProtocolStarResonance,
          section: SECTION.segment,
          sectionLabel: SECTION.label,
          entityId: id,
          entityName: found.item.props.title,
          description: summary,
          locale,
        })}
      />
      <EntryDetail
        section={SECTION}
        item={found.item}
        neighbors={found.neighbors}
        siblings={found.siblings}
        locale={locale}
      />
    </>
  );
}
