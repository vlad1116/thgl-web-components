import { SpriteIcon } from "@/components/sprite-icon";
import { resolveDict } from "@/components/resolve-dict";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const RESOURCE_COLORS: Record<string, string> = {
  gold: "text-amber-400",
  wood: "text-green-400",
  ore: "text-slate-300",
  dust: "text-purple-400",
  crystals: "text-cyan-400",
  gemstones: "text-emerald-400",
  mercury: "text-slate-300",
};

export type ResourceIconLookup = Map<string, IconSprite>;

export function buildResourceIconLookup(database: any[]): ResourceIconLookup {
  const lookup = new Map<string, IconSprite>();
  const entry = database.find((cat) => cat.type === "_resources");
  if (entry) {
    for (const item of entry.items) {
      if (item.icon) lookup.set(item.id, item.icon as IconSprite);
    }
  }
  return lookup;
}

export function ResourceCost({
  name,
  amount,
  resourceIcons,
  iconsHash,
  dict,
  size = 16,
}: {
  name: string;
  amount: number;
  resourceIcons: ResourceIconLookup;
  iconsHash?: string;
  dict?: Record<string, string>;
  size?: number;
}) {
  const icon = resourceIcons.get(name);
  const color = RESOURCE_COLORS[name] ?? "text-slate-300";
  const label = dict ? resolveDict(dict, `resource_${name}`) : name;
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm ${color}`}
      title={`${amount.toLocaleString()} ${label}`}
      aria-label={`${amount.toLocaleString()} ${label}`}
    >
      <span className="font-medium">{amount.toLocaleString()}</span>
      {icon && <SpriteIcon icon={icon} size={size} iconsHash={iconsHash} />}
    </span>
  );
}

export function ResourceCostList({
  costs,
  resourceIcons,
  iconsHash,
  dict,
  size = 16,
}: {
  costs: { name: string; cost: number }[];
  resourceIcons: ResourceIconLookup;
  iconsHash?: string;
  dict?: Record<string, string>;
  size?: number;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      {costs.map((c) => (
        <ResourceCost
          key={c.name}
          name={c.name}
          amount={c.cost}
          resourceIcons={resourceIcons}
          iconsHash={iconsHash}
          dict={dict}
          size={size}
        />
      ))}
    </div>
  );
}
