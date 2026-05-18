import Link from "next/link";
import type { ReactNode } from "react";
import { localizePath } from "@repo/lib";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import type { WikiItem, WikiSection } from "./types";

/**
 * Shared detail-page renderer used by wiki `/db/<section>/<id>` routes.
 * Renders breadcrumb + title + optional description + HTML content +
 * prev/next nav within category + "More in <category>" siblings list.
 *
 * Games can inject section-specific badges (BPSR phaseOrder, book page
 * count) via `renderHeaderMeta`. Additional metadata blocks below the
 * content (e.g. once-human remnants' author / location / date) can be
 * passed via `metaRows`.
 */
export function WikiEntryDetail({
  section,
  item,
  neighbors,
  siblings,
  locale = "en",
  renderHeaderMeta,
  metaRows,
}: {
  section: WikiSection;
  item: WikiItem;
  neighbors: { prev?: WikiItem; next?: WikiItem };
  siblings: WikiItem[];
  locale?: string;
  /**
   * Extra inline badges placed alongside the category pill in the
   * header. BPSR uses this for "Phase N" and "N pages" badges.
   */
  renderHeaderMeta?: (item: WikiItem) => ReactNode;
  /**
   * Definition-list style rows rendered between the description and
   * the content body. Used by once-human's remnants where the props
   * carry the author / location / date as `title1` / `title2` /
   * `title3`.
   */
  metaRows?: Array<{ label: string; value: string }>;
}) {
  const { props } = item;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <Breadcrumb
        crumbs={[
          { label: section.label, href: section.href },
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
          {renderHeaderMeta?.(item)}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{props.title}</h1>
      </div>

      {props.description && (
        <p
          className="text-muted-foreground italic border-l-2 border-amber-800/50 pl-3"
          dangerouslySetInnerHTML={{ __html: props.description as string }}
        />
      )}

      {metaRows && metaRows.length > 0 && (
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
          {metaRows.map((row) => (
            <div key={row.label} className="contents">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground self-center">
                {row.label}
              </dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
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
                `${section.href}/${neighbors.prev.id}`,
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
                `${section.href}/${neighbors.next.id}`,
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
                href={localizePath(`${section.href}/${s.id}`, locale)}
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
