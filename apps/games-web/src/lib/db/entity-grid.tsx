import Link from "next/link";
import { localizePath } from "@repo/lib";
import { resolveDict, resolveDictWithFallback } from "./resolve-dict";
import { SpriteIcon } from "./sprite-icon";
import { EntityTooltip } from "./entity-tooltip";

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
  nameLabelPrefix,
  linkGroups = false,
  groupSection,
  iconsHash,
  appName,
}: {
  entries: DatabaseEntry[];
  section: string;
  dict: Record<string, string>;
  locale?: string;
  groupLabelPrefix?: string;
  nameLabelPrefix?: string;
  linkGroups?: boolean;
  /** Section path used when linkGroups is true (defaults to `section`). */
  groupSection?: string;
  iconsHash?: string;
  /** Game name (AppConfig.name) — forwarded to SpriteIcon for icon URL building. */
  appName: string;
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

  const hideGroupHeader = groups.size <= 1;

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([groupId, items]) => {
        const groupLabel = groupLabelPrefix
          ? resolveDictWithFallback(dict, `${groupLabelPrefix}${groupId}`, groupId)
          : resolveDictWithFallback(dict, groupId, groupId);
        const groupHref = linkGroups ? localizePath(`/db/${groupSection ?? section}/${groupId}`, locale) : undefined;

        return (
          <div key={groupId}>
            {!hideGroupHeader && (
              <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3 border-b border-slate-800 pb-1">
                {groupHref ? (
                  <Link href={groupHref} prefetch={false} className="hover:text-amber-400 transition-colors">
                    {groupLabel}
                    <span className="ml-2 text-slate-500">{items.length}</span>
                  </Link>
                ) : (
                  <>
                    {groupLabel}
                    <span className="ml-2 text-slate-500">{items.length}</span>
                  </>
                )}
              </h2>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-1">
              {items.map((item) => {
                const name = nameLabelPrefix
                  ? resolveDictWithFallback(dict, `${nameLabelPrefix}${item.id}`, item.id)
                  : resolveDict(dict, item.id);
                const icon =
                  item.icon && typeof item.icon === "object"
                    ? (item.icon as IconSprite)
                    : undefined;

                return (
                  <EntityTooltip key={item.id} entityId={item.id} locale={locale}>
                    <Link
                      href={localizePath(`/db/${section}/${item.id}`, locale)}
                      prefetch={false}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded hover:bg-zinc-800/50 transition-colors group w-full"
                    >
                      {icon && <SpriteIcon icon={icon} appName={appName} size={28} iconsHash={iconsHash} />}
                      <span className="truncate group-hover:text-amber-400 transition-colors">
                        {name}
                      </span>
                    </Link>
                  </EntityTooltip>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
