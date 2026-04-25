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

export function EntityGrid({
  entries,
  section,
  dict,
  locale = "en",
  groupLabelPrefix,
}: {
  entries: DatabaseEntry[];
  section: string;
  dict: Record<string, string>;
  locale?: string;
  groupLabelPrefix?: string;
}) {
  // Group items by groupId
  const groups = new Map<string, DatabaseItem[]>();
  for (const entry of entries) {
    for (const item of entry.items) {
      const group = item.groupId ?? "other";
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(item);
    }
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([groupId, items]) => {
        const groupLabel = groupLabelPrefix
          ? resolveDictWithFallback(dict, `${groupLabelPrefix}${groupId}`, groupId)
          : resolveDictWithFallback(dict, groupId, groupId);

        return (
          <div key={groupId}>
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 border-b border-slate-800 pb-1">
              {groupLabel}
              <span className="ml-2 text-slate-600">{items.length}</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
              {items.map((item) => {
                const name = resolveDict(dict, item.id);
                const icon =
                  item.icon && typeof item.icon === "object"
                    ? (item.icon as IconSprite)
                    : undefined;

                return (
                  <Link
                    key={item.id}
                    href={localizePath(`/db/${section}/${item.id}`, locale)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800/50 transition-colors group"
                  >
                    {icon && <SpriteIcon icon={icon} size={24} />}
                    <span className="text-sm truncate group-hover:text-amber-400 transition-colors">
                      {name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
