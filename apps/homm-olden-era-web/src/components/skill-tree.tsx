"use client";

import { useState } from "react";
import Link from "next/link";
import { localizePath } from "@repo/lib";
import type { ResolvedIcon, SkillNode } from "@/components/skill-tree-data";

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
          <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3 border-b border-slate-800 pb-1">
            {groupId}
            <span className="ml-2 text-slate-600">{items.length}</span>
          </h3>
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
            className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
          >
            <Chevron open={open} />
          </button>
        ) : (
          <span className="w-5 shrink-0" />
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
  activeId,
  locale = "en",
}: {
  skills: SkillNode[];
  activeId: string;
  locale?: string;
}) {
  const groups = new Map<string, SkillNode[]>();
  for (const skill of skills) {
    const group = skill.groupId ?? "other";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(skill);
  }

  return (
    <nav className="sidebar-scroll w-56 shrink-0 max-lg:hidden overflow-y-auto max-h-[calc(100vh-80px)] sticky top-[70px] pr-2">
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
            className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
          >
            <Chevron open={open} className="w-2.5 h-2.5" />
          </button>
        ) : (
          <span className="w-4 shrink-0" />
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
