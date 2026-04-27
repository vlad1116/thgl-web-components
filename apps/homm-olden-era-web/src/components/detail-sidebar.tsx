import Link from "next/link";
import { localizePath } from "@repo/lib";
import { resolveDict, resolveDictWithFallback } from "@/components/resolve-dict";
import { SpriteIcon } from "@/components/sprite-icon";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type DatabaseItem = {
  id: string;
  icon?: IconSprite | string;
  groupId?: string;
};

type DatabaseEntry = {
  type: string;
  items: DatabaseItem[];
};

export function DetailSidebar({
  entries,
  section,
  activeId,
  dict,
  locale = "en",
  groupLabelPrefix,
}: {
  entries: DatabaseEntry[];
  section: string;
  activeId: string;
  dict: Record<string, string>;
  locale?: string;
  groupLabelPrefix?: string;
}) {
  // Group items — if multiple entry types, group by type first; within single type, group by groupId
  const hasMultipleTypes = new Set(entries.map((e) => e.type)).size > 1;
  const groups = new Map<string, DatabaseItem[]>();

  for (const entry of entries) {
    for (const item of entry.items) {
      const groupKey = hasMultipleTypes
        ? entry.type // group by entity type (factions, specializations, faction_laws)
        : (item.groupId ?? "other"); // group by groupId (faction name, school, etc.)
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey)!.push(item);
    }
  }

  return (
    <nav className="sidebar-scroll">
      {Array.from(groups.entries()).map(([groupId, items]) => {
        const groupLabel = groupLabelPrefix
          ? resolveDictWithFallback(dict, `${groupLabelPrefix}${groupId}`, groupId)
          : resolveDictWithFallback(dict, groupId, groupId);

        return (
          <div key={groupId} className="mb-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 px-1.5">
              {groupLabel}
            </div>
            {items.map((item) => {
              const name = resolveDict(dict, item.id);
              const icon =
                item.icon && typeof item.icon === "object"
                  ? (item.icon as IconSprite)
                  : undefined;
              const isActive = item.id === activeId;

              return (
                <Link
                  key={item.id}
                  href={localizePath(`/db/${section}/${item.id}`, locale)}
                  prefetch={false}
                  className={`flex items-center gap-2 px-1.5 py-1.5 rounded transition-colors ${
                    isActive
                      ? "bg-amber-900/30 text-amber-400"
                      : "text-muted-foreground hover:text-foreground hover:bg-zinc-800/50"
                  }`}
                >
                  {icon && <SpriteIcon icon={icon} size={20} />}
                  <span className="truncate text-sm">{name}</span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
