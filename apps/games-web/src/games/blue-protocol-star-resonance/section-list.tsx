import Link from "next/link";
import { localizePath } from "@repo/lib";
import type { BpsrItem } from "./data";
import type { BpsrSection } from "./sections";
import { excerpt } from "./html";

/**
 * Renders the grouped grid for a BPSR listing page. Each section opts
 * into a card flavour:
 *
 *   - dictionary    → plain card with a content excerpt
 *   - reading-books → adds quality stars + page count
 *   - story         → adds phase number badge
 *
 * Kept in a single component so the section-level wrapper layout
 * (heading sizes, spacing, group anchor links) stays consistent.
 */
export function SectionList({
  section,
  groups,
  locale = "en",
}: {
  section: BpsrSection;
  groups: { category: { type: string; label: string }; items: BpsrItem[] }[];
  locale?: string;
}) {
  return (
    <div className="space-y-10">
      {groups.map(({ category, items }) => (
        <section
          key={category.type}
          id={category.type}
          className="space-y-4 scroll-mt-20"
        >
          <header className="flex items-baseline justify-between border-b border-slate-800 pb-2">
            <h2 className="text-lg font-semibold">{category.label}</h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {items.length}
            </span>
          </header>

          <div
            className={
              section.segment === "story"
                ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            }
          >
            {items.map((item) => (
              <Link
                key={item.id}
                href={localizePath(`/db/${section.segment}/${item.id}`, locale)}
                prefetch={false}
                className="group border border-slate-800 hover:border-amber-800/50 rounded-lg p-4 transition-colors hover:bg-slate-900/50 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium group-hover:text-amber-400 transition-colors line-clamp-2">
                    {item.props.title}
                  </h3>
                  {typeof item.props.phaseOrder === "number" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/40 text-indigo-400 shrink-0 tabular-nums">
                      Phase {item.props.phaseOrder}
                    </span>
                  )}
                </div>

                {item.props.description ? (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {excerpt(item.props.description, 110)}
                  </p>
                ) : item.props.content ? (
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {excerpt(item.props.content, 160)}
                  </p>
                ) : null}

                {typeof item.props.entryCount === "number" &&
                  item.props.entryCount > 1 && (
                    <div className="text-[11px] text-slate-500 pt-1 mt-auto">
                      {item.props.entryCount} pages
                    </div>
                  )}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
