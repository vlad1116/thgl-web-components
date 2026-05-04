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
            <Link prefetch={false}
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
            <h2 className="text-xs uppercase tracking-wider text-amber-500 mb-1">
              {resolveDict(dict, "ui.specialization")}
            </h2>
            {props.specialization && (
              <Link prefetch={false}
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

      {/* Ultimate Class Skills for this hero's faction + class */}
      {(() => {
        const factionEntry = database
          .filter((cat: any) => cat.type === "factions")
          .flatMap((cat: any) => cat.items)
          .find((f: any) => f.id === props.faction);
        const ultimates = (factionEntry?.props as any)?.ultimateSkills?.filter(
          (u: any) => u.classType === props.classType,
        );
        if (!ultimates?.length) return null;
        return (
          <RelatedSection title="Ultimate Skills">
            <div className="space-y-2">
              {ultimates.map((ult: any) => {
                const ultName = resolveDict(dict, ult.id);
                let ultDesc = resolveDict(dict, `${ult.id}_desc`);
                const hasDesc = ultDesc && ultDesc !== `${ult.id}_desc`;
                // Resolve {0}, {1} from bonus params
                if (hasDesc) {
                  const vals: string[] = [];
                  for (const b of ult.bonuses ?? []) {
                    for (const p of b.params ?? []) {
                      const n = parseFloat(String(p));
                      if (!isNaN(n) && String(p) !== "true" && String(p) !== "false") {
                        vals.push(n > 0 && n < 1 ? `${Math.round(n * 100)}%` : String(n));
                      }
                    }
                  }
                  ultDesc = ultDesc.replace(/\{(\d+)\}/g, (_, idx) => vals[parseInt(idx)] ?? "X");
                }
                return (
                  <div key={ult.id} className="border border-slate-800/60 rounded-lg bg-slate-900/20 p-3 space-y-1.5">
                    <div className="font-medium">{ultName}</div>
                    {hasDesc && (
                      <p className="text-xs text-muted-foreground">{ultDesc}</p>
                    )}
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs text-muted-foreground shrink-0">Requires:</span>
                      {ult.requiredSkills.map((req: any, ri: number) => (
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
                      <span className="text-xs text-muted-foreground">(all Lv.{ult.requiredSkills[0]?.level})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </RelatedSection>
        );
      })()}
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
