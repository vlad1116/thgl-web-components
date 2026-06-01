"use client";

import { useState, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

/** Static mechanic descriptions — these are small and don't need an API call */
const MECHANICS: Record<
  string,
  { label: string; desc: string; anchor: string }
> = {
  attack: {
    label: "Attack",
    anchor: "unit-stats",
    desc: "Damage formula: DM = (20 + Attack) / (20 + Defense). Minimum modifier is 0.",
  },
  offence: {
    label: "Attack",
    anchor: "unit-stats",
    desc: "Damage formula: DM = (20 + Attack) / (20 + Defense). Minimum modifier is 0.",
  },
  defence: {
    label: "Defense",
    anchor: "unit-stats",
    desc: "Damage formula: DM = (20 + Attack) / (20 + Defense). Minimum modifier is 0.",
  },
  defense: {
    label: "Defense",
    anchor: "unit-stats",
    desc: "Damage formula: DM = (20 + Attack) / (20 + Defense). Minimum modifier is 0.",
  },
  spellpower: {
    label: "Spell Power",
    anchor: "hero-stats",
    desc: "Enhances the strength of the hero's spells — increases their Damage and the duration of applied effects.",
  },
  intelligence: {
    label: "Knowledge",
    anchor: "hero-stats",
    desc: "Increases the hero's maximum mana by 10 for each point of Knowledge.",
  },
  health: {
    label: "Health",
    anchor: "unit-stats",
    desc: "Total hit points per creature. Only the top creature in a stack can be partially damaged.",
  },
  damage: {
    label: "Damage",
    anchor: "unit-stats",
    desc: "Base damage range per creature, modified by Attack vs Defense difference.",
  },
  initiative: {
    label: "Initiative",
    anchor: "unit-stats",
    desc: "Determines turn order. Higher initiative acts first. Ties go to the defender.",
  },
  speed: {
    label: "Speed",
    anchor: "unit-stats",
    desc: "Tiles a unit can move per turn. Flying units ignore obstacles.",
  },
  luck: {
    label: "Luck",
    anchor: "battle-mechanics",
    desc: "Each point above 0 gives a 6% chance to deal 150% damage (Lucky Strike). Each point below 0 gives a 6% chance to deal 50% damage (Unlucky Strike). Default hero range −5 to +5; per-creature ranges vary.",
  },
  morale: {
    label: "Morale",
    anchor: "battle-mechanics",
    desc: "Each point above 0 gives a 4% chance for an extra turn. Each point below 0 gives a 4% chance to skip a turn. Default hero range −5 to +5; mixing factions reduces Morale.",
  },
  mana: {
    label: "Mana",
    anchor: "hero-stats",
    desc: "Resource for casting spells. Maximum mana = Intelligence × 10.",
  },
  value: {
    label: "Value",
    anchor: "unit-stats",
    desc: "AI value of each creature, used for army strength calculations.",
  },
};

export function getMechanicKeys(): string[] {
  return Object.keys(MECHANICS);
}

/**
 * Renders a term with a tooltip and link to the mechanics page.
 * Use `termKey` to look up the mechanic (lowercase, e.g. "luck", "attack").
 * The `children` is the visible text — allows localized labels.
 */
export function MechanicTerm({
  termKey,
  locale = "en",
  children,
  className = "",
}: {
  termKey: string;
  locale?: string;
  children: ReactNode;
  className?: string;
}) {
  const mechanic = MECHANICS[termKey.toLowerCase()];
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLAnchorElement>(null);

  if (!mechanic) return <>{children}</>;

  const href =
    locale === "en"
      ? `/db/mechanics#${mechanic.anchor}`
      : `/${locale}/db/mechanics#${mechanic.anchor}`;

  const handleEnter = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    timerRef.current = setTimeout(() => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const tooltipW = 260;
        let x = rect.left;
        if (x + tooltipW > window.innerWidth - 8)
          x = window.innerWidth - tooltipW - 8;
        if (x < 8) x = 8;
        const y = rect.top > 160 ? rect.top - 4 : rect.bottom + 4;
        setPos({ x, y });
      }
      setVisible(true);
    }, 300);
  };

  const handleLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    hideTimerRef.current = setTimeout(() => setVisible(false), 100);
  };

  return (
    <>
      <Link
        ref={ref}
        href={href}
        prefetch={false}
        className={`underline decoration-dotted decoration-slate-600 underline-offset-2 hover:decoration-amber-600 hover:text-amber-400 transition-colors ${className}`}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {children}
      </Link>
      {visible &&
        pos &&
        createPortal(
          <div
            className="fixed z-99999 w-[260px] rounded-lg border border-neutral-700 bg-zinc-900 shadow-2xl p-2.5 pointer-events-none"
            style={{
              left: pos.x,
              top: pos.y,
              transform:
                ref.current && ref.current.getBoundingClientRect().top > 160
                  ? "translateY(-100%)"
                  : undefined,
            }}
          >
            <div className="text-xs font-medium text-amber-400 mb-1">
              {mechanic.label}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {mechanic.desc}
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}
