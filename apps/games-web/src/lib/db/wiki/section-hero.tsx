import { HeroSearch } from "@/lib/db/hero-search";
import type { WikiSection } from "./types";

/**
 * Hero strip shown above the grouped grid on every wiki listing page.
 * Lifts repetitive markup out of per-section page components so adding
 * a new wiki section is just data + a list view.
 */
export function WikiSectionHero({
  section,
  totalCount,
  totalCategories,
  searchPlaceholder,
}: {
  section: WikiSection;
  totalCount: number;
  totalCategories: number;
  /** Override the hero-search button placeholder (defaults to "Search <label>..."). */
  searchPlaceholder?: string;
}) {
  return (
    <section className="space-y-6 text-center">
      <div className="space-y-2">
        <div className="text-4xl">{section.icon}</div>
        <h1 className="text-3xl font-bold tracking-tight">{section.label}</h1>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          {section.tagline}
        </p>
      </div>

      <div className="flex items-center justify-center gap-6 text-muted-foreground flex-wrap">
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground tabular-nums">
            {totalCount.toLocaleString()}
          </div>
          <div className="text-xs uppercase tracking-wider">Entries</div>
        </div>
        <div className="h-8 w-px bg-muted" />
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground tabular-nums">
            {totalCategories}
          </div>
          <div className="text-xs uppercase tracking-wider">Categories</div>
        </div>
      </div>

      <HeroSearch
        placeholder={
          searchPlaceholder ?? `Search ${section.label.toLowerCase()}...`
        }
      />
    </section>
  );
}
