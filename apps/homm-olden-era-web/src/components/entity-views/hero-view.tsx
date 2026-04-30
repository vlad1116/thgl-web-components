import { localizePath } from "@repo/lib";
import Link from "next/link";
import { resolveDict } from "@/components/resolve-dict";
import { SpriteIcon } from "@/components/sprite-icon";
import {
  EntityLink,
  EntityLinkCard,
  RelatedSection,
} from "@/components/cross-link";

type HeroProps = {
  faction: string;
  classType: string;
  costGold: number;
  offence: number;
  defence: number;
  spellPower: number;
  intelligence: number;
  specialization: string;
  startingArmy?: { unit: string; min: number; max: number }[];
  startSkills?: string[];
  skillWeights?: { skill: string; weight: number; pct: number }[];
};

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};


export function HeroView({
  name,
  desc,
  icon,
  props,
  dict,
  database,
  locale = "en",
}: {
  name: string;
  desc: string;
  icon?: IconSprite;
  props: HeroProps;
  dict: Record<string, string>;
  database: any[];
  locale?: string;
}) {
  const specName = props.specialization
    ? resolveDict(dict, `${props.specialization.replace("_specialization", "")}_spec`)
    : undefined;
  const specDesc = props.specialization
    ? resolveDict(dict, `${props.specialization.replace("_specialization", "")}_spec_desc`)
    : undefined;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        {icon && <SpriteIcon icon={icon} size={64} />}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className={`text-sm px-2.5 py-0.5 rounded border ${
                props.classType === "might"
                  ? "bg-red-900/40 text-red-400 border-red-800/50"
                  : "bg-indigo-900/40 text-indigo-400 border-indigo-800/50"
              }`}
            >
              {props.classType === "might" ? resolveDict(dict, "ui.might") : resolveDict(dict, "ui.magic_class")}
            </span>
            <Link
              href={localizePath(`/db/factions/${props.faction}`, locale)}
              className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              {resolveDict(dict, `faction_${props.faction}`)}
            </Link>
            <span className="text-sm text-muted-foreground">
              {props.costGold.toLocaleString()} {resolveDict(dict, "ui.gold")}
            </span>
          </div>
        </div>
      </div>

      {desc && desc !== name && (
        <p className="text-muted-foreground italic border-l-2 border-amber-800/50 pl-3">
          {desc}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-1">
        <StatBox label={resolveDict(dict, "ui.offence")} value={props.offence} color="text-red-400" />
        <StatBox label={resolveDict(dict, "ui.def")} value={props.defence} color="text-blue-400" />
        <StatBox label={resolveDict(dict, "ui.spell_power")} value={props.spellPower} color="text-purple-400" />
        <StatBox label={resolveDict(dict, "ui.intelligence")} value={props.intelligence} color="text-cyan-400" />
      </div>

      {/* Specialization — linked to factions section */}
      {specName && specName !== props.specialization && (
        <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs uppercase tracking-wider text-amber-500 mb-1">
              {resolveDict(dict, "ui.specialization")}
            </h4>
            {props.specialization && (
              <Link
                href={localizePath(`/db/factions/${props.specialization}`, locale)}
                className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
              >
                {resolveDict(dict, "ui.view_details")}
              </Link>
            )}
          </div>
          <p className="font-medium">{specName}</p>
          {specDesc &&
            specDesc !==
              `${props.specialization.replace("_specialization", "")}_spec_desc` && (
              <p className="text-sm text-muted-foreground mt-1">{specDesc}</p>
            )}
        </div>
      )}

      {/* Starting Army — cross-linked to unit pages */}
      {props.startingArmy && props.startingArmy.length > 0 && (
        <RelatedSection title={resolveDict(dict, "ui.army")}>
          <div className="space-y-1">
            {props.startingArmy.map((entry) => (
              <div
                key={entry.unit}
                className="flex items-center justify-between bg-slate-900/30 border border-slate-800/50 rounded px-3 py-2"
              >
                <EntityLink
                  itemId={entry.unit}
                  database={database}
                  locale={locale}
                  dict={dict}
                />
                <span className="text-sm text-muted-foreground">
                  {entry.min}–{entry.max}
                </span>
              </div>
            ))}
          </div>
        </RelatedSection>
      )}

      {/* Starting Skills — cross-linked to skills pages */}
      {props.startSkills && props.startSkills.length > 0 && (
        <RelatedSection title={resolveDict(dict, "ui.skills_label")}>
          <div className="flex flex-wrap gap-2">
            {props.startSkills.map((skill) => (
              <EntityLinkCard
                key={skill}
                itemId={skill}
                database={database}
                locale={locale}
                dict={dict}
              />
            ))}
          </div>
        </RelatedSection>
      )}

      {/* Skill Offer Weights */}
      {props.skillWeights && props.skillWeights.length > 0 && (
        <RelatedSection title={resolveDict(dict, "ui.skill_weights")}>
          <div className="space-y-1">
            {props.skillWeights.map((sw) => {
              const maxWeight = props.skillWeights![0].weight;
              const barWidth = (sw.weight / maxWeight) * 100;
              return (
                <div
                  key={sw.skill}
                  className="flex items-center gap-2 text-sm"
                >
                  <div className="w-36 shrink-0">
                    <EntityLink
                      itemId={sw.skill}
                      database={database}
                      locale={locale}
                      dict={dict}
                    />
                  </div>
                  <div className="flex-1 h-5 bg-slate-900/50 rounded overflow-hidden">
                    <div
                      className="h-full bg-amber-800/40 rounded"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right tabular-nums">
                    {sw.pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </RelatedSection>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded px-3 py-2 text-center">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`text-2xl font-bold ${color} mt-0.5`}>{value}</div>
    </div>
  );
}
