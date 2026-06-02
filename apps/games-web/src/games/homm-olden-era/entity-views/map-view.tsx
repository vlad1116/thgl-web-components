import { getAppUrl } from "@repo/lib";
import { resolveDict } from "@/lib/db/resolve-dict";

const APP_NAME = "homm-olden-era";

type MapProps = {
  gameMode?: string;
  winCondition?: string;
  sizeX?: number;
  sizeZ?: number;
  players?: number;
  preview?: string;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded px-3 py-2">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-medium text-slate-200 mt-0.5">{value}</div>
    </div>
  );
}

export function MapView({
  name,
  desc,
  props,
  dict,
  entryId,
}: {
  name: string;
  desc: string;
  props: MapProps;
  dict: Record<string, string>;
  locale?: string;
  entryId?: string;
}) {
  const modeLabel = props.gameMode
    ? resolveDict(dict, `ui.map_mode_${props.gameMode}`)
    : "";
  const winLabel = props.winCondition
    ? resolveDict(dict, props.winCondition)
    : "";
  const sizeLabel =
    props.sizeX && props.sizeZ ? `${props.sizeX}×${props.sizeZ}` : "";

  const hasDesc =
    desc && desc !== `${entryId}_desc` && !desc.endsWith("_desc");
  const descHtml = hasDesc ? desc.replace(/\r?\n/g, "<br/>") : "";

  const previewUrl = props.preview
    ? getAppUrl(APP_NAME, `/maps/${props.preview}`)
    : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {modeLabel && (
            <span className="text-sm px-2.5 py-0.5 rounded bg-sky-900/40 text-sky-300 border border-sky-800/60">
              {modeLabel}
            </span>
          )}
          {winLabel && (
            <span className="text-sm px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {winLabel}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[minmax(0,320px)_1fr] items-start">
        {previewUrl && (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={`${name} schematic`}
              width={320}
              height={320}
              className="w-full max-w-[320px] rounded-lg border border-slate-800 bg-slate-950"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {resolveDict(dict, "ui.map_rmg_note")}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {modeLabel && (
              <Stat
                label={resolveDict(dict, "ui.map_game_mode")}
                value={modeLabel}
              />
            )}
            {winLabel && (
              <Stat
                label={resolveDict(dict, "ui.map_win_condition")}
                value={winLabel}
              />
            )}
            {props.players != null && props.players > 0 && (
              <Stat
                label={resolveDict(dict, "ui.map_players")}
                value={String(props.players)}
              />
            )}
            {sizeLabel && (
              <Stat label={resolveDict(dict, "ui.map_size")} value={sizeLabel} />
            )}
          </div>

          {descHtml && (
            <div
              className="text-sm text-muted-foreground leading-relaxed [&_b]:text-slate-200 [&_b]:font-semibold"
              dangerouslySetInnerHTML={{ __html: descHtml }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
