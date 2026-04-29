import type { MarkerOptions } from "./types";
import type { Region } from "./coordinates";
import type { Drawing, PrivateNode } from "./settings";
import { Game } from "./games";

// Conditional import of Next.js cache - only available in Next.js environments
let unstable_cache: typeof import("next/cache").unstable_cache | undefined;

try {
  const nextCache = await import("next/cache");
  unstable_cache = nextCache.unstable_cache;
} catch {
  // Not in a Next.js environment (e.g., Vite), caching will be disabled
  unstable_cache = undefined;
}

export type IconName =
  | "House"
  | "Map"
  | "Server"
  | "BookOpen"
  | "ScrollText"
  | "ArrowUp"
  | "Bug"
  | "NotepadText"
  | "Axe"
  | "Gift"
  | "MapPin"
  | "Trophy"
  | "SquareCheckBig"
  | "MessageSquareWarning"
  | "Grid"
  | "Megaphone"
  | "MonitorSmartphone"
  | "Heart"
  | "Handshake"
  | "Newspaper"
  | "MessageSquare"
  | "HelpCircle"
  | "FileText"
  | "ShieldCheck";

export type AppConfig = {
  name: string;
  domain: string;
  title: string;
  supportedLocales: string[];
  keywords: string[];
  appUrl: string | null;
  withoutLiveMode?: boolean;
  internalLinks?: {
    title: string;
    description?: string;
    href: string;
    linkText?: string;
    bgImage?: string;
    iconName: IconName;
  }[];
  promoLinks?: {
    title: string;
    href: string;
  }[];
  externalLinks?: { href: string; title: string }[];
  markerOptions?: MarkerOptions;
  game?: Game;
  /** Featured filter IDs to highlight on the home page. If not set, first filters are shown. */
  topFilters?: string[];
};

export type OverwolfAppConfig = {
  name: string;
  domain: string;
  title: string;
  gameClassId: number;
  appUrl: string;
  withoutLiveMode?: boolean;
  appId: string;
  discordApplicationId: string;
  markerOptions: MarkerOptions;
};

export type THGLAppConfig = {
  name: string;
  domain: string;
  title: string;
  withoutOverlayMode?: boolean;
  markerOptions: MarkerOptions;
  defaultHotkeys: Record<string, string>;
};

export type Version = {
  id: string;
  createdAt: number;
  data: {
    filters: FiltersConfig;
    regions: Region[];
    tiles: TilesConfig;
    globalFilters: GlobalFiltersConfig;
    typesIdMap: Record<string, string>;
    database: DatabaseConfig;
    drawings: DrawingsConfig;
  };
  more: {
    nodes: Record<string, string>;
    icons: string;
  };
  /** Spawn counts for UI display */
  counts?: {
    /** Total spawns across all maps */
    total: number;
    /** Spawn count per filter type ID */
    byType: Record<string, number>;
    /** Spawn count per map name */
    byMap: Record<string, number>;
  };
};

export const TH_GL_URL = "https://www.th.gl";
// export const TH_GL_URL = "http://localhost:3006";
export const API_FORGE_URL = "https://api-forge.th.gl";
// export const API_FORGE_URL = "http://localhost:3007";

// API endpoints (search)
export const DATA_FORGE_URL = "https://data.th.gl";
// export const DATA_FORGE_URL = "http://localhost:3000";

// Static files (version.json, icons, tiles, config, dicts)
export const DATA_FORGE_CDN_URL = "https://cdn.th.gl";
// export const DATA_FORGE_CDN_URL = "http://localhost:3000";

export function getImageURL(url: string) {
  if (url.startsWith("/global_icons/game-icons")) {
    return `${DATA_FORGE_CDN_URL}${url.replace("/global_icons", "")}`;
  }
  return url;
}

export function getAppUrl(appName: string, path: string): string {
  return `${DATA_FORGE_CDN_URL}/${appName}${path}`;
}

export function getApiUrl(appName: string, searchParams: string): string {
  return `${DATA_FORGE_URL}/api/${appName}/search?${searchParams}`;
}

export function getPreviewImageUrl(
  appName: string,
  mapName: string,
  version?: string,
): string {
  const url = `${DATA_FORGE_CDN_URL}/${appName}/map-tiles/${mapName}/preview.webp`;
  return version ? `${url}?v=${version}` : url;
}

