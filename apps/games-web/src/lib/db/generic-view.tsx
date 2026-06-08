import Link from "next/link";
import { localizePath } from "@repo/lib";
import { SpriteIcon } from "@/lib/db/sprite-icon";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** One map location an item is found at (e.g. a chest), produced by data-forge. */
type ItemLocation = {
  map: string;
  type: string;
  node: string; // deep-link node id "type@Y:X"
  x: number;
  y: number;
  label: string;
};
type LocationsProp = { total: number; list: ItemLocation[] };

function isLocationsProp(v: unknown): v is LocationsProp {
  return (
    typeof v === "object" &&
    v !== null &&
    Array.isArray((v as LocationsProp).list)
  );
}

/** A cross-link to another DB entry (item↔trader), produced by data-forge. */
type DbRef = { id: string; section: string; name: string; count?: number };

function isDbRefArray(v: unknown): v is DbRef[] {
  return (
    Array.isArray(v) &&
    v.every(
      (r) =>
        typeof r === "object" &&
        r !== null &&
        typeof (r as DbRef).id === "string" &&
        typeof (r as DbRef).section === "string",
    )
  );
}
function asDbRefList(v: unknown): DbRef[] | undefined {
  if (isDbRefArray(v)) return v;
  if (
    typeof v === "object" &&
    v !== null &&
    isDbRefArray((v as { list?: unknown }).list)
  ) {
    return (v as { list: DbRef[] }).list;
  }
  return undefined;
}

// A "stat" is a short scalar prop (number / boolean / short string) worth
// surfacing as a prominent card (e.g. Damage, Value, Stack Size). Longer or
// structured values (cipher keys, sprite arrays, tile bounds) stay in the
// raw details table.
function isStatValue(v: unknown): v is string | number | boolean {
  if (typeof v === "number" || typeof v === "boolean") return true;
  return typeof v === "string" && v.length > 0 && v.length <= 24;
}

/** A rarity/value-tier pill ({label, color}), produced by data-forge. */
type Rarity = { label: string; color: string };
function isRarity(v: unknown): v is Rarity {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Rarity).label === "string" &&
    typeof (v as Rarity).color === "string"
  );
}

/**
 * Universal detail view for a generic database entry — used by the tenant-
 * resolved `/db/[section]/[id]` route (Gothic, etc.) and Drakantos.
 *
 * Layout: a hero card (icon + name + group), description, any data-forge
 * cross-link sections (map locations, sold-by, sells), a stat-card grid for
 * the recognised scalar fields, then a details table for everything else.
 */
