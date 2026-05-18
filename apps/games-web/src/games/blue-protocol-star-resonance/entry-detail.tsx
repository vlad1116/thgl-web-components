import { WikiEntryDetail, type WikiItem, type WikiSection } from "@/lib/db/wiki";
import type { BpsrItemProps } from "./data";

/**
 * BPSR entry-detail wrapper. Delegates to the generic WikiEntryDetail
 * and injects BPSR-specific header badges (book page count, story
 * phase number).
 */
export function EntryDetail({
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
  return (
    <WikiEntryDetail
      section={section}
      item={item}
      neighbors={neighbors}
      siblings={siblings}
      locale={locale}
      renderHeaderMeta={(it) => {
        const props = it.props as BpsrItemProps;
        return (
          <>
            {typeof props.entryCount === "number" && props.entryCount > 1 && (
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {props.entryCount} pages
              </span>
            )}
            {typeof props.phaseOrder === "number" && (
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Phase {props.phaseOrder}
              </span>
            )}
          </>
        );
      }}
    />
  );
}
