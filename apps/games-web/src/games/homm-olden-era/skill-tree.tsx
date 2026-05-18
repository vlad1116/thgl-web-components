"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { localizePath } from "@repo/lib";
import { Search as SearchIcon, X } from "lucide-react";
import type { ResolvedIcon, SkillNode } from "@/games/homm-olden-era/skill-tree-data";

function Icon({ icon, size }: { icon: ResolvedIcon; size: number }) {
  const zoom = size / 64;
  return (
    <img
      alt=""
      role="presentation"
      className="shrink-0 object-none"
      src={icon.src}
      width={icon.width}
      height={icon.height}
      style={{
        objectPosition: `-${icon.x}px -${icon.y}px`,
        zoom,
      }}
    />
  );
}

function Chevron({ open, className = "w-3 h-3" }: { open: boolean; className?: string }) {
  return (
    <svg
      className={`${className} transition-transform ${open ? "rotate-90" : ""}`}
      viewBox="0 0 12 12"
      fill="currentColor"
    >
      <path d="M4 2l5 4-5 4V2z" />
    </svg>
  );
}

export function SkillTreeList({
  skills,
  locale = "en",
}: {
  skills: SkillNode[];
  locale?: string;
}) {
  const groups = new Map<string, SkillNode[]>();
  for (const skill of skills) {
    const group = skill.groupId ?? "other";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(skill);
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([groupId, items]) => (
        <div key={groupId}>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3 border-b border-slate-800 pb-1">
            {groupId}
            <span className="ml-2 text-slate-500">{items.length}</span>
          </h2>
          <div className="columns-1 lg:columns-2 gap-x-6">
            {items.map((skill) => (
              <div key={skill.id} className="break-inside-avoid">
                <SkillTreeItem skill={skill} locale={locale} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SkillTreeItem({ skill, locale }: { skill: SkillNode; locale: string }) {
  const [open, setOpen] = useState(false);
  const hasSubs = skill.subSkills.length > 0;

  return (
    <div>
      <div className="flex items-center">
        {hasSubs ? (
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle sub-skills"
            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
          >
            <Chevron open={open} />
          </button>
        ) : (
          <span className="w-6 shrink-0" />
        )}
        <Link
          href={localizePath(`/db/skills/${skill.id}`, locale)}
          prefetch={false}
          className="flex items-center gap-2.5 px-2 py-2 rounded hover:bg-zinc-800/50 transition-colors group flex-1"
        >
          {skill.icon && <Icon icon={skill.icon} size={28} />}
          <span className="truncate group-hover:text-amber-400 transition-colors">
            {skill.name}
          </span>
          {hasSubs && (
            <span className="text-xs text-slate-600 ml-auto shrink-0">
              {skill.subSkills.length}
            </span>
          )}
        </Link>
      </div>
      {open && hasSubs && (
        <div className="ml-7 border-l border-slate-800 pl-2 mb-1">
          {skill.subSkills.map((sub) => (
            <Link
              key={sub.id}
              href={localizePath(`/db/skills/${sub.id}`, locale)}
              prefetch={false}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800/50 transition-colors group"
            >
              {sub.icon && <Icon icon={sub.icon} size={20} />}
              <span className="truncate text-sm text-muted-foreground group-hover:text-amber-400 transition-colors">
                {sub.name}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function SkillTreeSidebar({
  skills,
  locale = "en",
}: {
  skills: SkillNode[];
  locale?: string;
}) {
  const pathname = usePathname() ?? "/";
  const activeId = pathname.split("/").pop() ?? "";
  const [filter, setFilter] = useState("");

  const query = filter.toLowerCase().trim();
  const filteredSkills = query
    ? skills.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.subSkills.some((sub) => sub.name.toLowerCase().includes(query)),
      )
    : skills;

  const groups = new Map<string, SkillNode[]>();
  for (const skill of filteredSkills) {
    const group = skill.groupId ?? "other";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(skill);
  }

  return (
    <nav className="flex flex-col h-full">
      <div className="shrink-0 pb-2">
        <div className="relative">
          <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter..."
            className="w-full h-7 rounded border border-neutral-700 bg-zinc-800/50 pl-7 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-800/50"
          />
          {filter && (
            <button
              onClick={() => setFilter("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="sidebar-scroll overflow-y-auto min-h-0">
      {Array.from(groups.entries()).map(([groupId, items]) => (
        <div key={groupId} className="mb-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 px-1.5">
            {groupId}
          </div>
          {items.map((skill) => (
            <SidebarSkillItem
              key={skill.id}
              skill={skill}
              activeId={activeId}
              locale={locale}
            />
          ))}
        </div>
      ))}
      {query && groups.size === 0 && (
        <div className="text-xs text-muted-foreground text-center py-4">
          No matches
        </div>
      )}
      </div>
    </nav>
  );
}

function SidebarSkillItem({
  skill,
  activeId,
  locale,
}: {
  skill: SkillNode;
  activeId: string;
  locale: string;
}) {
  const isSkillActive = skill.id === activeId;
  const hasActiveSub = skill.subSkills.some((s) => s.id === activeId);
  const [open, setOpen] = useState(isSkillActive || hasActiveSub);
  const hasSubs = skill.subSkills.length > 0;

  return (
    <div>
      <div className="flex items-center">
        {hasSubs ? (
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle sub-skills"
            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
          >
            <Chevron open={open} className="w-2.5 h-2.5" />
          </button>
        ) : (
          <span className="w-6 shrink-0" />
        )}
        <Link
          href={localizePath(`/db/skills/${skill.id}`, locale)}
          prefetch={false}
          className={`flex items-center gap-2 px-1.5 py-1.5 rounded transition-colors flex-1 ${
            isSkillActive
              ? "bg-amber-900/30 text-amber-400"
              : "text-muted-foreground hover:text-foreground hover:bg-zinc-800/50"
          }`}
        >
          {skill.icon && <Icon icon={skill.icon} size={20} />}
          <span className="truncate text-sm">{skill.name}</span>
        </Link>
      </div>
      {open && hasSubs && (
        <div className="ml-4 border-l border-slate-800 pl-1.5 mb-0.5">
          {skill.subSkills.map((sub) => {
            const isSubActive = sub.id === activeId;
            return (
              <Link
                key={sub.id}
                href={localizePath(`/db/skills/${sub.id}`, locale)}
                prefetch={false}
                className={`flex items-center gap-1.5 px-1.5 py-1 rounded transition-colors ${
                  isSubActive
                    ? "bg-amber-900/30 text-amber-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-zinc-800/50"
                }`}
              >
                {sub.icon && <Icon icon={sub.icon} size={16} />}
                <span className="truncate text-xs">{sub.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
