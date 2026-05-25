import { SpriteIcon } from "@/lib/db/sprite-icon";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Universal detail view for a Drakantos database entry.
 *
 * Layout matches the HoMM convention: a hero card with icon + name +
 * subline (group/region/category) at the top, then a description block,
 * then a properties table for the raw captured data (cipher key, sprite
 * IDs, dimensions, tile bounds, etc.).
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
}: {
  id: string;
  name: string;
  desc?: string;
  groupLabel?: string;
  icon?: IconSprite;
  props?: Record<string, unknown>;
  iconsHash?: string;
  appName: string;
}) {
  const hasDesc = desc && desc !== `${id}_desc` && desc !== id;
  // Don't display props we already rendered above the table.
  const tableProps = Object.fromEntries(
    Object.entries(props ?? {}).filter(
      ([k]) => k !== "region" && k !== "regionId" && k !== "category" && k !== "categoryId",
    ),
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
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground font-mono">{id}</span>
            {groupLabel && (
              <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">
                {groupLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {hasDesc && (
        <div className="mb-6 text-sm leading-relaxed whitespace-pre-line max-w-3xl">
          {desc}
        </div>
      )}

      {Object.keys(tableProps).length > 0 && (
        <div className="border border-slate-800 rounded max-w-3xl">
          <div className="border-b border-slate-800 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Captured Data
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
