import { cn } from "@/games/thgl-web/lib/utils";

export interface FilterTab<T extends string = string> {
  id: T;
  label: string;
}

interface FilterTabsProps<T extends string = string> {
  filters: FilterTab<T>[];
  activeFilter: T;
  onFilterChange: (filterId: T) => void;
  className?: string;
}

export function FilterTabs<T extends string = string>({
  filters,
  activeFilter,
  onFilterChange,
  className,
}: FilterTabsProps<T>) {
  return (
    <div className={cn("flex flex-wrap justify-center gap-2", className)}>
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition",
            activeFilter === filter.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
