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
}: {
  name: string;
  desc: string;
  icon?: IconSprite;
  props: SkillProps;
  dict: Record<string, string>;
  database: any[];
  locale?: string;
  isSubSkill?: boolean;
}) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        {icon && <SpriteIcon icon={icon} size={64} />}
        <div>
          <h3 className="text-3xl font-bold tracking-tight">{name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 capitalize">
              {isSubSkill ? "Sub-Skill" : props.skillType}
            </span>
          </div>
        </div>
      </div>

      {desc && desc !== name && (
        <p className="text-sm text-muted-foreground italic border-l-2 border-amber-800/50 pl-3">
          {desc}
        </p>
      )}

      {/* Sub-skill bonuses (simple) */}
      {isSubSkill && props.bonuses && props.bonuses.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Effects
          </h4>
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4">
            <BonusList bonuses={props.bonuses} dict={dict} />
          </div>
        </div>
      )}

      {/* Skill levels */}
      {props.levels && props.levels.length > 0 && (
        <div className="space-y-3">
          {props.levels.map((level) => {
            const levelName = resolveDict(
              dict,
              `${name.toLowerCase().replace(/ /g, "_")}_level_${level.level}`,
            );
            return (
              <div
                key={level.level}
                className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-900/40 text-amber-400 border border-amber-800/50">
                    Level {level.level}
                  </span>
                  {levelName && levelName !== `${name.toLowerCase().replace(/ /g, "_")}_level_${level.level}` && (
                    <span className="text-sm font-medium">{levelName}</span>
                  )}
                </div>

                {level.bonuses && level.bonuses.length > 0 && (
                  <BonusList bonuses={level.bonuses} dict={dict} />
                )}

                {level.subSkills && level.subSkills.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/50">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      Unlocks Sub-Skills
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
