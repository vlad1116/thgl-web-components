import { resolveDict } from "@/components/resolve-dict";
import { BonusList } from "@/components/bonus-display";
import { SpriteIcon } from "@/components/sprite-icon";

type ItemProps = {
  slot: string;
  rarity: string;
  itemSet?: string;
  goodsValue: number;
  costBase: number;
  maxLevel: number;
  bonuses: {
    type: string;
    params: (string | number)[];
    upgrade?: { increment: number; levelStep: number };
  }[];
};

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const RARITY_COLORS: Record<string, string> = {
  common: "text-slate-300 border-slate-600 bg-slate-800/30",
  uncommon: "text-green-400 border-green-800/50 bg-green-900/20",
  rare: "text-blue-400 border-blue-800/50 bg-blue-900/20",
  epic: "text-purple-400 border-purple-800/50 bg-purple-900/20",
  legendary: "text-amber-400 border-amber-800/50 bg-amber-900/20",
};

export function ItemView({
  name,
  desc,
  icon,
  props,
  dict,
}: {
  name: string;
  desc: string;
  icon?: IconSprite;
  props: ItemProps;
  dict: Record<string, string>;
  database: any[];
  locale?: string;
}) {
  const rarityStyle = RARITY_COLORS[props.rarity] ?? RARITY_COLORS.common;
  const narrativeKey = Object.keys(dict).find(
    (k) =>
      k.endsWith("_narrative") &&
      k.startsWith(name.toLowerCase().replace(/ /g, "_")),
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        {icon && <SpriteIcon icon={icon} size={64} />}
        <div>
          <h3 className="text-3xl font-bold tracking-tight">{name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-sm px-2.5 py-0.5 rounded border capitalize ${rarityStyle}`}
            >
              {resolveDict(dict, `ui.rarity_${props.rarity}`)}
            </span>
            <span className="text-sm px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 capitalize">
              {resolveDict(dict, `ui.slot_${props.slot}`)}
            </span>
            {props.itemSet && (
              <span className="text-xs text-amber-400">
                Set: {resolveDict(dict, props.itemSet)}
              </span>
            )}
          </div>
        </div>
      </div>

      {desc && desc !== name && (
        <p className="text-muted-foreground italic border-l-2 border-amber-800/50 pl-3">
          {desc}
        </p>
      )}

      {/* Properties */}
      <div className="grid grid-cols-3 gap-1">
        <div className="bg-slate-900/50 border border-slate-800 rounded px-3 py-2 text-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Value
          </div>
          <div className="text-lg font-semibold text-amber-400">
            {props.goodsValue.toLocaleString()}
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded px-3 py-2 text-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Cost
          </div>
          <div className="text-lg font-semibold text-slate-300">
            {props.costBase}
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded px-3 py-2 text-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Max Level
          </div>
          <div className="text-lg font-semibold text-cyan-400">
            {props.maxLevel}
          </div>
        </div>
      </div>

      {/* Bonuses */}
      {props.bonuses && props.bonuses.length > 0 && (
        <div>
          <h4 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            Bonuses
          </h4>
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4">
            <BonusList bonuses={props.bonuses} dict={dict} />
          </div>
        </div>
      )}
    </div>
  );
}
