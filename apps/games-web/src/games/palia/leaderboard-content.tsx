"use client";

import { useState } from "react";
import Image from "next/image";
import {
  PawPrint,
  Axe,
  ChevronDown,
  Trophy,
  Medal,
  Home,
  Clock,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/controls";
import { getIconsUrl } from "@repo/lib";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SkillLevel {
  type: string;
  level: number;
  xpGainedThisLevel: number;
}

export interface Player {
  name: string;
  level: number;
  skillLevels: SkillLevel[];
  lastKnownPrimaryHousingPlotValue?: number;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Skill Configuration
// ---------------------------------------------------------------------------

const CDN_ICONS: Record<string, string> = {
  BugCatching: "icon_skill_bug_01.webp",
  Fishing: "icon_skill_fishing_01.webp",
  Foraging: "icon_skill_forage_01.webp",
  Hunting: "icon_skill_hunt_01.webp",
  Mining: "icon_skill_mining_01.webp",
  Cooking: "icon_skill_cooking_01.webp",
  FurnitureMaking: "icon_skill_furniture_01.webp",
  Gardening: "icon_skill_gardening_01.webp",
};

const SKILL_LABELS: Record<string, string> = {
  BugCatching: "Bug Catching",
  Fishing: "Fishing",
  Foraging: "Foraging",
  Hunting: "Hunting",
  Mining: "Mining",
  Cooking: "Cooking",
  FurnitureMaking: "Furniture Making",
  Gardening: "Gardening",
  AnimalHusbandry: "Ranching",
  Lumberjacking: "Lumberjacking",
};

const HIDDEN_SKILLS = new Set([
  "Combat",
  "Alchemy",
  "Blacksmithing",
  "Master",
]);

const SKILL_ORDER = [
  "Gardening",
  "Fishing",
  "BugCatching",
  "Hunting",
  "Cooking",
  "Foraging",
  "Mining",
  "FurnitureMaking",
  "Lumberjacking",
  "AnimalHusbandry",
];

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function sortSkills(skills: SkillLevel[]): SkillLevel[] {
  return [...skills]
    .filter((s) => !HIDDEN_SKILLS.has(s.type))
    .sort((a, b) => {
      const aIdx = SKILL_ORDER.indexOf(a.type);
      const bIdx = SKILL_ORDER.indexOf(b.type);
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    });
}

function formatXP(xp: number): string {
  return xp.toLocaleString();
}

// ---------------------------------------------------------------------------
// Skill Icon Component
// ---------------------------------------------------------------------------

function FallbackIcon({
  type,
  className,
  style,
}: {
  type: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const cls = className ?? "w-5 h-5";
  switch (type) {
    case "AnimalHusbandry":
      return <PawPrint className={cls} style={style} />;
    case "Lumberjacking":
      return <Axe className={cls} style={style} />;
    default:
      return null;
  }
}

function SkillIcon({ type, size = 20 }: { type: string; size?: number }) {
  const cdnIcon = CDN_ICONS[type];
  if (cdnIcon) {
    return (
      <Image
        src={getIconsUrl("palia", cdnIcon)}
        width={size}
        height={size}
        alt={SKILL_LABELS[type] ?? type}
        className="object-contain"
      />
    );
  }
  return (
    <FallbackIcon
      type={type}
      className={`text-muted-foreground`}
      style={{ width: size, height: size }}
    />
  );
}

// ---------------------------------------------------------------------------
// Rank Badge
// ---------------------------------------------------------------------------

const RANK_STYLES: Record<
  number,
  { text: string; bg: string; border: string; glow: string }
> = {
  1: {
    text: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/40",
    glow: "shadow-amber-400/20",
  },
  2: {
    text: "text-zinc-300",
    bg: "bg-zinc-300/10",
    border: "border-zinc-300/40",
    glow: "shadow-zinc-300/20",
  },
  3: {
    text: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/40",
    glow: "shadow-orange-500/20",
  },
};

function RankIcon({ rank }: { rank: number }) {
  const style = RANK_STYLES[rank];
  if (rank === 1) return <Trophy className={`w-5 h-5 ${style?.text}`} />;
  if (rank <= 3) return <Medal className={`w-5 h-5 ${style?.text}`} />;
  return (
    <span className="text-sm tabular-nums text-muted-foreground font-medium w-5 text-center">
      {rank}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Compact Skill Badge (inline in rows)
// ---------------------------------------------------------------------------

function SkillBadge({ skill }: { skill: SkillLevel }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-0.5 rounded bg-muted/50 px-1 py-0.5">
          <SkillIcon type={skill.type} size={14} />
          <span className="text-[10px] lg:text-xs tabular-nums font-medium leading-none">
            {skill.level}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <p className="font-medium">{SKILL_LABELS[skill.type] ?? skill.type}</p>
        <p className="text-muted-foreground">
          Level {skill.level} &middot; {formatXP(skill.xpGainedThisLevel)} XP
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// Expanded Skill Grid
// ---------------------------------------------------------------------------

function SkillGrid({ skills }: { skills: SkillLevel[] }) {
  const sorted = sortSkills(skills);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-3 pb-1">
      {sorted.map((skill) => (
        <div
          key={skill.type}
          className="flex items-start gap-2.5 rounded-lg bg-muted/30 border border-border/50 px-3 py-2"
        >
          <div className="shrink-0 mt-0.5">
            <SkillIcon type={skill.type} size={24} />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-xs text-muted-foreground leading-tight">
              {SKILL_LABELS[skill.type] ?? skill.type}
            </p>
            <p className="text-sm font-semibold tabular-nums leading-tight">
              Lv. {skill.level}
            </p>
            <p className="text-[10px] text-muted-foreground/70 tabular-nums leading-tight">
              {formatXP(skill.xpGainedThisLevel)} XP
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Player Row
// ---------------------------------------------------------------------------

function PlayerRow({ player, rank }: { player: Player; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const skills = sortSkills(player.skillLevels);
  const rankStyle = RANK_STYLES[rank];

  return (
    <div
      className={`rounded-lg border transition-colors ${
        rankStyle
          ? `${rankStyle.border} ${rankStyle.bg} hover:brightness-110`
          : "border-border/50 bg-card/50 hover:bg-card/80"
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer"
      >
        {/* Rank */}
        <div className="flex items-center gap-1.5 w-10 shrink-0 justify-end">
          {rankStyle && <RankIcon rank={rank} />}
          <span
            className={`text-sm tabular-nums font-medium ${rankStyle ? rankStyle.text : "text-muted-foreground"}`}
          >
            {rank}
          </span>
        </div>

        {/* Name */}
        <span className="font-medium truncate min-w-[80px] flex-1">
          {player.name}
        </span>

        {/* Level */}
        <span className="text-sm font-bold tabular-nums shrink-0">
          Lv. {player.level}
        </span>

        {/* Compact skills (desktop) */}
        <div className="hidden md:flex items-center gap-0.5 shrink-0">
          {skills.map((skill) => (
            <SkillBadge key={skill.type} skill={skill} />
          ))}
        </div>

        {/* Plot level */}
        <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Home className="w-3 h-3" />
          {player.lastKnownPrimaryHousingPlotValue ?? "-"}
        </span>

        {/* Last seen */}
        <span
          className="hidden xl:flex items-center gap-1 text-xs text-muted-foreground shrink-0"
          suppressHydrationWarning
        >
          <Clock className="w-3 h-3" />
          {getRelativeTime(player.timestamp)}
        </span>

        {/* Expand toggle */}
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expandable skill detail */}
      <div
        className={`grid transition-all duration-200 ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-3 border-t border-border/30">
            {/* Meta visible in expanded view */}
            <div className="flex items-center gap-4 pt-2 pb-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 sm:hidden">
                <Home className="w-3 h-3" />
                Plot: {player.lastKnownPrimaryHousingPlotValue ?? "-"}
              </span>
              <span
                className="flex items-center gap-1"
                suppressHydrationWarning
              >
                <Clock className="w-3 h-3" />
                {getRelativeTime(player.timestamp)}
              </span>
            </div>
            <SkillGrid skills={skills} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function LeaderboardContent({
  players,
}: {
  players: Player[];
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-1">
        {players.map((player, i) => (
          <PlayerRow
            key={`${player.name}-${i}`}
            player={player}
            rank={i + 1}
          />
        ))}
      </div>
    </TooltipProvider>
  );
}
