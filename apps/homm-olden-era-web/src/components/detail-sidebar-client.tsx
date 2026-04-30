"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localizePath } from "@repo/lib";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type SidebarItem = {
  id: string;
  icon?: IconSprite | string;
  groupId?: string;
};

type SidebarGroup = {
  label: string;
  items: { id: string; name: string; icon?: IconSprite }[];
};

export function DetailSidebarClient({
  groups,
  section,
  locale = "en",
}: {
  groups: SidebarGroup[];
  section: string;
  locale?: string;
}) {
  const pathname = usePathname() ?? "/";
  const activeId = pathname.split("/").pop() ?? "";

  return (
    <nav className="sidebar-scroll">
      {groups.map((group) => (
        <div key={group.label} className="mb-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 px-1.5">
            {group.label}
          </div>
          {group.items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <Link
                key={item.id}
                href={localizePath(`/db/${section}/${item.id}`, locale)}
                prefetch={false}
                className={`flex items-center gap-2 px-1.5 py-1.5 rounded transition-colors ${
                  isActive
                    ? "bg-amber-900/30 text-amber-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-zinc-800/50"
                }`}
              >
                {item.icon && (
                  <img
                    alt=""
                    role="presentation"
                    className="shrink-0 object-none"
                    src={item.icon.url}
                    width={item.icon.width}
                    height={item.icon.height}
                    style={{
                      objectPosition: `-${item.icon.x}px -${item.icon.y}px`,
                      zoom: 20 / 64,
                    }}
                  />
                )}
                <span className="truncate text-sm">{item.name}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
