import { resolveDict } from "@/components/resolve-dict";
import { BonusList } from "@/components/bonus-display";
import { SpriteIcon } from "@/components/sprite-icon";

type FactionProps = {
  biome?: string;
  resourceName?: string;
  lawTiers?: { unlockAt: number; lawCount: number }[];
  faction?: string;
  bonuses?: {
    type: string;
    params: (string | number)[];
    activationLevel?: number;
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

/**
 * Substitute {0}, {1}, {2} template placeholders with bonus param values
 */
function substituteTemplate(text: string, bonuses?: FactionProps["bonuses"]): string {
  if (!bonuses || bonuses.length === 0) return text;
  // Collect first numeric params from bonuses as template values
  const values: string[] = [];
  for (const bonus of bonuses) {
    for (const p of bonus.params) {
      const num = parseFloat(String(p));
      if (!isNaN(num)) {
        if (num > 0 && num < 1) {
          values.push(`${(num * 100).toFixed(0)}%`);
        } else {
          values.push(String(num));
        }
      }
    }
    if (bonus.upgrade) {
      const inc = bonus.upgrade.increment;
      if (inc > 0 && inc < 1) {
        values.push(`${(inc * 100).toFixed(0)}%`);
      } else {
        values.push(String(inc));
      }
      values.push(String(bonus.upgrade.levelStep));
    }
  }
  let result = text;
  for (let i = 0; i < values.length; i++) {
    result = result.replace(`{${i}}`, values[i]);
  }
  return result;
}

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
  const isFaction = !!props.biome;
  const isSpecialization = !isFaction && !isFactionLaw;
  const resolvedDesc = desc !== name ? substituteTemplate(desc, props.bonuses) : "";

  // Specialization view
  if (isSpecialization) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          {icon && <SpriteIcon icon={icon} size={64} />}
          <div>
            <h3 className="text-3xl font-bold tracking-tight">{name}</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-900/30 text-cyan-400 border border-cyan-800/50">
              {resolveDict(dict, "ui.specialization")}
            </span>
          </div>
        </div>

        {resolvedDesc && (
          <p className="text-muted-foreground italic border-l-2 border-amber-800/50 pl-3">
            {resolvedDesc}
          </p>
        )}

        {props.bonuses && props.bonuses.length > 0 && (
          <div>
            <h4 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
              {resolveDict(dict, "ui.effects")}
            </h4>
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4">
              <BonusList bonuses={props.bonuses} dict={dict} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Faction Law view
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

        {resolvedDesc && (
          <p className="text-muted-foreground italic border-l-2 border-amber-800/50 pl-3">
            {resolvedDesc}
          </p>
        )}

        {props.bonuses && props.bonuses.length > 0 && (
          <div>
            <h4 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
              {resolveDict(dict, "ui.effects")}
            </h4>
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4">
              <BonusList bonuses={props.bonuses} dict={dict} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Faction view
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        {icon && <SpriteIcon icon={icon} size={64} />}
        <div>
          <h3 className="text-3xl font-bold tracking-tight">{name}</h3>
          <div className="flex items-center gap-2 mt-1">
            {props.biome && (
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 capitalize">
                {props.biome}
              </span>
            )}
            {props.resourceName && (
              <span className="text-xs text-muted-foreground capitalize">
                {resolveDict(dict, "ui.resource_prefix")} {props.resourceName}
              </span>
            )}
          </div>
        </div>
      </div>

      {resolvedDesc && (
        <p className="text-muted-foreground italic border-l-2 border-amber-800/50 pl-3">
          {resolvedDesc}
        </p>
      )}

      {props.lawTiers && props.lawTiers.length > 0 && (
        <div>
          <h4 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            {resolveDict(dict, "ui.faction_law_tiers")}
          </h4>
          <div className="grid grid-cols-5 gap-1">
            {props.lawTiers.map((tier, i) => (
              <div
                key={i}
                className="bg-slate-900/50 border border-slate-800 rounded px-3 py-2 text-center"
              >
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {tier.unlockAt === 0 ? resolveDict(dict, "ui.start") : `${tier.unlockAt} ${resolveDict(dict, "ui.pts")}`}
                </div>
                <div className="text-lg font-semibold text-amber-400">
                  {tier.lawCount}
                </div>
                <div className="text-[10px] text-muted-foreground">{resolveDict(dict, "ui.laws")}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
