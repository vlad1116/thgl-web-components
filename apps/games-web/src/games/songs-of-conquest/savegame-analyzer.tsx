"use client";

import { useCallback, useMemo, useState } from "react";
import { Cinzel } from "next/font/google";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["700", "900"] });

const RESOURCES = [
  "Gold",
  "Wood",
  "Stone",
  "Ancient Amber",
  "Glimmerweave",
  "Celestial Ore",
];
const FACTIONS: Record<number, string> = {
  0: "Neutral",
  1: "Arleon",
  2: "Barony of Loth",
  3: "Barya",
  4: "Rana",
  5: "Vanir",
  6: "Roots",
  7: "Yulan",
};
const AI_MODES: Record<number, string> = {
  0: "Player",
  5: "Easy",
  20: "Medium",
  30: "AutoBattle",
};

const SAVE_PATHS: [string, string][] = [
  [
    "Windows",
    "%appdata%\\..\\LocalLow\\Lavapotion\\SongsOfConquest\\Savegames",
  ],
  [
    "macOS",
    "~/Library/Application Support/Lavapotion/SongsOfConquest/Savegames",
  ],
  [
    "Proton",
    ".local/share/Steam/steamapps/compatdata/867210/pfx/drive_c/users/steamuser/AppData/LocalLow/Lavapotion/SongsOfConquest/Savegames",
  ],
];

type RoundStat = {
  Round: number;
  ArmyValue: number;
  WonBattles: number;
  LostBattles: number;
  Income: { Type: number; _amount: number }[];
};
type Team = {
  _teamID: number;
  _name: string;
  _factionIndex: number;
  _aiMode: number;
  _isAlive: boolean;
  _resources: { _resources: { Type: number; _amount: number }[] };
  _statistics: { _roundStatistics: RoundStat[] };
  _teamColorCollection?: { Primary?: { r: number; g: number; b: number } };
};
type Commander = {
  _id: number;
  _teamId: number;
  _faction: number;
  _reference: { Name: string };
  _unspentSkillPoints: number;
  _skills: { Skill: number; Level: number }[];
  _stats: {
    _offense: number;
    _defense: number;
    _command: number;
    _movement: number;
    _viewRadius: number;
    _experience: number;
    _spellDamagePowerPercent: number;
  };
};
type Objective = {
  _teamId: number;
  _objective: {
    name: string;
    progressText: string;
    currentValue: number;
    maxValue: number;
    optional: boolean;
  };
};
type Save = {
  Metadata: {
    CampaignIdentifier: string;
    GameMode: number;
    MapName: string;
    Players: number;
    Round: number;
    SaveVersion: number;
  };
  File: {
    _teamsSerializable: Team[];
    _commandersSerializable: Commander[];
    _storyObjectives: Objective[];
  };
};

function deserialize(text: string): Save {
  const fileData = JSON.parse(text) as { File: string; Metadata: string };
  return {
    File: JSON.parse(fileData.File),
    Metadata: JSON.parse(fileData.Metadata),
  };
}

const PALETTE = [
  "#e0b266",
  "#6fb1f0",
  "#7bd88f",
  "#e0707a",
  "#b988e8",
  "#e3a15a",
  "#5ec8c0",
  "#d98cc0",
];
function teamColor(team: Team, i: number): string {
  const p = team._teamColorCollection?.Primary;
  if (p && (p.r || p.g || p.b)) {
    const n = (v: number) => Math.round(v <= 1 ? v * 255 : v);
    return `rgb(${n(p.r)}, ${n(p.g)}, ${n(p.b)})`;
  }
  return PALETTE[i % PALETTE.length];
}

const METRICS = [
  { key: "armyValue", label: "Army Value" },
  { key: "wonBattles", label: "Won Battles" },
  { key: "lostBattles", label: "Lost Battles" },
  ...RESOURCES.map((r, i) => ({ key: `income${i}`, label: `${r} Income` })),
];

function metricValue(rs: RoundStat, key: string): number {
  if (key === "armyValue") return rs.ArmyValue ?? 0;
  if (key === "wonBattles") return rs.WonBattles ?? 0;
  if (key === "lostBattles") return rs.LostBattles ?? 0;
  if (key.startsWith("income")) {
    const t = Number(key.slice(6));
    return rs.Income?.find((x) => x.Type === t)?._amount ?? 0;
  }
  return 0;
}

