import { resolveDict } from "@/components/resolve-dict";
import { SpriteIcon } from "@/components/sprite-icon";
import { EntityLink } from "@/components/cross-link";

type MapObjectProps = {
  group: string;
  visitType?: string;
  guardUnits?: boolean;
  value?: number;
  resName?: string;
  resValue?: number;
  units?: { sids: string[]; weeklyGrowth: number }[];
  templateValues?: (string | number)[];
};

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

function substituteTemplateValues(text: string, values?: (string | number)[]): string {
  if (!values || values.length === 0) return text;
  let result = text;
  for (let i = 0; i < values.length; i++) {
    result = result.replaceAll(`{${i}}`, String(values[i]));
  }
  return result;
}

export function MapObjectView({
  name,
  desc,
  icon,
  props,
  dict,
  database,
  locale = "en",
  entryId,
}: {
  name: string;
  desc: string;
  icon?: IconSprite;
  props: MapObjectProps;
  dict: Record<string, string>;
  database: any[];
  locale?: string;
  entryId?: string;
}) {
  const groupLabel = resolveDict(dict, props.group);
  const rawDesc = desc && desc !== name && !desc.includes("_desc") && !desc.includes("_description")
    ? desc
    : undefined;
  const resolvedDesc = rawDesc
    ? substituteTemplateValues(rawDesc, props.templateValues)
    : undefined;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        {icon && <SpriteIcon icon={icon} size={64} />}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {groupLabel}
            </span>
            {props.visitType && (
              <span className="text-xs text-muted-foreground capitalize">
                {props.visitType.replace(/([A-Z])/g, " $1").trim()}
              </span>
            )}
            {props.guardUnits && (
              <span className="text-xs px-2 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-800/50">
                Guarded
              </span>
            )}
          </div>
        </div>
      </div>

      {resolvedDesc && (
        <p className="text-muted-foreground border-l-2 border-amber-800/50 pl-3">
          {resolvedDesc}
        </p>
      )}

      {(() => {
        if (!entryId) return null;
        const narrative = resolveDict(dict, `${entryId}_narrative`);
        if (narrative.endsWith("_narrative")) return null;
        return (
          <p className="text-sm text-muted-foreground italic">
            {narrative}
          </p>
        );
      })()}

      {/* Stats row */}
      {(props.resValue != null || props.value != null) && (
        <div className="flex gap-2 flex-wrap">
          {props.resValue != null && (
            <div className="bg-slate-900/50 border border-slate-800 rounded px-4 py-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Daily Production
              </div>
              <div className="text-lg font-semibold text-amber-400">
                {props.resValue} {props.resName}
              </div>
            </div>
          )}
          {props.value != null && props.value > 0 && (
            <div className="bg-slate-900/50 border border-slate-800 rounded px-4 py-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {resolveDict(dict, "ui.value")}
              </div>
              <div className="text-lg font-semibold text-slate-300">
                {props.value.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Unit recruitment */}
      {props.units && props.units.length > 0 && (
        <div>
          <h4 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            {resolveDict(dict, "ui.cat_hires")}
          </h4>
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
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground shrink-0 ml-2">
                  +{u.weeklyGrowth}/week
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
