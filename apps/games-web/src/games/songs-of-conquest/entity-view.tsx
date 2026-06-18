import Link from "next/link";
import { localizePath, type TilesConfig } from "@repo/lib";
import { GenericEntityView } from "@/lib/db/generic-view";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import { EntityTooltip } from "@/lib/db/entity-tooltip";
import { resolveDict } from "@/lib/db/resolve-dict";
import { TownPlanner } from "@/games/songs-of-conquest/town-planner";
import {
  UnitView,
  type UnitVariant,
} from "@/games/songs-of-conquest/unit-view";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** A cross-link to another SoC DB entry, produced by the data-mining transform.
 *  Carries only the target id; the display name resolves per-locale from `dict`. */
type SocLink = { section: string; id: string; name?: string; sub?: string };

/** A non-clickable icon + value pill (resource / essence costs, …). */
type SocChip = { iconId?: string; label: string; title?: string };

/** A structured extra section the generic view can't express (tables / link grids / lists). */
type SocSection =
  | { title: string; kind: "links"; links: SocLink[] }
  | { title: string; kind: "rows"; rows: { label: string; value: string }[] }
  | { title: string; kind: "list"; items: string[] }
  | { title: string; kind: "chips"; chips: SocChip[] };

/** Stat-label → in-game icon id (the data-mining `_stat_icons` stable ids).
 *  Shared by the wielder stat cards (generic view) and the unit stat table. */
export const SOC_STAT_ICONS: Record<string, string> = {
  Offense: "_ic_offence",
  Defense: "_ic_defense",
  Movement: "_ic_movement",
  "View Radius": "_ic_view",
  // Unit-table labels (British spelling + split melee/ranged).
  "Melee Offence": "_ic_offence",
  "Ranged Offence": "_ic_offence",
  Defence: "_ic_defense",
};

/**
 * Songs of Conquest detail view. Renders the shared GenericEntityView (hero +
 * stat cards + effect rows) and then any `_sections` the transform attached —
 * the tabular / cross-link content that doesn't fit the generic card model
 * (wielder skill pools, faction unit/building/wielder indexes, etc.).
 */
export function SocEntityView(props: {
  id: string;
  name: string;
  desc?: string;
  groupLabel?: string;
  icon?: IconSprite;
  props?: Record<string, unknown>;
  iconsHash?: string;
  appName: string;
  locale?: string;
  icons?: Record<string, IconSprite>;
  tiles?: TilesConfig;
  dict?: Record<string, string>;
}) {
  const { appName, iconsHash, locale = "en", icons, dict } = props;
  const linkName = (l: SocLink) =>
    (dict && resolveDict(dict, l.id)) || l.name || l.id;
  const sections = (props.props?._sections as SocSection[] | undefined) ?? [];
  const townGraph = props.props?._townGraph as
    | { buildings: Parameters<typeof TownPlanner>[0]["buildings"] }
    | undefined;
  const unit = props.props?._unit as { variants: UnitVariant[] } | undefined;

  return (
    <>
      <GenericEntityView
        {...props}
        statIcons={SOC_STAT_ICONS}
        monoDetails={false}
      />
      {unit && unit.variants.length > 0 && (
        <UnitView
          variants={unit.variants}
          icons={icons}
          appName={appName}
          iconsHash={iconsHash}
          dict={dict}
          statIcons={SOC_STAT_ICONS}
        />
      )}
      {sections.map((sec) => (
        <div key={sec.title} className="mb-6 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {sec.title}
          </div>
          {sec.kind === "links" ? (
            <div className="flex flex-wrap gap-2">
              {sec.links.map((l) => {
                const ic = icons?.[l.id];
                return (
                  <EntityTooltip
                    key={`${l.section}/${l.id}`}
                    entityId={l.id}
                    locale={locale}
                  >
                    <Link
                      href={localizePath(`/db/${l.section}/${l.id}`, locale)}
                      prefetch={false}
                      className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900/60 py-1 pr-2.5 text-xs hover:border-amber-700/70 hover:bg-slate-900 transition-colors"
                      style={{ paddingLeft: ic ? 4 : 10 }}
                    >
                      {ic && (
                        <SpriteIcon
                          icon={ic}
                          appName={appName}
                          size={20}
                          iconsHash={iconsHash}
                        />
                      )}
                      <span className="text-slate-200">{linkName(l)}</span>
                      {l.sub && (
                        <span className="font-mono text-muted-foreground">
                          {l.sub}
                        </span>
                      )}
                    </Link>
                  </EntityTooltip>
                );
              })}
            </div>
          ) : sec.kind === "list" ? (
            <ul className="space-y-1">
              {sec.items.map((it, i) => (
                <li key={i} className="flex items-start gap-1.5 text-sm">
                  <span className="text-amber-500 mt-1 shrink-0">&#x25C6;</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          ) : sec.kind === "chips" ? (
            <div className="flex flex-wrap gap-2">
              {sec.chips.map((c, i) => {
                const ic = c.iconId ? icons?.[c.iconId] : undefined;
                return (
                  <span
                    key={i}
                    title={c.title}
                    className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900/60 py-1 pr-2.5 text-sm font-medium text-slate-100"
                    style={{ paddingLeft: ic ? 4 : 10 }}
                  >
                    {ic && (
                      <SpriteIcon
                        icon={ic}
                        appName={appName}
                        size={20}
                        iconsHash={iconsHash}
                      />
                    )}
                    {c.label}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="border border-slate-800 rounded">
              <table className="w-full text-sm">
                <tbody>
                  {sec.rows.map((r) => (
                    <tr
                      key={r.label}
                      className="border-t border-slate-800/50 first:border-t-0"
                    >
                      <td className="px-3 py-1.5 text-muted-foreground text-xs w-1/3 align-top">
                        {r.label}
                      </td>
                      <td className="px-3 py-1.5 text-xs">{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
      {townGraph && townGraph.buildings.length > 0 && (
        <TownPlanner
          buildings={townGraph.buildings}
          appName={appName}
          iconsHash={iconsHash}
          icons={icons}
          factionLabel={props.name}
        />
      )}
    </>
  );
}
