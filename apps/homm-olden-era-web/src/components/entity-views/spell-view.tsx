import { resolveDict } from "@/components/resolve-dict";
import { SpriteIcon } from "@/components/sprite-icon";

type SpellProps = {
  school: string;
  rank: number;
  spellType: string;
  usedOnMap: boolean;
  manaCost: number[];
};

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const SCHOOL_COLORS: Record<string, string> = {
  day: "text-yellow-400 border-yellow-800/50 bg-yellow-900/20",
  night: "text-purple-400 border-purple-800/50 bg-purple-900/20",
  primal: "text-green-400 border-green-800/50 bg-green-900/20",
  space: "text-cyan-400 border-cyan-800/50 bg-cyan-900/20",
  neutral: "text-slate-300 border-slate-600 bg-slate-800/30",
};

export function SpellView({
  name,
  desc,
  icon,
  props,
  dict,
}: {
  name: string;
  desc: string;
  icon?: IconSprite;
  props: SpellProps;
  dict: Record<string, string>;
  database: any[];
  locale?: string;
}) {
  const schoolStyle = SCHOOL_COLORS[props.school] ?? SCHOOL_COLORS.neutral;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        {icon && <SpriteIcon icon={icon} size={64} />}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-sm px-2.5 py-0.5 rounded border capitalize ${schoolStyle}`}
            >
              {resolveDict(dict, `ui.school_${props.school}`)}
            </span>
            <span className="text-sm px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {resolveDict(dict, "ui.rank")} {props.rank}
            </span>
            <span className="text-sm px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 capitalize">
              {props.spellType === "battle"
                ? resolveDict(dict, "ui.battle_magic")
                : resolveDict(dict, "ui.world_magic")}
            </span>
          </div>
        </div>
      </div>

      {desc && desc !== name && (
        <p className="text-muted-foreground italic border-l-2 border-amber-800/50 pl-3">
          {desc}
        </p>
      )}

      {/* Mana Cost per Level */}
      {props.manaCost && props.manaCost.length > 0 && (
        <div>
          <h4 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            {resolveDict(dict, "ui.mana_cost")}
          </h4>
          <div className="flex gap-1">
            {props.manaCost.map((cost, i) => (
              <div
                key={i}
                className="bg-slate-900/50 border border-slate-800 rounded px-4 py-2 text-center flex-1"
              >
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {resolveDict(dict, "ui.lv")} {i + 1}
                </div>
                <div className="text-lg font-semibold text-blue-400">
                  {cost}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
