import { resolveDict } from "@/components/resolve-dict";
import { BonusList } from "@/components/bonus-display";
import { SpriteIcon } from "@/components/sprite-icon";
import { EntityLinkCard } from "@/components/cross-link";

type SkillProps = {
  skillType: string;
  levels?: {
    level: number;
    iconName: string;
    subSkills: string[];
    bonuses: {
      type: string;
      params: (string | number)[];
    }[];
  }[];
  bonuses?: {
    type: string;
    params: (string | number)[];
  }[];
  classWeights?: { faction: string; classType: string; pct: number }[];
};

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export function SkillView({
  name,
  desc,
  icon,
  props,
  dict,
  database,
  locale = "en",
  isSubSkill = false,
  entryId,
}: {
  name: string;
  desc: string;
  icon?: IconSprite;
  props: SkillProps;
  dict: Record<string, string>;
  database: any[];
  locale?: string;
  isSubSkill?: boolean;
  entryId?: string;
}) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        {icon && <SpriteIcon icon={icon} size={64} />}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 capitalize">
              {isSubSkill ? resolveDict(dict, "ui.sub_skill") : props.skillType}
            </span>
          </div>
        </div>
      </div>

      {desc && desc !== name && !desc.includes("_desc") && (
        <p className="text-muted-foreground italic border-l-2 border-amber-800/50 pl-3">
          {desc.replace(/\{(\d+)\}/g, (_, idx) => {
            const numericValues: string[] = [];
            const bonusSources = props.levels?.[0]?.bonuses ?? props.bonuses ?? [];
            for (const b of bonusSources) {
              for (const p of b.params) {
                const n = parseFloat(String(p));
                if (!isNaN(n) && n !== 0 && String(p) !== "true" && String(p) !== "false") {
                  const abs = Math.abs(n);
                  numericValues.push(abs > 0 && abs < 1 ? `${Math.round(abs * 100)}` : String(abs));
                }
              }
            }
            return numericValues[parseInt(idx)] ?? "";
          })}
        </p>
      )}

      {/* Sub-skill bonuses (simple) */}
      {isSubSkill && props.bonuses && props.bonuses.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            {resolveDict(dict, "ui.effects")}
          </h2>
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4">
            <BonusList bonuses={props.bonuses} dict={dict} locale={locale} />
          </div>
        </div>
      )}

      {/* Class Weights — offer rate per faction/class */}
      {props.classWeights && props.classWeights.length > 0 && (
        <div>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            {resolveDict(dict, "ui.class_weights")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
            {props.classWeights.map((cw) => (
              <div
                key={`${cw.faction}_${cw.classType}`}
                className="flex items-center justify-between bg-slate-900/30 border border-slate-800/50 rounded px-3 py-1.5 text-sm"
              >
                <span className="text-muted-foreground">
                  {resolveDict(dict, `faction_${cw.faction}`)}{" "}
                  <span className={cw.classType === "might" ? "text-red-400" : "text-indigo-400"}>
                    {cw.classType === "might" ? resolveDict(dict, "ui.might") : resolveDict(dict, "ui.magic_class")}
                  </span>
                </span>
                <span className="font-medium tabular-nums">{cw.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill levels — compact table */}
      {props.levels && props.levels.length > 0 && (
        <div className="border border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800">
                <th className="px-4 py-2.5 text-sm font-medium text-muted-foreground w-16">{resolveDict(dict, "ui.level_header")}</th>
                <th className="px-4 py-2.5 text-sm font-medium text-muted-foreground">{resolveDict(dict, "ui.effect_header")}</th>
              </tr>
            </thead>
            <tbody>
              {props.levels.map((level) => {
                // Per-level description (e.g. skill_faction_humans_level_1_desc)
                let levelDesc: string | undefined;
                if (entryId) {
                  const key = `${entryId}_level_${level.level}_desc`;
                  const resolved = dict[key] ? resolveDict(dict, key) : undefined;
                  if (resolved && resolved !== key) {
                    // Strip unresolved {N} placeholders and HTML tags
                    levelDesc = resolved
                      .replace(/<[^>]+>/g, "")
                      .replace(/\{(\d+)\}/g, "X")
                      .trim();
                  }
                }

                // Filter out battleSubskillBonus rows whose buff key resolves to itself (no dict entry)
                const visibleBonuses = (level.bonuses ?? []).filter((b) => {
                  if (b.type !== "battleSubskillBonus") return true;
                  const buffKey = b.params[1] as string;
                  if (dict[buffKey]) return true;
                  // Try transform patterns
                  const m1 = buffKey.match(/^skill_(.+)_(\d+)_bonus$/);
                  if (m1 && dict[`sub_skill_${m1[1]}_${m1[2]}`]) return true;
                  const m2 = buffKey.match(/^skill_([^_]+)_.*_bonus_(\d+)$/);
                  if (m2 && dict[`sub_skill_${m2[1]}_${m2[2]}`]) return true;
                  // Suppress: redundant with levelDesc or unresolvable
                  return false;
                });

                return (
                  <tr
                    key={level.level}
                    className="border-b border-slate-800/50 last:border-0"
                  >
                    <td className="px-4 py-3 align-top">
                      <span className="text-sm font-semibold px-2 py-0.5 rounded bg-amber-900/40 text-amber-400 border border-amber-800/50">
                        {level.level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {levelDesc && (
                        <p className="text-sm text-muted-foreground mb-2 whitespace-pre-line">
                          {levelDesc}
                        </p>
                      )}

                      {visibleBonuses.length > 0 && (
                        <BonusList bonuses={visibleBonuses} dict={dict} locale={locale} />
                      )}

                      {level.subSkills && level.subSkills.length > 0 && (
                        <div className={(visibleBonuses.length || levelDesc) ? "mt-3 pt-3 border-t border-slate-800/50" : ""}>
                          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                            {resolveDict(dict, "ui.unlocks_sub_skills")}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {level.subSkills.map((ss) => (
                              <EntityLinkCard
                                key={ss}
                                itemId={ss}
                                database={database}
                                locale={locale}
                                dict={dict}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
