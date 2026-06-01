import { useUserStore } from "../(providers)";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@repo/lib";
import { useCoordinates, useT } from "../(providers)";
import { useEffect } from "react";

export function GlobalFilters() {
  const t = useT();
  const { globalFilters, isHydrated } = useCoordinates();
  const myGlobalFilters = useUserStore((state) => state.globalFilters);
  const setGlobalFilters = useUserStore((state) => state.setGlobalFilters);
  const toggleGlobalFilter = useUserStore((state) => state.toggleGlobalFilter);

  if (globalFilters.length === 0) {
    return null;
  }

  useEffect(() => {
    if (isHydrated && myGlobalFilters.length === 0) {
      const defaultGlobalFilters = globalFilters.flatMap((filter) =>
        filter.values.flatMap((value) => (value.defaultOn ? value.id : [])),
      );
      setGlobalFilters(defaultGlobalFilters);
    }
  }, [isHydrated]);

  return (
    <div className="flex items-center px-1.5 py-0.5 gap-0.5 flex-wrap">
      {globalFilters.map((globalFilter) => {
        const activeCount = globalFilter.values.filter((v) =>
          myGlobalFilters.includes(v.id),
        ).length;
        return (
          <Popover key={globalFilter.group}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex items-center text-[10px] px-1.5 py-1 transition-colors uppercase tracking-wide",
                  activeCount > 0
                    ? "text-muted-foreground hover:text-primary"
                    : "text-muted-foreground/50 hover:text-primary",
                )}
                type="button"
              >
                {t(globalFilter.group)}
                <span className="ml-1 tabular-nums text-muted-foreground">
                  {activeCount}/{globalFilter.values.length}
                </span>
                <ChevronDown className="ml-0.5 h-2.5 w-2.5 shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-fit p-0 flex flex-col text-sm">
              {globalFilter.values.map((filter) => (
                <button
                  key={filter.id}
                  className={cn(
                    "grow flex gap-2 items-center transition-colors hover:text-primary p-2 truncate",
                    {
                      "text-muted-foreground": !myGlobalFilters.includes(
                        filter.id,
                      ),
                    },
                  )}
                  onClick={() => {
                    toggleGlobalFilter(filter.id);
                  }}
                  type="button"
                >
                  {t(filter.id)}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}
