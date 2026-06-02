"use client";

import { useMemo, useState } from "react";
import { SpriteIcon } from "@/lib/db/sprite-icon";

type IconSprite = { url: string; x: number; y: number; width: number; height: number };

type ExchangeRow = {
  resName: string;
  exchange: { name: string; inValue: number; outValue: number }[];
};

/**
 * Per-Marketplace markup model.
 *
 * The trade formula is verified from the game binary (IL2CPP `fdo.ResValues`):
 *
 *     received = floor( amount / inValue * outValue / (1 + m) )
 *
 * where inValue/outValue are the base exchange table entries (the data we
 * have) and `m` is a single markup fraction — the SAME for every resource
 * pair (it's a scalar surcharge on the cost side; the `1.0` constant in
 * `inValue * (markup + 1.0)` was read directly from the binary).
 *
 * `m` depends only on the effective Marketplace count: it's largest with one
 * Marketplace and shrinks toward 0 as you own more (the Economy skill counts
 * as one extra Marketplace; the Dungeon faction law forces m = 0). The exact
 * curve `m(effectiveMarkets)` is computed in compiled code (the `cczn` field
 * of the exchange UI) and is NOT in the extracted data, so it's calibrated
 * from in-game observation.
 *
 * To calibrate: for a fixed trade (e.g. 1000 gold -> wood), note the received
 * amount at 1, 2, 3, 4 Marketplaces. Each gives m = baseReceived/observed - 1.
 * Fill `markupByMarkets` with those fractions and set `MARKUP_CALIBRATED`.
 */
const MARKUP_CALIBRATED = false;
// Markup fraction `m` indexed by effective Marketplace count (1-based).
// e.g. markupByMarkets[1] = m at one Marketplace. Pending in-game data.
const markupByMarkets: Record<number, number> = {};
function markupMultiplier(effectiveMarkets: number): number {
  if (!MARKUP_CALIBRATED) return 1; // show base rate until calibrated
  // Clamp to the highest calibrated count; markup only shrinks beyond it.
  const counts = Object.keys(markupByMarkets).map(Number).sort((a, b) => a - b);
  if (counts.length === 0) return 1;
  const key = effectiveMarkets <= counts[0]
    ? counts[0]
    : effectiveMarkets >= counts[counts.length - 1]
      ? counts[counts.length - 1]
      : effectiveMarkets;
  const m = markupByMarkets[key] ?? 0;
  return 1 / (1 + m);
}

const RESOURCE_ORDER = [
  "gold",
  "wood",
  "ore",
  "gemstones",
  "crystals",
  "mercury",
  "dust",
];

export function MarketplaceCalculator({
  rates,
  resourceNames,
  resourceIcons,
  iconsHash,
  appName,
}: {
  rates: ExchangeRow[];
  resourceNames: Record<string, string>;
  resourceIcons: Record<string, IconSprite>;
  iconsHash?: string;
  appName: string;
}) {
  const resources = useMemo(
    () => RESOURCE_ORDER.filter((r) => rates.some((row) => row.resName === r)),
    [rates],
  );

  const [give, setGive] = useState("gold");
  const [receive, setReceive] = useState("wood");
  const [amount, setAmount] = useState(1000);
  const [markets, setMarkets] = useState(1);
  const [economySkill, setEconomySkill] = useState(false);
  const [markupsDisabled, setMarkupsDisabled] = useState(false);

  const rateByPair = useMemo(() => {
    const map = new Map<string, { inValue: number; outValue: number }>();
    for (const row of rates) {
      for (const ex of row.exchange) {
        map.set(`${row.resName}>${ex.name}`, {
          inValue: ex.inValue,
          outValue: ex.outValue,
        });
      }
    }
    return map;
  }, [rates]);

  const pair = give === receive ? undefined : rateByPair.get(`${give}>${receive}`);
  // Effective Marketplaces: the slider + (Economy skill counts as one extra).
  const effectiveMarkets = markets + (economySkill ? 1 : 0);
  const mult =
    markupsDisabled || !MARKUP_CALIBRATED ? 1 : markupMultiplier(effectiveMarkets);
  // Base: spend `inValue` of `give` to get `outValue` of `receive`.
  const baseReceived = pair ? (amount / pair.inValue) * pair.outValue : 0;
  const received = Math.floor(baseReceived * mult);

  const ResIcon = ({ id, size = 20 }: { id: string; size?: number }) =>
    resourceIcons[id] ? (
      <SpriteIcon icon={resourceIcons[id]} appName={appName} size={size} iconsHash={iconsHash} />
    ) : null;

  const Picker = ({
    value,
    onChange,
    label,
  }: {
    value: string;
    onChange: (v: string) => void;
    label: string;
  }) => (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        {resources.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            className={`flex items-center gap-1 px-2 py-1 rounded border text-sm transition-colors ${
              value === r
                ? "border-amber-700 bg-amber-900/30 text-amber-300"
                : "border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-600"
            }`}
          >
            <ResIcon id={r} size={16} />
            {resourceNames[r] ?? r}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Picker value={give} onChange={setGive} label="Spend" />
        <Picker value={receive} onChange={setReceive} label="Receive" />
      </div>

      <div className="flex items-end gap-3 flex-wrap">
        <label className="text-sm">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Amount to spend
          </div>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
            className="w-32 bg-slate-950/60 border border-slate-700 rounded px-2 py-1 text-sm"
          />
        </label>
        <label className="text-sm flex-1 min-w-[200px]">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Marketplaces owned: <span className="text-amber-300">{markets}</span>
          </div>
          <input
            type="range"
            min={1}
            max={8}
            value={markets}
            onChange={(e) => setMarkets(Number(e.target.value))}
            className="w-full accent-amber-500"
            disabled={markupsDisabled}
          />
        </label>
      </div>

      <div className="flex gap-4 flex-wrap text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={economySkill}
            onChange={(e) => setEconomySkill(e.target.checked)}
            className="accent-amber-500"
            disabled={markupsDisabled}
          />
          Economy skill (+1 Marketplace)
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={markupsDisabled}
            onChange={(e) => setMarkupsDisabled(e.target.checked)}
            className="accent-amber-500"
          />
          No markups (Dungeon law)
        </label>
      </div>

      {/* Result */}
      <div className="flex items-center gap-2 text-lg font-medium border-t border-slate-800/50 pt-3">
        <span className="inline-flex items-center gap-1.5">
          {amount.toLocaleString()} <ResIcon id={give} /> {resourceNames[give]}
        </span>
        <span className="text-muted-foreground">→</span>
        {give === receive ? (
          <span className="text-muted-foreground text-sm">Pick two different resources</span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-amber-300">
            {received.toLocaleString()} <ResIcon id={receive} /> {resourceNames[receive]}
          </span>
        )}
      </div>

      {!MARKUP_CALIBRATED && !markupsDisabled && (
        <p className="text-xs text-muted-foreground">
          Showing the <strong>base (no-markup)</strong> rate — what you get with
          markups disabled or many Marketplaces. The exact per-Marketplace
          markup curve is being calibrated and will make the slider live.
        </p>
      )}
    </div>
  );
}