export function GenericEntityView({
  id,
  name,
  desc,
  groupLabel,
  icon,
  props,
  iconsHash,
  appName,
  locale = "en",
  icons,
}: {
  id: string;
  name: string;
  desc?: string;
  groupLabel?: string;
  icon?: IconSprite;
  props?: Record<string, unknown>;
  iconsHash?: string;
  appName: string;
  locale?: string;
  /** id → sprite icon for cross-linked entities (built from the DB index). */
  icons?: Record<string, IconSprite>;
}) {
  const hasDesc = desc && desc !== `${id}_desc` && desc !== id;
  // "Found where on the map" — rendered as its own clickable section, not in
  // the table.
  const locations = isLocationsProp(props?.locations)
    ? props.locations
    : undefined;
  // Cross-links to other DB entries, rendered as their own link sections.
  const soldBy = asDbRefList(props?.soldBy);
  const sells = asDbRefList(props?.sells);
  // Rarity/value-tier pill, rendered next to the name.
  const rarity = isRarity(props?.rarity) ? props.rarity : undefined;
  // Remaining props, minus everything rendered in a dedicated section above.
  const remaining = Object.entries(props ?? {}).filter(
    ([k]) =>
      k !== "region" &&
      k !== "regionId" &&
      k !== "category" &&
      k !== "categoryId" &&
      k !== "locations" &&
      k !== "soldBy" &&
      k !== "sells" &&
      k !== "rarity",
  );
  // Split into prominent stat cards vs. the raw details table.
  const statProps = remaining.filter(([, v]) => isStatValue(v));
  const tableProps = Object.fromEntries(
    remaining.filter(([, v]) => !isStatValue(v)),
  );

  const refLinks = (refs: DbRef[]) => (
    <div className="flex flex-wrap gap-2">
      {refs.map((r) => {
        const ic = icons?.[r.id];
        return (
          <Link
            key={`${r.section}/${r.id}`}
            href={localizePath(`/db/${r.section}/${r.id}`, locale)}
            prefetch={false}
            className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900/60 py-1 pr-2.5 text-xs hover:border-amber-700/70 hover:bg-slate-900 transition-colors"
            style={{ paddingLeft: ic ? 4 : 10 }}
          >
            {ic && (
              <SpriteIcon
                icon={ic}
                appName={appName}
                size={20}
                iconsHash={iconsHash}
              />
            )}
            <span className="text-slate-200">{r.name}</span>
            {typeof r.count === "number" && r.count > 1 && (
              <span className="font-mono text-muted-foreground">×{r.count}</span>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="py-4">
      <div className="flex items-start gap-5 mb-6 pb-6 border-b border-slate-800">
        {icon ? (
          <div className="shrink-0 p-3 border border-slate-700 rounded bg-slate-900/60">
            <SpriteIcon
              icon={icon}
              appName={appName}
              size={96}
              iconsHash={iconsHash}
            />
          </div>
        ) : (
          <div className="shrink-0 w-[120px] h-[120px] border border-dashed border-slate-700 rounded bg-slate-900/30 flex items-center justify-center text-slate-600 text-xs">
            no icon
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold mb-1 truncate">{name}</h1>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {rarity && (
              <span
                className="px-2 py-0.5 rounded border font-medium"
                style={{
                  color: rarity.color,
                  borderColor: `${rarity.color}66`,
                  backgroundColor: `${rarity.color}1a`,
                }}
              >
                {rarity.label}
              </span>
            )}
            {groupLabel && (
              <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">
                {groupLabel}
              </span>
            )}
            <span className="text-muted-foreground font-mono">{id}</span>
          </div>
        </div>
      </div>

      {hasDesc && (
        <div className="mb-6 text-sm leading-relaxed whitespace-pre-line max-w-3xl">
          {desc}
        </div>
      )}

      {statProps.length > 0 && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-3xl">
          {statProps.map(([k, v]) => (
            <div
              key={k}
              className="rounded border border-slate-800 bg-slate-900/40 px-3 py-2"
            >
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {k}
              </div>
              <div className="text-sm font-medium text-slate-100">
                {String(v)}
              </div>
            </div>
          ))}
        </div>
      )}

      {locations && locations.list.length > 0 && (
        <div className="mb-6 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Found in {locations.total}{" "}
            {locations.total === 1 ? "chest" : "chests"}
          </div>
          <div className="flex flex-wrap gap-2">
            {locations.list.map((loc) => (
              <Link
                key={loc.node}
                href={localizePath(
                  `/maps/${loc.map}/${loc.type}/${encodeURIComponent(
                    loc.node,
                  )}?id=${encodeURIComponent(loc.node)}`,
                  locale,
                )}
                prefetch={false}
                className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-xs hover:border-amber-700/70 hover:bg-slate-900 transition-colors"
              >
                <span
                  className={
                    loc.type === "chest_rune"
                      ? "text-fuchsia-300"
                      : "text-amber-300"
                  }
                >
                  {loc.label}
                </span>
                <span className="font-mono text-muted-foreground">
                  [{loc.x}, {loc.y}]
                </span>
              </Link>
            ))}
          </div>
          {locations.total > locations.list.length && (
            <div className="mt-2 text-xs text-muted-foreground">
              + {locations.total - locations.list.length} more
            </div>
          )}
        </div>
      )}

      {soldBy && soldBy.length > 0 && (
        <div className="mb-6 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Sold by
          </div>
          {refLinks(soldBy)}
        </div>
      )}

      {sells && sells.length > 0 && (
        <div className="mb-6 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Sells {sells.length} {sells.length === 1 ? "item" : "items"}
          </div>
          {refLinks(sells)}
        </div>
      )}

      {Object.keys(tableProps).length > 0 && (
        <div className="border border-slate-800 rounded max-w-3xl">
          <div className="border-b border-slate-800 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Details
          </div>
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(tableProps).map(([k, v]) => (
                <tr
                  key={k}
                  className="border-t border-slate-800/50 first:border-t-0"
                >
                  <td className="px-3 py-1.5 text-muted-foreground font-mono text-xs w-1/3 align-top">
                    {k}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-xs break-all">
                    {formatValue(v)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return String(v);
  if (
    typeof v === "string" ||
    typeof v === "number" ||
    typeof v === "boolean"
  ) {
    return String(v);
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    if (v.length > 20) {
      return `[${v.slice(0, 20).map(formatValue).join(", ")}, … (${v.length} total)]`;
    }
    return `[${v.map(formatValue).join(", ")}]`;
  }
  return JSON.stringify(v);
}
