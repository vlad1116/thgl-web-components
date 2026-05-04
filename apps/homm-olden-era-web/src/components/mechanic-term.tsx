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
    anchor: "hero-stats",
    desc: "Each point of Attack above the target's Defense adds +5% damage (up to +300%).",
  },
  offence: {
    label: "Attack",
    anchor: "hero-stats",
    desc: "Each point of Attack above the target's Defense adds +5% damage (up to +300%).",
  },
  defence: {
    label: "Defense",
    anchor: "hero-stats",
    desc: "Each point of Defense above the attacker's Attack reduces damage by ~2.5%.",
  },
  defense: {
    label: "Defense",
    anchor: "hero-stats",
    desc: "Each point of Defense above the attacker's Attack reduces damage by ~2.5%.",
  },
  spellpower: {
    label: "Spell Power",
    anchor: "hero-stats",
    desc: "Increases spell effectiveness — damage, healing, duration, and area of effect.",
  },
  intelligence: {
    label: "Intelligence",
    anchor: "hero-stats",
    desc: "Each point adds 10 mana to the hero's maximum mana pool.",
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
    desc: "Each point gives 6% chance for a Lucky Strike (+50% damage) or Unlucky Strike (−50%). Range: −3 to +3.",
  },
  morale: {
    label: "Morale",
    anchor: "battle-mechanics",
    desc: "Each point gives 6% chance for a bonus action or lost turn. Mixing factions reduces Morale. Range: −3 to +3.",
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
        if (x + tooltipW > window.innerWidth - 8) x = window.innerWidth - tooltipW - 8;
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
            className="fixed z-[99999] w-[260px] rounded-lg border border-neutral-700 bg-zinc-900 shadow-2xl p-2.5 pointer-events-none"
            style={{
              left: pos.x,
              top: pos.y,
              transform: ref.current && ref.current.getBoundingClientRect().top > 160 ? "translateY(-100%)" : undefined,
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
