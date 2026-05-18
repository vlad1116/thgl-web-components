import { WikiEntryDetail, type WikiItem, type WikiSection } from "@/lib/db/wiki";
import type { OnceHumanItemProps } from "./data";

/**
 * Once-Human entry-detail wrapper. Remnants entries carry the author
 * (`title1`), location (`title2`), and date (`title3`) on top of the
 * usual title/description/content — surface those as a metadata block
 * above the body so the in-game journal voice reads correctly.
 */
export function OnceHumanEntryDetail({
  section,
  item,
  neighbors,
  siblings,
  locale = "en",
}: {
  section: WikiSection;
  item: WikiItem;
  neighbors: { prev?: WikiItem; next?: WikiItem };
  siblings: WikiItem[];
  locale?: string;
}) {
  const p = item.props as OnceHumanItemProps;
  const metaRows: Array<{ label: string; value: string }> = [];
  if (p.title1) metaRows.push({ label: "Author", value: p.title1 });
  if (p.title2) metaRows.push({ label: "Location", value: p.title2 });
  if (p.title3) metaRows.push({ label: "Date", value: p.title3 });

  return (
    <WikiEntryDetail
      section={section}
      item={item}
      neighbors={neighbors}
      siblings={siblings}
      locale={locale}
      metaRows={metaRows.length > 0 ? metaRows : undefined}
    />
  );
}
