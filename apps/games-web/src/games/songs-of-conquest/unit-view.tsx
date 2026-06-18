import { SpriteIcon } from "@/lib/db/sprite-icon";
import { resolveDict } from "@/lib/db/resolve-dict";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type UnitVariant = {
  key: string;
  name: string;
  /** Dict key for the variant's localized name (resolved per-locale). */
  nameKey?: string;
  iconId: string;
  stats: { label: string; value: string }[];
  /** Essence affinity, rendered with the game's colored essence icons. */
  essence?: { key: string; amount: number; iconId: string }[];
  /** Purchase cost as resource-icon chips. */
  cost?: { iconId?: string; label: string; title?: string }[];
  abilities: { label: string; value: string }[];
};

/**
 * Songs of Conquest unit detail — a single side-by-side comparison of every
 * variant (Militia → Sappers → …). Each variant is a column headed by its own
 * icon + name; stats are rows, abilities/traits a final row. Replaces the old
 * base-as-cards + upgrade-as-table mix so the whole evolution reads uniformly.
 */
export function UnitView({
  variants,
  icons,
  appName,
  iconsHash,
  dict,
  statIcons,
}: {
  variants: UnitVariant[];
  icons?: Record<string, IconSprite>;
  appName: string;
  iconsHash?: string;
  dict?: Record<string, string>;
  /** Stat-label → icon-id map (the game's UI glyphs for movement/offence/…). */
  statIcons?: Record<string, string>;
}) {
  if (!variants.length) return null;
  const nameOf = (v: UnitVariant) =>
    (v.nameKey && dict && resolveDict(dict, v.nameKey)) || v.name;
  // Essence affinity rendered as colored icons (× count) instead of "Order 1x".
  const essenceCell = (v: UnitVariant) => {
    if (!v.essence?.length)
      return <span className="text-muted-foreground">—</span>;
    return (
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {v.essence.map((e) => {
          const ic = icons?.[e.iconId];
          return (
            <span
              key={e.key}
              className="inline-flex items-center gap-0.5"
              title={e.key}
            >
              {ic ? (
                <SpriteIcon
                  icon={ic}
                  appName={appName}
                  size={16}
                  iconsHash={iconsHash}
                />
              ) : (
                <span className="capitalize">{e.key}</span>
              )}
              <span className="text-slate-300">×{e.amount}</span>
            </span>
          );
        })}
      </span>
    );
  };
  // Purchase cost rendered as resource icon + amount (e.g. 🪙 100).
  const costCell = (v: UnitVariant) => {
    if (!v.cost?.length)
      return <span className="text-muted-foreground">—</span>;
    return (
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {v.cost.map((c, i) => {
          const ic = c.iconId ? icons?.[c.iconId] : undefined;
          return (
            <span
              key={i}
              className="inline-flex items-center gap-0.5"
              title={c.title}
            >
              {ic && (
                <SpriteIcon
                  icon={ic}
                  appName={appName}
                  size={16}
                  iconsHash={iconsHash}
                />
              )}
              <span className="text-slate-100">{c.label}</span>
            </span>
          );
        })}
      </span>
    );
  };

  // Stat row order: first variant's order, then any labels only later variants have.
  const labels: string[] = [];
  const seen = new Set<string>();
  for (const v of variants)
    for (const s of v.stats)
      if (!seen.has(s.label)) {
        seen.add(s.label);
        labels.push(s.label);
      }
  const valueOf = (v: UnitVariant, label: string) =>
    v.stats.find((s) => s.label === label)?.value ?? "—";
  const anyAbilities = variants.some((v) => v.abilities.length > 0);

  return (
    <div className="mt-2 mb-6 max-w-3xl overflow-x-auto">
      <div className="overflow-hidden rounded-md border border-slate-800">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-900/60">
              <th className="w-32 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {variants.length > 1 ? "Evolution" : "Stats"}
              </th>
              {variants.map((v) => (
                <th key={v.key} className="px-3 py-2.5 text-left align-bottom">
                  <span className="flex items-center gap-2">
                    {v.iconId && icons?.[v.iconId] && (
                      <span className="shrink-0 rounded border border-slate-700 bg-black/40 p-0.5">
                        <SpriteIcon
                          icon={icons[v.iconId]}
                          appName={appName}
                          size={32}
                          iconsHash={iconsHash}
                        />
                      </span>
                    )}
                    <span className="text-sm font-bold text-amber-50">
                      {nameOf(v)}
                    </span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((label) => {
              const labelIc = statIcons?.[label]
                ? icons?.[statIcons[label]]
                : undefined;
              const isEssence = label === "Essence";
              const isCost = label === "Cost";
              return (
                <tr
                  key={label}
                  className="border-t border-slate-800/60 even:bg-slate-900/20"
                >
                  <td className="px-3 py-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      {labelIc && (
                        <SpriteIcon
                          icon={labelIc}
                          appName={appName}
                          size={15}
                          iconsHash={iconsHash}
                        />
                      )}
                      {label}
                    </span>
                  </td>
                  {variants.map((v) => (
                    <td
                      key={v.key}
                      className="px-3 py-1.5 font-medium text-slate-100"
                    >
                      {isEssence
                        ? essenceCell(v)
                        : isCost
                          ? costCell(v)
                          : valueOf(v, label)}
                    </td>
                  ))}
                </tr>
              );
            })}
            {anyAbilities && (
              <tr className="border-t border-slate-800/60 align-top">
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  Abilities
                </td>
                {variants.map((v) => (
                  <td key={v.key} className="px-3 py-2">
                    {v.abilities.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="space-y-1.5">
                        {v.abilities.map((a, i) => (
                          <div key={i} className="text-xs">
                            <span className="font-semibold text-amber-300/90">
                              {a.label}
                            </span>
                            {a.value && a.value !== a.label && (
                              <span className="text-slate-300">
                                {" "}
                                — {a.value}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
