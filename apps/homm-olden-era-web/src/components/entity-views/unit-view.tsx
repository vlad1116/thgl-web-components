import { localizePath } from "@repo/lib";
import Link from "next/link";
import { resolveDict } from "@/components/resolve-dict";
import { SpriteIcon } from "@/components/sprite-icon";
import {
  EntityLink,
  EntityLinkCard,
  RelatedSection,
  findItem,
  getHref,
} from "@/components/cross-link";

type UnitProps = {
  faction: string;
  tier: number;
  upgradeLevel: string;
  baseId: string;
  squadValue: number;
  hp: number;
  offence: number;
  defence: number;
  damageMin: number;
  damageMax: number;
  initiative: number;
  speed: number;
  cost: string;
  abilities: string[];
  passives: string[];
  altAttacks: string[];
  baseClass: string;
};

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};


export function UnitView({
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
  props: UnitProps;
  dict: Record<string, string>;
  database: any[];
  locale?: string;
}) {
  const upgLabel =
    props.upgradeLevel === "upgrade"
      ? resolveDict(dict, "ui.upgrade_label")
      : props.upgradeLevel === "alt_upgrade"
        ? resolveDict(dict, "ui.alt_upgrade")
        : resolveDict(dict, "ui.base");

  // Find upgrade chain: base, _upg, _upg_alt
  const baseId = props.baseId;
  const upgradeChain = [baseId, `${baseId}_upg`, `${baseId}_upg_alt`]
    .map((uid) => findItem(database, uid))
    .filter(Boolean);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        {icon && <SpriteIcon icon={icon} size={64} />}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm px-2.5 py-0.5 rounded bg-amber-900/40 text-amber-400 border border-amber-800/50">
              {resolveDict(dict, "ui.tier")} {props.tier}
            </span>
            <span className="text-sm px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {upgLabel}
            </span>
            <Link
              href={localizePath(`/db/factions/${props.faction}`, locale)}
              className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              {resolveDict(dict, `faction_${props.faction}`)}
            </Link>
          </div>
        </div>
      </div>

      {desc && desc !== name && (
        <p className="text-muted-foreground italic border-l-2 border-amber-800/50 pl-3">
          {desc}
        </p>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-1">
        <StatCell label={resolveDict(dict, "ui.hp")} value={props.hp} color="text-green-400" />
        <StatCell label={resolveDict(dict, "ui.atk")} value={props.offence} color="text-red-400" />
        <StatCell label={resolveDict(dict, "ui.def")} value={props.defence} color="text-blue-400" />
        <StatCell
          label={resolveDict(dict, "ui.dmg")}
          value={`${props.damageMin}–${props.damageMax}`}
          color="text-orange-400"
        />
        <StatCell label={resolveDict(dict, "ui.init")} value={props.initiative} color="text-purple-400" />
        <StatCell label={resolveDict(dict, "ui.speed")} value={props.speed} color="text-cyan-400" />
        <StatCell label={resolveDict(dict, "ui.value")} value={props.squadValue} color="text-yellow-400" />
        <StatCell label={resolveDict(dict, "ui.cost")} value={props.cost} small color="text-amber-300" />
      </div>

      {/* Class */}
      {props.baseClass && (
        <div>
          <h4 className="text-sm uppercase tracking-wider text-muted-foreground mb-1">
            {resolveDict(dict, "ui.class")}
          </h4>
          <p className="text-sm">{resolveDict(dict, props.baseClass)}</p>
          {dict[`${props.baseClass}_description`] && (
            <p className="text-sm text-muted-foreground mt-1">
              {resolveDict(dict, `${props.baseClass}_description`)}
            </p>
          )}
        </div>
      )}

      {/* Abilities */}
      {props.abilities?.length > 0 && (
        <div>
          <h4 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            {resolveDict(dict, "ui.abilities")}
          </h4>
          <div className="space-y-2">
            {props.abilities.map((a) => (
              <AbilityRow key={a} sid={a} dict={dict} />
            ))}
          </div>
        </div>
      )}

      {/* Passives */}
      {props.passives?.length > 0 && (
        <div>
          <h4 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            {resolveDict(dict, "ui.passives")}
          </h4>
          <div className="space-y-2">
            {props.passives.map((p) => (
              <AbilityRow key={p} sid={p} dict={dict} passive />
            ))}
          </div>
        </div>
      )}

      {/* Alt Attacks */}
      {props.altAttacks?.length > 0 && (
        <div>
          <h4 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            {resolveDict(dict, "ui.alt_attacks")}
          </h4>
          <div className="space-y-2">
            {props.altAttacks.map((a) => (
              <AbilityRow key={a} sid={a} dict={dict} />
            ))}
          </div>
        </div>
      )}

      {/* Upgrade Chain */}
      {upgradeChain.length > 1 && (
        <RelatedSection title={resolveDict(dict, "ui.upgrade_path")}>
          <div className="flex gap-2 flex-wrap">
            {upgradeChain.map((entry) => {
              if (!entry) return null;
              return (
                <EntityLinkCard
                  key={entry.item.id}
                  itemId={entry.item.id}
                  database={database}
                  locale={locale}
                  dict={dict}
                  subtitle={
                    entry.item.id === baseId
                      ? resolveDict(dict, "ui.base")
                      : entry.item.id.endsWith("_upg_alt")
                        ? resolveDict(dict, "ui.alt_upgrade")
                        : resolveDict(dict, "ui.upgrade_label")
                  }
                />
              );
            })}
          </div>
        </RelatedSection>
      )}
    </div>
  );
}

function StatCell({
  label,
  value,
  color = "text-foreground",
  small = false,
}: {
  label: string;
  value: string | number;
  color?: string;
  small?: boolean;
}) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded px-3 py-2 text-center">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`${small ? "text-xs" : "text-lg"} font-semibold ${color} mt-0.5`}>
        {value}
      </div>
    </div>
  );
}

function AbilityRow({
  sid,
  dict,
  passive = false,
}: {
  sid: string;
  dict: Record<string, string>;
  passive?: boolean;
}) {
  const name = resolveDict(dict, sid);
  const descKey = sid.replace(/_name$/, "_description");
  const desc = dict[descKey] ? resolveDict(dict, descKey) : undefined;

  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={passive ? "text-blue-400" : "text-amber-400"}>
          {passive ? "◇" : "◆"}
        </span>
        <span className="font-medium">{name}</span>
      </div>
      {desc && (
        <p className="text-sm text-muted-foreground mt-1 ml-5">{desc}</p>
      )}
    </div>
  );
}
