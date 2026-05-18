import Link from "next/link";
import { localizePath } from "@repo/lib";
import { resolveDict } from "@/lib/db/resolve-dict";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import { EntityLink } from "@/games/homm-olden-era/cross-link";
import {
  ResourceCostList,
  buildResourceIconLookup,
} from "@/games/homm-olden-era/resource-cost";

const APP_NAME = "homm-olden-era";

type BuildingProps = {
  faction: string;
  category: string;
  sid: string;
  levels?: {
    name: string;
    desc: string;
    icon?: string;
    costs: { name: string; cost: number }[];
    prerequisites: { sid: string; level: number }[];
  }[];
  units?: {
    sids: string[];
    weeklyGrowth: number;
  }[];
};

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export function BuildingView({
  name,
  desc,
  icon,
  props,
  dict,
  database,
  locale = "en",
  iconsHash,
}: {
  name: string;
  desc: string;
  icon?: IconSprite;
  props: BuildingProps;
  dict: Record<string, string>;
  database: any[];
  locale?: string;
  entryId?: string;
  iconsHash?: string;
}) {
  const categoryLabel = resolveDict(dict, `ui.cat_${props.category}`);
  const factionLabel = resolveDict(dict, `faction_${props.faction}`);
  const resourceIcons = buildResourceIconLookup(database);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        {icon && <SpriteIcon icon={icon} appName={APP_NAME} size={64} iconsHash={iconsHash} />}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {categoryLabel}
            </span>
            <Link prefetch={false}
              href={localizePath(`/db/factions/${props.faction}`, locale)}
              className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              {factionLabel}
            </Link>
          </div>
        </div>
      </div>

      {desc && desc !== name && !desc.includes("_desc") && (
        <p className="text-muted-foreground italic border-l-2 border-amber-800/50 pl-3">
          {desc}
        </p>
      )}

      {props.units && props.units.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            {resolveDict(dict, "ui.cat_hires")}
          </h2>
          <div className="space-y-1">
            {props.units.map((u, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-slate-900/30 border border-slate-800/50 rounded px-3 py-2"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {u.sids.map((sid) => (
                    <EntityLink
                      key={sid}
                      itemId={sid}
                      database={database}
                      locale={locale}
                      dict={dict}
                      iconsHash={iconsHash}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground shrink-0 ml-2">
                  +{u.weeklyGrowth}/{resolveDict(dict, "ui.weekly_growth").toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {props.levels && props.levels.length > 0 && (
        <div className="border border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800">
                <th className="px-4 py-2.5 text-sm font-medium text-muted-foreground w-16">
                  {resolveDict(dict, "ui.level_header")}
                </th>
                <th className="px-4 py-2.5 text-sm font-medium text-muted-foreground">
                  {resolveDict(dict, "ui.building_costs")}
                </th>
                <th className="px-4 py-2.5 text-sm font-medium text-muted-foreground">
                  {resolveDict(dict, "ui.building_requires")}
                </th>
              </tr>
            </thead>
            <tbody>
              {props.levels.map((level, i) => {
                const levelName = resolveDict(dict, level.name);
                const levelDesc = resolveDict(dict, level.desc);
                const hasDesc = levelDesc && levelDesc !== level.desc;

                return (
                  <tr
                    key={i}
                    className="border-b border-slate-800/50 last:border-0"
                  >
                    <td className="px-4 py-3 align-top">
                      <div>
                        <span className="text-sm font-semibold px-2 py-0.5 rounded bg-amber-900/40 text-amber-400 border border-amber-800/50">
                          {i + 1}
                        </span>
                        {levelName !== level.name && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {levelName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <ResourceCostList
                        costs={level.costs}
                        resourceIcons={resourceIcons}
                        iconsHash={iconsHash}
                        dict={dict}
                      />
                      {hasDesc && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {levelDesc.replace(/\{(\d+)\}/g, (_, idx) => {
                            return `{${idx}}`;
                          })}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {level.prerequisites.length > 0 ? (
                        <div className="space-y-1">
                          {level.prerequisites.map((req) => {
                            const reqId = `${props.faction}_${req.sid}`;
                            const reqName = resolveDict(dict, `${reqId}_level_${req.level}`);
                            const fallbackName = resolveDict(dict, reqId);
                            const displayName = reqName !== `${reqId}_level_${req.level}` ? reqName : fallbackName;
                            return (
                              <Link
                                key={`${req.sid}_${req.level}`}
                                prefetch={false}
                                href={localizePath(`/db/buildings/${reqId}`, locale)}
                                className="block text-sm text-amber-400 hover:text-amber-300 transition-colors"
                              >
                                {displayName} Lv.{req.level}
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
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
