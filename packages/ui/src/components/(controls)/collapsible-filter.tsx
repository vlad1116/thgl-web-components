import { cn, FiltersConfig, getIconsUrl, useUserStore } from "@repo/lib";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { FilterSettingsPopover } from "./filter-settings-popover";
import { useT } from "../(providers)";
import { useMemo, useState } from "react";
import { FoldVertical, UnfoldVertical } from "lucide-react";

export function CollapsibleFilter({
  appName,
  filter,
  iconsPath,
}: {
  appName: string;
  filter: FiltersConfig[number];
  iconsPath?: string;
}) {
  const [open, setOpen] = useState(filter.defaultOpen ?? false);

  const t = useT();
  const filters = useUserStore((state) => state.filters);
  const setFilters = useUserStore((state) => state.setFilters);
  const toggleFilter = useUserStore((state) => state.toggleFilter);
  const activeFiltersLength = useMemo(
    () => filter.values.filter((f) => filters.includes(f.id)).length,
    [filters, filter],
  );

  const filterIds = useMemo(
    () => filter.values.map((v) => v.id),
    [filter.values],
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "group flex items-center transition-colors w-full px-1.5",
          {
            "text-muted-foreground": !activeFiltersLength,
          },
        )}
      >
        <button
          className={cn(
            "text-left transition-colors hover:text-primary p-1 truncate grow",
            {
              "text-muted-foreground": !activeFiltersLength,
            },
          )}
          onClick={() => {
            const newFilters = activeFiltersLength
              ? filters.filter(
                  (f) => !filter.values.some((value) => value.id === f),
                )
              : [
                  ...new Set([
                    ...filters,
                    ...filter.values.map((value) => value.id),
                  ]),
                ];
            setFilters(newFilters);
          }}
          title={t(filter.group)}
          type="button"
        >
          <span className="font-semibold">
            {t(filter.group) || filter.group}
          </span>
          <span className="ml-1 text-xs text-muted-foreground">
            ({activeFiltersLength}/{filter.values.length})
          </span>
        </button>
        <FilterSettingsPopover
          isGroup
          groupId={filter.group}
          filterIds={filterIds}
          filterLabel={t(filter.group) || filter.group}
        />
        <CollapsibleTrigger asChild>
          <button className="hover:text-primary p-2">
            {open ? (
              <FoldVertical className="h-4 w-4" />
            ) : (
              <UnfoldVertical className="h-4 w-4" />
            )}
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="flex flex-wrap">
        {filter.values
          .sort((a, b) => {
            if (a.sort !== undefined && b.sort !== undefined) {
              return a.sort - b.sort;
            }
            return (t(a.id) || a.id).localeCompare(t(b.id) || b.id);
          })

          .map((f) => (
            <div key={f.id} className="flex grow items-center md:basis-1/2 pr-2">
              <button
                className={cn(
                  "flex gap-2 items-center transition-colors hover:text-primary p-2 truncate",
                  {
                    "text-muted-foreground": !filters.includes(f.id),
                  },
                )}
                onClick={() => {
                  toggleFilter(f.id);
                }}
                type="button"
              >
                {typeof f.icon === "string" ? (
                  <img
                    alt=""
                    className="h-5 w-5 shrink-0"
                    height={20}
                    src={getIconsUrl(appName, f.icon, iconsPath)}
                    width={20}
                  />
                ) : (
                  <img
                    alt=""
                    className="shrink-0 object-none w-[64px] h-[64px]"
                    src={getIconsUrl(appName, f.icon.url, iconsPath)}
                    width={f.icon.width}
                    height={f.icon.height}
                    style={{
                      objectPosition: `-${f.icon.x}px -${f.icon.y}px`,
                      zoom: 0.35,
                    }}
                  />
                )}
                <span className="truncate">{t(f.id) || f.id}</span>
              </button>
              <div className="grow" />
              <FilterSettingsPopover
                filterId={f.id}
                filterLabel={t(f.id) || f.id}
                liveOnly={f.live_only}
              />
            </div>
          ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