export function getOpenGraphImageUrl(appName: string, mapName: string): string {
  return `${DATA_FORGE_CDN_URL}/${appName}/map-tiles/${mapName}/opengraph-image.jpg`;
}

// Helper to conditionally apply unstable_cache if available (Next.js), otherwise return the function as-is
function conditionalCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keys: string[],
  options: { revalidate: number },
): T {
  if (unstable_cache) {
    return unstable_cache(fn, keys, options) as T;
  }
  // In non-Next.js environments (Vite), just return the function without caching
  return fn;
}

export const fetchVersion = conditionalCache(
  async (appName: string): Promise<Version> => {
    const res = await fetch(getAppUrl(appName, "/version.json"));
    return res.json();
  },
  ["version"],
  {
    revalidate: 60,
  },
);

// Cache for version lookup maps to avoid recreating them on each call
const versionCacheMap = new WeakMap<
  Version,
  {
    tileKeys: Set<string>;
    filterValueIds: Set<string>;
    filterGroupIds: Set<string>;
  }
>();

// Separate cache for dict reverse lookup (keyed by dict object reference)
const dictCacheMap = new WeakMap<
  Record<string, string>,
  Map<string, string[]>
>();

function getVersionLookupCache(version: Version) {
  let cache = versionCacheMap.get(version);

  if (!cache) {
    // Build set of valid tile keys
    const tileKeys = new Set(Object.keys(version.data.tiles));

    // Build set of valid filter value IDs
    const filterValueIds = new Set<string>();
    const filterGroupIds = new Set<string>();
    for (const filter of version.data.filters) {
      filterGroupIds.add(filter.group);
      for (const value of filter.values) {
        filterValueIds.add(value.id);
      }
    }

    cache = { tileKeys, filterValueIds, filterGroupIds };
    versionCacheMap.set(version, cache);
  }

  return cache;
}

function getReverseDictMap(
  dict: Record<string, string>,
): Map<string, string[]> {
  let reverseDictMap = dictCacheMap.get(dict);

  if (!reverseDictMap) {
    // Build reverse dictionary map (value -> keys[])
    // Resolve pointer values (e.g. "@other_key" -> dict["@other_key"])
    reverseDictMap = new Map<string, string[]>();
    for (const [key, value] of Object.entries(dict)) {
      const resolved =
        value && value[0] === "@" ? (dict[value] ?? value) : value;
      const existing = reverseDictMap.get(resolved) || [];
      existing.push(key);
      reverseDictMap.set(resolved, existing);
    }
    dictCacheMap.set(dict, reverseDictMap);
  }

  return reverseDictMap;
}

export function getMapNameFromVersion(
  version: Version,
  map: string,
  dict: Record<string, string>,
): string | null {
  const decodedMap = decodeURIComponent(map);
  const { tileKeys } = getVersionLookupCache(version);
  const reverseDictMap = getReverseDictMap(dict);

  const possibleKeys = reverseDictMap.get(decodedMap);
  if (!possibleKeys) return null;
  // Find first key that exists in tiles
  for (const key of possibleKeys) {
    if (key[0] === "@") {
      const resolvedKeys = reverseDictMap.get(key);
      if (!resolvedKeys) continue;

      for (const resolvedKey of resolvedKeys) {
        if (tileKeys.has(resolvedKey)) {
          return resolvedKey;
        }
      }
    } else if (tileKeys.has(key)) {
      return key;
    }
  }

  return null;
}

export function getTypeFromVersion(
  version: Version,
  type: string,
  dict: Record<string, string>,
): string | null {
  const decodedType = decodeURIComponent(type);
  const { filterValueIds } = getVersionLookupCache(version);
  const reverseDictMap = getReverseDictMap(dict);

  const possibleKeys = reverseDictMap.get(decodedType);
  if (!possibleKeys) return null;

  // Find first key that exists in filter values
  for (const key of possibleKeys) {
    if (filterValueIds.has(key)) {
      return key;
    }
  }

  return null;
}

