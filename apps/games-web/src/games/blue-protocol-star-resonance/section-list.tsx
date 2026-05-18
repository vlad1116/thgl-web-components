import { WikiSectionList, type WikiItem, type WikiSection } from "@/lib/db/wiki";
import type { BpsrItemProps } from "./data";

/**
 * BPSR section list wrapping the generic WikiSectionList with two
 * BPSR-specific renderers:
 *   - story phases get a "Phase N" badge next to the title
 *   - reading books get a "N pages" footer when entryCount > 1
 */
export function SectionList({
  section,
  groups,
  locale = "en",
}: {
  section: WikiSection;
  groups: { category: { type: string; label: string }; items: WikiItem[] }[];
  locale?: string;
}) {
  return (
    <WikiSectionList
      section={section}
      groups={groups}
      locale={locale}
      renderTitleBadge={(item) => {
        const props = item.props as BpsrItemProps;
        if (typeof props.phaseOrder !== "number") return null;
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/40 text-indigo-400 shrink-0 tabular-nums">
            Phase {props.phaseOrder}
          </span>
        );
      }}
      renderItemMeta={(item) => {
        const props = item.props as BpsrItemProps;
        if (typeof props.entryCount === "number" && props.entryCount > 1) {
          return `${props.entryCount} pages`;
        }
        return null;
      }}
    />
  );
}