export function SavegameAnalyzer() {
  const [save, setSave] = useState<Save | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const [metric, setMetric] = useState("armyValue");
  const [copied, setCopied] = useState("");

  const loadFile = useCallback((file: File) => {
    setError("");
    file
      .text()
      .then((t) => {
        setSave(deserialize(t));
        setFileName(file.name);
      })
      .catch(() =>
        setError(
          "Couldn't parse that file — is it a Songs of Conquest savegame?",
        ),
      );
  }, []);

  const teams =
    save?.File._teamsSerializable.filter((t) => t._factionIndex !== 0) ?? [];
  const rounds = save?.Metadata.Round ?? 0;

  const series = useMemo(
    () =>
      teams.map((t, i) => ({
        label: t._name || FACTIONS[t._factionIndex] || `Team ${t._teamID}`,
        color: teamColor(t, i),
        data: Array.from({ length: rounds }, (_, r) => {
          const rs = t._statistics._roundStatistics.find(
            (x) => x.Round === r + 1,
          );
          return rs ? metricValue(rs, metric) : 0;
        }),
      })),
    [teams, rounds, metric],
  );

  if (!save) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1
          className={`${cinzel.className} text-3xl font-black tracking-[0.12em] text-amber-100`}
        >
          Savegame Analyzer
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Drop a Songs of Conquest savegame to chart each team's progress, army
          value, battles and economy round by round. Everything is parsed
          locally in your browser — nothing is uploaded.
        </p>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
          }}
          className={`mt-6 flex h-44 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            drag
              ? "border-amber-400 bg-amber-950/30"
              : "border-slate-700 bg-slate-900/40 hover:border-amber-700/60"
          }`}
        >
          <input
            type="file"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
          />
          <span className="text-amber-300">
            ⬆ Drag a savegame here, or click to choose
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            .sav / save file (JSON)
          </span>
        </label>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-8">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-700/70">
            Where are my saves?
          </h2>
          <div className="space-y-2">
            {SAVE_PATHS.map(([os, p]) => (
              <div
                key={os}
                className="flex items-center gap-2 rounded border border-slate-800 bg-slate-900/40 p-2"
              >
                <span className="w-16 shrink-0 text-xs font-semibold text-amber-400">
                  {os}
                </span>
                <code className="flex-1 truncate text-xs text-slate-400">
                  {p}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(p);
                    setCopied(os);
                    setTimeout(() => setCopied(""), 1200);
                  }}
                  className="shrink-0 rounded border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300 hover:border-amber-700/60"
                >
                  {copied === os ? "Copied" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const m = save.Metadata;
  const commanders = save.File._commandersSerializable.filter(
    (c) => c._reference.Name !== "Ghost",
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className={`${cinzel.className} text-3xl font-black tracking-[0.12em] text-amber-100`}
          >
            {m.MapName || "Savegame"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">{fileName}</p>
        </div>
        <button
          onClick={() => setSave(null)}
          className="rounded border border-amber-700/40 bg-amber-950/30 px-3 py-1 text-[11px] uppercase tracking-widest text-amber-300/90 hover:bg-amber-900/30"
        >
          Load another
        </button>
      </div>

      {/* Meta */}
      <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Round", m.Round],
          ["Players", m.Players],
          ["Game Mode", m.GameMode],
          ["Save Version", m.SaveVersion],
        ].map(([k, v]) => (
          <div
            key={k}
            className="rounded border border-slate-800 bg-slate-900/40 px-3 py-2"
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {k}
            </div>
            <div className="text-sm font-semibold text-slate-100">
              {String(v)}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-700/70">
            Progress per round
          </h2>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200"
          >
            {METRICS.map((mt) => (
              <option key={mt.key} value={mt.key}>
                {mt.label}
              </option>
            ))}
          </select>
        </div>
        <LineChart series={series} xCount={rounds} />
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {series.map((s) => (
            <span
              key={s.label}
              className="inline-flex items-center gap-1.5 text-xs text-slate-300"
            >
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: s.color }}
              />
              {s.label}
            </span>
          ))}
        </div>
      </section>

      {/* Teams */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-700/70">
          Teams
        </h2>
        <div className="overflow-x-auto rounded-md border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 text-left">Team</th>
                <th className="px-3 py-2 text-left">Faction</th>
                <th className="px-3 py-2 text-left">AI</th>
                <th className="px-3 py-2 text-left">Alive</th>
                <th className="px-3 py-2 text-right">Army Value</th>
                <th className="px-3 py-2 text-right">Won</th>
                <th className="px-3 py-2 text-right">Lost</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t, i) => {
                const stats = t._statistics._roundStatistics;
                const last = stats.at(-1);
                const won = stats.reduce((a, c) => a + (c.WonBattles || 0), 0);
                const lost = stats.reduce(
                  (a, c) => a + (c.LostBattles || 0),
                  0,
                );
                return (
                  <tr key={t._teamID} className="border-t border-slate-800/60">
                    <td className="px-3 py-1.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{ background: teamColor(t, i) }}
                        />
                        <span className="font-medium text-slate-100">
                          {t._name}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-slate-300">
                      {FACTIONS[t._factionIndex] ??
                        `Faction ${t._factionIndex}`}
                    </td>
                    <td className="px-3 py-1.5 text-slate-300">
                      {AI_MODES[t._aiMode] ?? t._aiMode}
                    </td>
                    <td className="px-3 py-1.5">
                      {t._isAlive ? (
                        "✓"
                      ) : (
                        <span className="text-red-400">✕</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right font-medium text-amber-200">
                      {(last?.ArmyValue ?? 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-1.5 text-right text-emerald-400">
                      {won}
                    </td>
                    <td className="px-3 py-1.5 text-right text-red-400">
                      {lost}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Wielders */}
      {commanders.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-700/70">
            Wielders
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {commanders.map((c) => {
              const team = teams.find((t) => t._teamID === c._teamId);
              return (
                <div
                  key={c._id}
                  className="rounded border border-slate-800 bg-slate-900/40 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-50">
                      {c._reference.Name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {team?._name ?? FACTIONS[c._faction]}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-300">
                    <span>OFF {c._stats._offense}</span>
                    <span>DEF {c._stats._defense}</span>
                    <span>CMD {c._stats._command}</span>
                    <span>MOV {c._stats._movement}</span>
                    <span>{c._skills.length} skills</span>
                    {c._unspentSkillPoints > 0 && (
                      <span className="text-amber-400">
                        {c._unspentSkillPoints} unspent
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Objectives */}
      {save.File._storyObjectives.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-700/70">
            Objectives
          </h2>
          <div className="space-y-1.5">
            {save.File._storyObjectives.map((o, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-sm"
              >
                <span className="text-amber-300">◆</span>
                <span className="text-slate-200">
                  {o._objective.name || o._objective.progressText}
                </span>
                {o._objective.maxValue > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {o._objective.currentValue}/{o._objective.maxValue}
                  </span>
                )}
                {o._objective.optional && (
                  <span className="rounded bg-slate-800 px-1 text-[10px] text-slate-400">
                    optional
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Minimal multi-series SVG line chart (no chart lib in games-web). */
function LineChart({
  series,
  xCount,
}: {
  series: { label: string; color: string; data: number[] }[];
  xCount: number;
}) {
  const W = 820;
  const H = 280;
  const padL = 52;
  const padB = 26;
  const padT = 12;
  const padR = 14;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const all = series.flatMap((s) => s.data);
  const max = Math.max(1, ...all);
  const x = (i: number) =>
    padL + (xCount <= 1 ? innerW / 2 : (i / (xCount - 1)) * innerW);
  const y = (v: number) => padT + innerH - (v / max) * innerH;
  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => (max / ticks) * i);
  const fmt = (v: number) =>
    v >= 1000
      ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`
      : `${Math.round(v)}`;

  if (xCount === 0)
    return <div className="text-sm text-muted-foreground">No round data.</div>;

  return (
    <div className="overflow-x-auto rounded-md border border-slate-800 bg-[#0e1014] p-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: 520 }}
      >
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y(t)}
              y2={y(t)}
              stroke="rgba(148,163,184,0.12)"
            />
            <text
              x={padL - 6}
              y={y(t) + 3}
              textAnchor="end"
              fontSize={9}
              fill="rgba(148,163,184,0.7)"
            >
              {fmt(t)}
            </text>
          </g>
        ))}
        {/* x-axis end labels */}
        <text x={padL} y={H - 8} fontSize={9} fill="rgba(148,163,184,0.7)">
          R1
        </text>
        <text
          x={W - padR}
          y={H - 8}
          textAnchor="end"
          fontSize={9}
          fill="rgba(148,163,184,0.7)"
        >
          R{xCount}
        </text>
        {series.map((s) => (
          <g key={s.label}>
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              points={s.data.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
              style={{ filter: `drop-shadow(0 0 3px ${s.color}55)` }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
