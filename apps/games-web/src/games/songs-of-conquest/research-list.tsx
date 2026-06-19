import Link from "next/link";
import { localizePath } from "@repo/lib";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import { EntityTooltip } from "@/lib/db/entity-tooltip";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};
type Chip = { iconId?: string; label: string; title?: string };
/** A plain-text run, or a unit reference the UI links + tooltips. */
type EffectPart = string | { unit: string; name: string };

export type ResearchItem = {
  iconId?: string;
  name: string;
  desc: string;
  levels: { cost: Chip[]; effect: EffectPart[] }[];
};

/**
 * Songs of Conquest building research — one row per research with its icon,
 * name, effect, and per-level cost (resource-icon chips). The research name +
 * effect + icon live on the building's research stack (the per-level entries
 * are just the cost tiers).
 */
export function ResearchList({
  research,
  icons,
  appName,
  iconsHash,
  locale = "en",
}: {
  research: ResearchItem[];
  icons?: Record<string, IconSprite>;
  appName: string;
  iconsHash?: string;
  locale?: string;
}) {
  if (!research.length) return null;
  const effectParts = (parts: EffectPart[]) =>
    parts.map((p, i) =>
      typeof p === "string" ? (
        <span key={i}>{p}</span>
      ) : (
        <EntityTooltip
          key={i}
          entityId={p.unit}
          locale={locale}
          className="inline"
        >
          <Link
            href={localizePath(`/db/unit/${p.unit}`, locale)}
            prefetch={false}
            className="text-amber-300/90 hover:text-amber-200 hover:underline"
          >
            {p.name}
          </Link>
        </EntityTooltip>
      ),
    );
  return (
    <div className="mb-6 max-w-3xl">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Research
      </div>
      <div className="space-y-1.5">
        {research.map((r, i) => {
          const ic = r.iconId ? icons?.[r.iconId] : undefined;
          return (
            <div
              key={i}
              className="flex gap-3 rounded border border-slate-800 bg-slate-900/40 p-2.5"
            >
              {ic && (
                <span className="h-fit shrink-0 rounded border border-slate-700 bg-black/30 p-1">
                  <SpriteIcon
                    icon={ic}
                    appName={appName}
                    size={32}
                    iconsHash={iconsHash}
                  />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-100">
                  {r.name}
                </div>
                {r.desc && (
                  <div className="text-xs text-muted-foreground">{r.desc}</div>
                )}
                {r.levels.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {r.levels.map((lvl, li) => (
                      <div
                        key={li}
                        className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs"
                      >
                        {r.levels.length > 1 && (
                          <span className="w-9 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            Lv {li + 1}
                          </span>
                        )}
                        {lvl.effect.length > 0 && (
                          <span className="text-slate-300">
                            {effectParts(lvl.effect)}
                          </span>
                        )}
                        {lvl.cost.length > 0 && (
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            {lvl.cost.map((c, ci) => {
                              const cic = c.iconId
                                ? icons?.[c.iconId]
                                : undefined;
                              return (
                                <span
                                  key={ci}
                                  title={c.title}
                                  className="inline-flex items-center gap-0.5"
                                >
                                  {cic && (
                                    <SpriteIcon
                                      icon={cic}
                                      appName={appName}
                                      size={13}
                                      iconsHash={iconsHash}
                                    />
                                  )}
                                  <span>{c.label}</span>
                                </span>
                              );
                            })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
