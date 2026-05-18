import Link from "next/link";
import { localizePath } from "@repo/lib";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import type { BpsrItem } from "./data";
import { BPSR_SECTIONS, type BpsrSection } from "./sections";

/**
 * Shared detail-page renderer used by every BPSR `/db/<section>/<id>`
 * route. Branches on section-specific metadata (entryCount/phaseOrder/
 * quality stars) but keeps the breadcrumb, title, content body, prev/
 * next nav and related-entries footer consistent.
 *
 * Each section's `[id]/page.tsx` fetches the entry + neighbors via
 * `findEntry()` and hands the result to this component.
 */
export function EntryDetail({
  section,
  item,
  neighbors,
  siblings,
  locale = "en",
}: {
  section: BpsrSection;
  item: BpsrItem;
  neighbors: { prev?: BpsrItem; next?: BpsrItem };
  siblings: BpsrItem[];
  locale?: string;
}) {
  const { props } = item;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <Breadcrumb
        crumbs={[
          { label: section.label, href: `/db/${section.segment}` },
          { label: item.category },
          { label: props.title },
        ]}
        locale={locale}
        dict={{}}
      />

      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs px-2 py-0.5 rounded border capitalize ${section.accent}`}
          >
            {item.category}
          </span>
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
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{props.title}</h1>
      </div>

      {props.description && (
        <p
          className="text-muted-foreground italic border-l-2 border-amber-800/50 pl-3"
          dangerouslySetInnerHTML={{ __html: props.description }}
        />
      )}

      <div
        className="prose prose-invert max-w-none text-muted-foreground whitespace-break-spaces leading-relaxed"
        dangerouslySetInnerHTML={{ __html: props.content }}
      />

      {(neighbors.prev || neighbors.next) && (
        <nav className="flex items-stretch justify-between gap-2 pt-6 border-t border-slate-800">
          {neighbors.prev ? (
            <Link
              href={localizePath(
                `/db/${section.segment}/${neighbors.prev.id}`,
                locale,
              )}
              className="flex-1 group border border-slate-800 hover:border-amber-800/50 rounded-lg px-4 py-3 transition-colors"
              prefetch={false}
            >
              <div className="text-xs text-muted-foreground">← Previous</div>
              <div className="text-sm font-medium mt-1 group-hover:text-amber-400 transition-colors line-clamp-2">
                {neighbors.prev.props.title}
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {neighbors.next ? (
            <Link
              href={localizePath(
                `/db/${section.segment}/${neighbors.next.id}`,
                locale,
              )}
              className="flex-1 text-right group border border-slate-800 hover:border-amber-800/50 rounded-lg px-4 py-3 transition-colors"
              prefetch={false}
            >
              <div className="text-xs text-muted-foreground">Next →</div>
              <div className="text-sm font-medium mt-1 group-hover:text-amber-400 transition-colors line-clamp-2">
                {neighbors.next.props.title}
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </nav>
      )}

      {siblings.length > 0 && (
        <section className="pt-4">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            More in {item.category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {siblings.map((s) => (
              <Link
                key={s.id}
                href={localizePath(`/db/${section.segment}/${s.id}`, locale)}
                prefetch={false}
                className="group border border-slate-800 hover:border-amber-800/50 rounded-lg px-3 py-2 transition-colors"
              >
                <div className="text-sm font-medium group-hover:text-amber-400 transition-colors line-clamp-1">
                  {s.props.title}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
