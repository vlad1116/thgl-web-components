import Link from "next/link";
import { localizePath } from "@repo/lib";
import { resolveDict } from "@/components/resolve-dict";
import { SpriteIcon } from "@/components/sprite-icon";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type DatabaseItem = {
  id: string;
  icon?: IconSprite | string;
  props?: Record<string, unknown>;
  groupId?: string;
};

type DatabaseEntry = {
  type: string;
  items: DatabaseItem[];
};

const SECTION_MAP: Record<string, string> = {
  units: "units",
  heroes: "heroes",
  spells: "spells",
  items: "artifacts",
  item_sets: "artifacts",
  skills: "skills",
  sub_skills: "skills",
  specializations: "factions",
  factions: "factions",
  faction_laws: "factions",
};

export function findItem(
  database: DatabaseEntry[],
  itemId: string,
): { item: DatabaseItem; type: string } | undefined {
  for (const entry of database) {
    const item = entry.items.find((i) => i.id === itemId);
    if (item) return { item, type: entry.type };
  }
  return undefined;
}

export function getHref(type: string, itemId: string, locale = "en"): string {
  const section = SECTION_MAP[type] ?? type;
  return localizePath(`/db/${section}/${itemId}`, locale);
}

export function EntityLink({
  itemId,
  database,
  dict,
  showIcon = true,
  className = "",
  locale = "en",
}: {
  itemId: string;
  database: DatabaseEntry[];
  dict: Record<string, string>;
  showIcon?: boolean;
  className?: string;
  locale?: string;
}) {
  const found = findItem(database, itemId);
  if (!found) {
    return (
      <span className={`text-sm ${className}`}>
        {resolveDict(dict, itemId)}
      </span>
    );
  }

  const { item, type } = found;
  const name = resolveDict(dict, item.id);
  const icon =
    item.icon && typeof item.icon === "object"
      ? (item.icon as IconSprite)
      : undefined;

  return (
    <Link
      href={getHref(type, item.id, locale)}
      className={`inline-flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors ${className}`}
    >
      {showIcon && icon && <SpriteIcon icon={icon} size={20} />}
      <span>{name}</span>
    </Link>
  );
}

export function EntityLinkCard({
  itemId,
  database,
  dict,
  subtitle,
  locale = "en",
}: {
  itemId: string;
  database: DatabaseEntry[];
  dict: Record<string, string>;
  subtitle?: string;
  locale?: string;
}) {
  const found = findItem(database, itemId);
  if (!found) {
    return (
      <div className="bg-slate-900/30 border border-slate-800/50 rounded px-3 py-2 text-sm">
        {resolveDict(dict, itemId)}
      </div>
    );
  }

  const { item, type } = found;
  const name = resolveDict(dict, item.id);
  const icon =
    item.icon && typeof item.icon === "object"
      ? (item.icon as IconSprite)
      : undefined;

  return (
    <Link
      href={getHref(type, item.id, locale)}
      className="flex items-center gap-2 bg-slate-900/30 border border-slate-800/50 rounded px-3 py-2 hover:border-amber-800/50 hover:bg-slate-900/50 transition-colors group"
    >
      {icon && <SpriteIcon icon={icon} size={32} />}
      <div>
        <span className="text-sm font-medium group-hover:text-amber-400 transition-colors">
          {name}
        </span>
        {subtitle && (
          <span className="block text-xs text-muted-foreground">{subtitle}</span>
        )}
      </div>
    </Link>
  );
}

export function RelatedSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </h4>
      {children}
    </div>
  );
}