/** Return ALL filter value IDs that translate to the same English name */
export function getAllTypesFromVersion(
  version: Version,
  type: string,
  dict: Record<string, string>,
): string[] {
  const decodedType = decodeURIComponent(type);
  const { filterValueIds } = getVersionLookupCache(version);
  const reverseDictMap = getReverseDictMap(dict);

  const possibleKeys = reverseDictMap.get(decodedType);
  if (!possibleKeys) return [];

  return possibleKeys.filter((key) => filterValueIds.has(key));
}

export function getGroupFromVersion(
  version: Version,
  group: string,
  dict: Record<string, string>,
): string | null {
  const decodedGroup = decodeURIComponent(group);
  const { filterGroupIds } = getVersionLookupCache(version);
  const reverseDictMap = getReverseDictMap(dict);

  const possibleKeys = reverseDictMap.get(decodedGroup);
  if (!possibleKeys) return null;

  // Find first key that exists in filter groups
  for (const key of possibleKeys) {
    if (filterGroupIds.has(key)) {
      return key;
    }
  }

  return null;
}

export function getIconsUrl(
  appName: string,
  icon: string,
  iconPath?: string,
): string {
  if (icon.startsWith("/global_icons/game-icons")) {
    return `${DATA_FORGE_CDN_URL}${icon.replace("/global_icons", "")}`;
  }
  if (icon.includes("global_icons")) {
    return icon;
  }
  if ((icon === "icons.webp" || icon === "/icons/icons.webp") && iconPath) {
    return getAppUrl(appName, iconPath);
  }
  if (icon.startsWith("/")) {
    return getAppUrl(appName, icon);
  }
  return getAppUrl(appName, `/icons/${icon}`);
}

export const fetchDict = conditionalCache(
  async (
    appName: string,
    locale: string = "en",
  ): Promise<Record<string, string>> => {
    const res = await fetch(
      `${DATA_FORGE_CDN_URL}/${appName}/dicts/${locale}.json`,
    );
    if (!res.ok) {
      throw new Error(
        `Failed to fetch dict ${appName}/${locale}: ${res.status}`,
      );
    }
    return res.json();
  },
  ["dict"],
  {
    revalidate: 60,
  },
);

export const fetchDatabase = conditionalCache(
  async (appName: string): Promise<DatabaseConfig> => {
    const res = await fetch(
      `${DATA_FORGE_CDN_URL}/${appName}/config/database.json`,
    );
    return res.json();
  },
  ["database"],
  {
    revalidate: 60,
  },
);

export const fetchTiles = conditionalCache(
  async (appName: string): Promise<TilesConfig> => {
    const res = await fetch(
      `${DATA_FORGE_CDN_URL}/${appName}/config/tiles.json`,
    );
    return res.json();
  },
  ["tiles"],
  {
    revalidate: 60,
  },
);

export type GlobalFiltersConfig = Array<{
  group: string;
  values: Array<{
    id: string;
    defaultOn?: boolean;
  }>;
}>;

export type DrawingsConfig = {
  name: string;
  isShared?: boolean;
  url?: string;
  nodes?: PrivateNode[];
  drawing?: Drawing;
}[];

export type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Icon = string | IconSprite;
export type DatabaseConfig<T = Record<string, any>> = {
  type: string;
  items: {
    id: string;
    icon?: Icon;
    props: T;
    groupId?: string;
  }[];
}[];

export type FiltersConfig = {
  group: string;
  category?: string;
  defaultOpen?: boolean;
  defaultOn?: boolean;
  values: {
    id: string;
    icon:
      | string
      | {
          name: string;
          url: string;
          x: number;
          y: number;
          width: number;
          height: number;
        };
    size?: number;
    sort?: number;
    live_only?: boolean;
    autoDiscover?: boolean;
    defaultOn?: boolean;
  }[];
}[];

export type RegionsConfig = Region[];

export type TileLayer = {
  url?: string;
  defaultTitle?: string;
  options?: {
    minNativeZoom: number;
    maxNativeZoom: number;
    bounds: [[number, number], [number, number]];
    tileSize: number;
    threshold?: number;
  };
  minZoom?: number;
  maxZoom?: number;
  fitBounds?: [[number, number], [number, number]];
  view?: { center?: [number, number]; zoom?: number };
  transformation?: [number, number, number, number];
  threshold?: number;
  rotation?: {
    center: [number, number];
    angle: number;
  };
};
export type TilesConfig = Record<string, TileLayer>;
