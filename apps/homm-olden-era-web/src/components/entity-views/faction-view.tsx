import Link from "next/link";
import { localizePath } from "@repo/lib";
import { resolveDict } from "@/components/resolve-dict";
import { BonusList } from "@/components/bonus-display";
import { SpriteIcon } from "@/components/sprite-icon";
import { EntityLink, EntityLinkCard } from "@/components/cross-link";

type UltimateSkill = {
  id: string;
  classType: string;
  requiredSkills: { skill: string; level: number }[];
  bonuses: { type: string; params: (string | number)[] }[];
};

type FactionProps = {
  biome?: string;
  resourceName?: string;
  lawTiers?: { unlockAt: number; lawCount: number }[];
  ultimateSkills?: UltimateSkill[];
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
  const values: string[] = [];
  for (const bonus of bonuses) {
    for (const p of bonus.params) {
      const num = parseFloat(String(p));
      if (!isNaN(num) && num !== 0 && String(p) !== "true" && String(p) !== "false") {
        const abs = Math.abs(num);
        if (abs > 0 && abs < 1) {
          values.push(`${(abs * 100).toFixed(0)}%`);
        } else {
          values.push(String(abs));
        }
      }
    }
    if (bonus.upgrade) {
      const inc = bonus.upgrade.increment;
      if (inc !== 0) {
        const abs = Math.abs(inc);
        if (abs > 0 && abs < 1) {
          values.push(`${(abs * 100).toFixed(0)}%`);
        } else {
          values.push(String(abs));
        }
      }
      if (bonus.upgrade.levelStep) values.push(String(bonus.upgrade.levelStep));
    }
  }
  let result = text;
  for (let i = 0; i < values.length; i++) {
    result = result.replace(`{${i}}`, values[i]);
  }
  // Strip any remaining unresolved placeholders
  result = result.replace(/\{(\d+)\}/g, "");
  return result;
}

export function FactionView({
  name,
  desc,
  icon,
  props,
  dict,
  database,
  locale = "en",
  entryId,
  isFactionLaw = false,
}: {
  name: string;
  desc: string;
  icon?: IconSprite;
  props: FactionProps;
  dict: Record<string, string>;
  database: any[];
  locale?: string;
  entryId?: string;
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
            <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
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
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
              {resolveDict(dict, "ui.effects")}
            </h2>
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4">
              <BonusList bonuses={props.bonuses} dict={dict} locale={locale} />
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
            <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
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
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
              {resolveDict(dict, "ui.effects")}
            </h2>
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4">
              <BonusList bonuses={props.bonuses} dict={dict} locale={locale} />
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
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
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
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            {resolveDict(dict, "ui.faction_law_tiers")}
          </h2>
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

      {/* Ultimate Class Skills */}
      {props.ultimateSkills && props.ultimateSkills.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            Ultimate Skills
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {props.ultimateSkills.map((ult) => {
              const ultName = resolveDict(dict, ult.id);
              const ultDesc = resolveDict(dict, `${ult.id}_desc`);
              const hasDesc = ultDesc && ultDesc !== `${ult.id}_desc`;
              return (
                <div key={ult.id} className="border border-slate-800/60 rounded-lg bg-slate-900/20 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{ultName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${ult.classType === "might" ? "text-red-400 border-red-800/50 bg-red-900/20" : "text-indigo-400 border-indigo-800/50 bg-indigo-900/20"}`}>
                      {ult.classType === "might" ? resolveDict(dict, "ui.might") : resolveDict(dict, "ui.magic_class")}
                    </span>
                  </div>
                  {hasDesc && (
                    <p className="text-xs text-muted-foreground">
                      {substituteTemplate(ultDesc, ult.bonuses)}
                    </p>
                  )}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs text-muted-foreground shrink-0">Requires:</span>
                    {ult.requiredSkills.map((req, ri) => (
                      <span key={ri} className="inline-flex items-center">
                        {ri > 0 && <span className="text-slate-600 mx-0.5">·</span>}
                        <EntityLink
                          itemId={req.skill}
                          database={database}
                          dict={dict}
                          locale={locale}
                          showIcon={false}
                          className="text-xs"
                        />
                      </span>
                    ))}
                    <span className="text-xs text-muted-foreground">(all at Lv.{ult.requiredSkills[0]?.level})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Faction Laws */}
      {(() => {
        const laws = database
          .filter((cat: any) => cat.type === "faction_laws")
          .flatMap((cat: any) => cat.items)
          .filter((item: any) => item.groupId === entryId);
        if (laws.length === 0) return null;
        return (
          <div>
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
              {resolveDict(dict, "faction_laws")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {laws.map((law: any) => (
                <EntityLinkCard
                  key={law.id}
                  itemId={law.id}
                  database={database}
                  locale={locale}
                  dict={dict}
                />
              ))}
            </div>
          </div>
        );
      })()}

      {/* Specializations */}
      {(() => {
        const specs = database
          .filter((cat: any) => cat.type === "specializations")
          .flatMap((cat: any) => cat.items)
          .filter((item: any) => item.groupId === entryId);
        if (specs.length === 0) return null;
        return (
          <div>
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
              {resolveDict(dict, "specializations")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {specs.map((spec: any) => (
                <EntityLinkCard
                  key={spec.id}
                  itemId={spec.id}
                  database={database}
                  locale={locale}
                  dict={dict}
                />
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
