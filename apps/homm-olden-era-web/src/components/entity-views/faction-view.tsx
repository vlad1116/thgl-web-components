import { resolveDict } from "@/components/resolve-dict";
import { BonusList } from "@/components/bonus-display";
import { SpriteIcon } from "@/components/sprite-icon";

type FactionProps = {
  biome: string;
  resourceName: string;
  lawTiers?: { unlockAt: number; lawCount: number }[];
  faction?: string;
  bonuses?: {
    type: string;
    params: (string | number)[];
    activationLevel?: number;
  }[];
};

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export function FactionView({
  name,
  desc,
  icon,
  props,
  dict,
  isFactionLaw = false,
}: {
  name: string;
  desc: string;
  icon?: IconSprite;
  props: FactionProps;
  dict: Record<string, string>;
  database: any[];
  locale?: string;
  isFactionLaw?: boolean;
}) {
  if (isFactionLaw) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          {icon && <SpriteIcon icon={icon} size={64} />}
          <div>
            <h3 className="text-3xl font-bold tracking-tight">{name}</h3>
            {props.faction && (
              <span className="text-xs text-muted-foreground capitalize">
                {resolveDict(dict, `faction_${props.faction}`)}
              </span>
            )}
          </div>
        </div>

        {desc && desc !== name && (
          <p className="text-sm text-muted-foreground italic border-l-2 border-amber-800/50 pl-3">
            {desc}
          </p>
        )}

        {props.bonuses && props.bonuses.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Effects
            </h4>
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4">
              <BonusList bonuses={props.bonuses} dict={dict} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        {icon && <SpriteIcon icon={icon} size={64} />}
        <div>
          <h3 className="text-3xl font-bold tracking-tight">{name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 capitalize">
              {props.biome}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              Resource: {props.resourceName}
            </span>
          </div>
        </div>
      </div>

      {desc && desc !== name && (
        <p className="text-sm text-muted-foreground italic border-l-2 border-amber-800/50 pl-3">
          {desc}
        </p>
      )}

      {/* Law Tiers */}
      {props.lawTiers && props.lawTiers.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Faction Law Tiers
          </h4>
          <div className="grid grid-cols-5 gap-1">
            {props.lawTiers.map((tier, i) => (
              <div
                key={i}
                className="bg-slate-900/50 border border-slate-800 rounded px-3 py-2 text-center"
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {tier.unlockAt === 0 ? "Start" : `${tier.unlockAt} pts`}
                </div>
                <div className="text-lg font-semibold text-amber-400">
                  {tier.lawCount}
                </div>
                <div className="text-[10px] text-muted-foreground">laws</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
