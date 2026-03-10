import { useMemo } from "react";
import { FiltersConfig } from "@repo/lib";
import { useCoordinates } from "../(providers)";
import { MyFilters } from "./my-filters";
import { CollapsibleFilter } from "./collapsible-filter";
import { CollapsibleCategory } from "./collapsible-category";
import { RegionFilters } from "./region-filters";

type FilterEntry =
  | { type: "filter"; filter: FiltersConfig[number] }
  | { type: "category"; category: string; filters: FiltersConfig };

export function MarkersFilters({
  appName,
  iconsPath,
}: {
  appName: string;
  iconsPath?: string;
}): JSX.Element {
  const { filters: filterDetails } = useCoordinates();

  const entries = useMemo(() => {
    const result: FilterEntry[] = [];
    const categoryMap = new Map<string, FiltersConfig>();
    const uncategorized: FiltersConfig = [];

    // Maintain order: use first occurrence of each category
    const categoryOrder: string[] = [];

    for (const f of filterDetails) {
      if (f.category) {
        if (!categoryMap.has(f.category)) {
          categoryMap.set(f.category, []);
          categoryOrder.push(f.category);
        }
        categoryMap.get(f.category)!.push(f);
      } else {
        uncategorized.push(f);
      }
    }

    // Build entries preserving relative order
    // Walk through original order, emit categories at their first filter's position
    const emittedCategories = new Set<string>();
    for (const f of filterDetails) {
      if (f.category) {
        if (!emittedCategories.has(f.category)) {
          emittedCategories.add(f.category);
          result.push({
            type: "category",
            category: f.category,
            filters: categoryMap.get(f.category)!,
          });
        }
      } else {
        result.push({ type: "filter", filter: f });
      }
    }

    return result;
  }, [filterDetails]);

  return (
    <>
      <MyFilters />
      <RegionFilters />
      <div className="flex flex-col w-[200px] md:w-[300px] lg:w-full">
        {entries.map((entry) =>
          entry.type === "category" ? (
            <CollapsibleCategory
              key={entry.category}
              category={entry.category}
              filters={entry.filters}
              appName={appName}
              iconsPath={iconsPath}
            />
          ) : (
            <CollapsibleFilter
              key={entry.filter.group}
              filter={entry.filter}
              appName={appName}
              iconsPath={iconsPath}
            />
          ),
        )}
      </div>
    </>
  );
}
