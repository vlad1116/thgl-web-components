import Link from "next/link";
import type { ReactNode } from "react";
import { localizePath } from "@repo/lib";
import { excerpt } from "./html";
import type { WikiItem, WikiSection } from "./types";

/**
 * Generic wiki section grid: cards grouped by category. Each card
 * shows the title + a short content excerpt and links to the detail
 * page. Games can extend the card with a `renderItemMeta` callback
 * that returns extra badges/text (BPSR uses it for phase numbers and
 * book page counts).
 */
export function WikiSectionList({
  section,
  groups,
  locale = "en",
  /**
   * Optional per-item meta renderer. Result is placed in the card
   * footer between the excerpt and the bottom edge. Use `null` to
   * skip rendering for a given item.
   */
  renderItemMeta,
  /**
   * Optional per-item badge renderer placed next to the title (top
   * right of the card). Use for the highest-signal piece of metadata,
   * e.g. BPSR's "Phase N".
   */
  renderTitleBadge,
}: {
  section: WikiSection;
  groups: { category: { type: string; label: string }; items: WikiItem[] }[];
  locale?: string;
  renderItemMeta?: (item: WikiItem) => ReactNode;
  renderTitleBadge?: (item: WikiItem) => ReactNode;
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => {
              const titleBadge = renderTitleBadge?.(item);
              const meta = renderItemMeta?.(item);
              return (
                <Link
                  key={item.id}
                  href={localizePath(`${section.href}/${item.id}`, locale)}
                  prefetch={false}
                  className="group border border-slate-800 hover:border-amber-800/50 rounded-lg p-4 transition-colors hover:bg-slate-900/50 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium group-hover:text-amber-400 transition-colors line-clamp-2">
                      {item.props.title}
                    </h3>
                    {titleBadge}
                  </div>

                  {item.props.description ? (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {excerpt(item.props.description as string, 110)}
                    </p>
                  ) : item.props.content ? (
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {excerpt(item.props.content, 160)}
                    </p>
                  ) : null}

                  {meta && (
                    <div className="text-[11px] text-slate-500 pt-1 mt-auto">
                      {meta}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
