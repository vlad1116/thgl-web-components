"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Fuse from "fuse.js";
import { useI18n } from ".";
import {
  decodeFromBuffer,
  isDebug,
  useGameState,
  useSettingsStore,
  Region,
  DrawingsAndNodes,
  FiltersConfig,
  getAppUrl,
  initUserStore,
  useUserStore,
  UserStoreState,
  searchParamsToView,
  GlobalFiltersConfig,
  Spawn,
  getApiUrl,
} from "@repo/lib";
import { CaseSensitive, Hexagon } from "lucide-react";
import {
  buildActorNodes,
  buildSpawnGrid,
  type DiscoveryUpdate,
} from "./actor-node-builder";
import useSWRImmutable from "swr/immutable";
import { toast } from "sonner";

export type NodesCoordinates = {
  type: string;
  static?: boolean;
  mapName?: string;
  spawns: (Omit<Spawn, "type" | "id"> & { id?: string })[];
  data?: Record<string, string[]>;
}[];
export type Spawns = Spawn[];

export type Icons = Map<
  string,
  {
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
    live_only?: boolean;
    autoDiscover?: boolean;
    defaultOn?: boolean;
  }
>;

interface ContextValue {
  isHydrated: boolean;
  nodes: NodesCoordinates;
  staticDrawings?: DrawingsAndNodes[];
  regions: Region[];
  filters: FiltersConfig;
  globalFilters: GlobalFiltersConfig;
  allFilters: string[];
  spawns: Spawns;
  icons: Icons;
  typesIdMap?: Record<string, string>;
}

const Context = createContext<ContextValue | null>(null);

export const REGION_FILTERS = [
  {
    id: "region_borders",
    Icon: Hexagon,
  },
  {
    id: "region_names",
    Icon: CaseSensitive,
  },
];
const emptyArray: any[] = [];
const emptyObject: any = {};

export function CoordinatesProvider({
  children,
  staticNodes: initialStaticNodes,
  staticDrawings,
  useCbor,
  regions,
  filters,
  globalFilters = [],
  typesIdMap,
  mapNames = ["default"],
  appName,
  nodesPaths,
  map,
  clusterPrecision = 0,
}: {
  children: React.ReactNode;
  staticNodes?: NodesCoordinates;
  staticDrawings?: DrawingsAndNodes[];
  useCbor?: boolean;
  regions: Region[];
  filters: FiltersConfig;
  globalFilters?: GlobalFiltersConfig;
  typesIdMap?: Record<string, string>;
  mapNames: string[];
  appName: string;
  nodesPaths: Record<string, string>;
  map?: string;
  clusterPrecision?: number;
}): JSX.Element {
  const { t, dict, locale } = useI18n();
  if (!useUserStore) {
    const fIds = Object.values(filters).flatMap((f) =>
      f.values.map((v) => v.id),
    );
    const targetSearchParams: Record<string, string | string[] | undefined> =
      {};
    if (typeof window !== "undefined") {
      // This will throw an hydration error if search params are set (which is fine)
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.forEach((value, key) => {
        targetSearchParams[key] = value;
      });
      const params = window.location.pathname.split("/");
      if (params.length > 2) {
        const termEntry = Object.entries(dict).find(
          ([, value]) => value === decodeURIComponent(params[2]),
        );
        if (termEntry) {
          targetSearchParams.map = termEntry[0];
        }
      }
    }
    const view = searchParamsToView(targetSearchParams, fIds);
    if (map) {
      view.map = map;
    }
    initUserStore(
      view,
      mapNames,
      filters,
      globalFilters,
      REGION_FILTERS,
      staticDrawings,
    );
  }

  const userStoreHasHydrated = useUserStore((state) => state._hasHydrated);
  const search = useUserStore((state) => state.search);
  const settingsHasHydrated = useSettingsStore((state) => state._hasHydrated);
  const isHydrated = userStoreHasHydrated && settingsHasHydrated;
  const mapName = useUserStore((state) => state.mapName);
  const setMapName = useUserStore((state) => state.setMapName);

  useEffect(() => {
    if (map && map !== mapName) {
      setMapName(map);
    }
  }, [map]);

  const { data: staticNodesByMap } = useSWRImmutable(
    mapName ? ["/api/nodes", mapName] : null,
    async () => {
      if (!mapName) {
        return emptyObject as Record<string, NodesCoordinates>;
      }
      if (initialStaticNodes) {
        return {
          [mapName]: initialStaticNodes.filter(
            (node) => !node.mapName || node.mapName === mapName,
          ),
        };
      }
      if (useCbor) {
        const url = getAppUrl(appName, nodesPaths[mapName]);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch static nodes for map "${mapName}": ${response.statusText}`,
          );
        }
        const buffer = await response.arrayBuffer();
        console.log(
          `Fetched buffer for map "${mapName}" with ${buffer.byteLength} bytes, starting with ${new Uint8Array(
            buffer,
          )
            .slice(0, 10)
            .map((b) => +b.toString(16))
            .join(" ")}`,
        );
        const nodes = decodeFromBuffer<NodesCoordinates>(
          new Uint8Array(buffer),
        );
        return { [mapName]: nodes };
      }
      const response = await fetch(`/api/nodes/${mapName}`);
      const nodes = (await response.json()) as NodesCoordinates;
      return { [mapName]: nodes };
    },
    {
      onError: (error) => {
        toast.error(
          `Failed to load static nodes for map "${mapName}". Please try again later.`,
        );
        console.error(
          `Failed to load static nodes for map "${mapName}":`,
          error,
        );
      },
    },
  );

  const staticNodes =
    (mapName && staticNodesByMap?.[mapName]) ||
    (emptyArray as NodesCoordinates);

  const {
    data: publicSearchSpawnsByKeyword,
    isLoading: publicSearchIsLoading,
  } = useSWRImmutable(
    ["/api/search", search],
    async () => {
      if (
        mapNames.length === 1 ||
        !userStoreHasHydrated ||
        !search ||
        initialStaticNodes ||
        search.length < 3
      ) {
        return { [search]: emptyArray as Spawns };
      }
      const url = getApiUrl(appName, `q=${search}&locale=${locale}`);
      const response = await fetch(url);
      if (useCbor) {
        const buffer = await response.arrayBuffer();
        const spawns = decodeFromBuffer<Spawns>(new Uint8Array(buffer));
        return { [search]: spawns };
      }
      const spawns = (await response.json()) as Spawns;
      return { [search]: spawns };
    },
    {
      revalidateOnMount: !search,
      onError: (error) => {
        toast.error(
          `Failed to load public search spawns for "${search}". Please try again later.`,
        );
        console.error(
          `Failed to load public search spawns for "${search}":`,
          error,
        );
      },
    },
  );
  const publicSearchSpawns = publicSearchSpawnsByKeyword?.[search];

  useEffect(() => {
    const state = useUserStore.getState();
    if (state.searchIsLoading !== publicSearchIsLoading) {
      state.setSearchIsLoading(publicSearchIsLoading);
    }
  }, [publicSearchIsLoading]);

  const liveMode = useSettingsStore((state) => state.liveMode);
  const myFilters = useSettingsStore((state) => state.myFilters);
  const actors = useGameState((state) => state.actors);

  // Reverse lookup: translated icon name → current icon coords from filter config.
  // Used to fix stale sprite x,y in old private nodes that lack filterId.
  const iconNameLookup = useMemo(() => {
    const lookup = new Map<string, { x: number; y: number; width: number; height: number; filterId: string }>();
    for (const filter of filters) {
      for (const value of filter.values) {
        if (typeof value.icon !== "string") {
          lookup.set(t(value.id), { ...value.icon, filterId: value.id });
        }
      }
    }
    return lookup;
  }, [filters, t]);

  // User-created custom markers (from myFilters)
  const customNodes = useMemo<NodesCoordinates>(() => {
    if (!isHydrated) {
      return [] as NodesCoordinates;
    }
    return myFilters.reduce<NodesCoordinates>((acc, myFilter) => {
      myFilter.nodes?.forEach((node) => {
        const nodeMapName = node.mapName;
        // Resolve stale sprite coords for old private nodes missing filterId
        let icon = node.icon;
        if (icon && !icon.filterId && icon.name && icon.url?.includes("/icons/")) {
          const current = iconNameLookup.get(icon.name);
          if (current) {
            icon = { ...icon, x: current.x, y: current.y, width: current.width, height: current.height, filterId: current.filterId };
          }
        }
        const category = acc.find(
          (node) => node.type === myFilter.name && node.mapName === nodeMapName,
        );
        if (category) {
          category.spawns.push({
            id: node.id,
            name: node.name,
            description: node.description,
            p: node.p,
            color: node.color,
            icon,
            radius: node.radius,
            isPrivate: true,
          });
        } else {
          acc.push({
            type: myFilter.name,
            mapName: nodeMapName,
            spawns: [
              {
                id: node.id,
                name: node.name,
                description: node.description,
                p: node.p,
                color: node.color,
                icon,
                radius: node.radius,
                isPrivate: true,
              },
            ],
          });
        }
      });
      return acc;
    }, []);
  }, [isHydrated, myFilters, iconNameLookup]);

  const allFilters = useMemo(() => {
    if (!isHydrated) {
      return [];
    }

    return [
      ...filters.flatMap((filter) => filter.values.map((value) => value.id)),
      ...myFilters.map((node) => node.name),
      ...REGION_FILTERS.map((filter) => filter.id),
      ...(staticDrawings?.map((drawing) => drawing.name) ?? []),
    ];
  }, [isHydrated, filters, myFilters]);

  // Filter for permanent nodes (static: true) that always appear on the map
  // vs dynamic nodes (static: false) that appear based on actor state
  const realStaticNodes = useMemo(
    () =>
      staticNodes.filter(
        (node) =>
          ("static" in node && !!node.static) ||
          (typesIdMap && !Object.values(typesIdMap).includes(node.type)),
      ),
    [staticNodes, typesIdMap],
  );

  // Build spatial grid from static nodes (rebuilt only when staticNodes change)
  const { staticNodesMap, spawnGrid, autoDiscoverSet } = useMemo(() => {
    const staticNodesMap = new Map<string, NodesCoordinates[number]>();
    for (const node of staticNodes) {
      const key = `${node.type}::${node.mapName ?? ""}`;
      staticNodesMap.set(key, node);
    }
    const spawnGrid = buildSpawnGrid(staticNodes, staticNodesMap);
    const autoDiscoverSet = new Set(
      filters
        .flatMap((filter) => filter.values)
        .filter((f) => f.autoDiscover)
        .map((f) => f.id),
    );
    return { staticNodesMap, spawnGrid, autoDiscoverSet };
  }, [staticNodes, filters]);

  // Build actor nodes + collect discovery updates in a single pass
  const { nodes, pendingDiscoveryUpdates } = useMemo<{
    nodes: NodesCoordinates;
    pendingDiscoveryUpdates: DiscoveryUpdate[];
  }>(() => {
    if (!isHydrated || !staticNodes) {
      return {
        nodes: emptyArray as NodesCoordinates,
        pendingDiscoveryUpdates: [],
      };
    }
    if (!liveMode || !typesIdMap || Object.keys(typesIdMap).length === 0) {
      return {
        nodes: customNodes.concat(staticNodes),
        pendingDiscoveryUpdates: [],
      };
    }
    const debug = isDebug();
    const { isDiscoveredNode } = useSettingsStore.getState();

    const { actorNodes, discoveryUpdates } = buildActorNodes(
      actors,
      typesIdMap,
      staticNodesMap,
      spawnGrid,
      autoDiscoverSet,
      isDiscoveredNode,
      debug,
    );

    const resultNodes = debug
      ? customNodes.concat(actorNodes)
      : customNodes.concat(realStaticNodes, actorNodes);

    return { nodes: resultNodes, pendingDiscoveryUpdates: discoveryUpdates };
  }, [
    isHydrated,
    liveMode,
    actors,
    customNodes,
    staticNodes,
    staticNodesMap,
    spawnGrid,
    autoDiscoverSet,
    realStaticNodes,
  ]);

  // Apply discovery updates (side effect, runs after render)
  useEffect(() => {
    if (pendingDiscoveryUpdates.length === 0) return;
    const { setDiscoverNode } = useSettingsStore.getState();
    for (const { nodeId, discovered } of pendingDiscoveryUpdates) {
      setDiscoverNode(nodeId, discovered);
    }
  }, [pendingDiscoveryUpdates]);

  // Searchable nodes: static + custom (excludes live actors which change constantly)
  const searchableNodes = useMemo(
    () => customNodes.concat(staticNodes),
    [customNodes, staticNodes],
  );

  // Only rebuild Fuse.js search index when user is actively searching.
  // Depends on searchableNodes (stable) not nodes (includes actors).
  const searchIndex = useMemo(() => {
    if (!search) {
      return null;
    }
    const nodeSpawns = searchableNodes.flatMap((node) =>
      node.spawns.map((spawn) => ({
        id: spawn.id ?? node.type,
        type: node.type,
        data: spawn.data ?? node.data,
        mapName: node.mapName,
        ...spawn,
      })),
    );
    let allSearchableSpawns;

    if (initialStaticNodes) {
      const otherMapSpawns = initialStaticNodes
        .filter((n) => n.mapName && n.mapName !== mapName)
        .flatMap((node) =>
          node.spawns.map((spawn) => ({
            id: spawn.id ?? node.type,
            type: node.type,
            data: spawn.data ?? node.data,
            mapName: node.mapName,
            ...spawn,
          })),
        );
      allSearchableSpawns = [...nodeSpawns, ...otherMapSpawns];
    } else {
      allSearchableSpawns = nodeSpawns;
    }
    return new Fuse(allSearchableSpawns, {
      keys: [
        {
          name: "type",
          getFn: (spawn) => (spawn.isPrivate ? spawn.type : t(spawn.type)),
          weight: 1,
        },
        {
          name: "name",
          getFn: (spawn) =>
            spawn.isPrivate
              ? (spawn.name ?? "")
              : spawn.id
                ? (t(spawn.id) ?? "")
                : "",
          weight: 2,
        },
        {
          name: "tags",
          getFn: (spawn) =>
            t(`${spawn.id ?? spawn.type}_tags`)
              ?.split(",")
              .map((tag) => tag.trim()) ?? [],
          weight: 2,
        },
      ],
      shouldSort: true,
      includeScore: true,
      threshold: 0.3,
    });
  }, [search, searchableNodes, initialStaticNodes, mapName, t]);

  const icons = useMemo(
    () =>
      new Map(
        filters
          .flatMap((filter) => filter.values)
          .map((value) => [value.id, value]),
      ),
    [filters],
  );

  const [spawns, setSpawns] = useState<Spawns>([]);

  // Use ref for nodes to break the dependency chain:
  // actors → nodes → refreshSpawns → useEffect → setSpawns → markers teardown
  // With the ref, refreshSpawns is stable and only re-runs on structural changes.
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  // Structural fingerprint: detects when the SET of spawns changes (new/removed),
  // ignoring position changes (which are handled by live position updates in markers.tsx).
  // Uses type + mapName + spawn count + address sum per category for accurate change detection.
  const nodesFingerprint = useMemo(() => {
    let fp = "";
    for (const node of nodes) {
      let addrSum = 0;
      let posHash = 0;
      let privateHash = "";
      for (const s of node.spawns) {
        addrSum += (s as any).address ?? 0;
        // Include position in fingerprint for live actors so moves trigger refresh
        if ((s as any).address) {
          posHash += s.p[0] * 1000 + s.p[1];
        }
        // Include all editable fields for private nodes so edits trigger refresh
        if (s.isPrivate) {
          privateHash += `${s.name ?? ""}:${s.description ?? ""}:${s.radius ?? ""}:${s.color ?? ""}|`;
        }
      }
      fp += `${node.type}:${node.mapName ?? ""}:${node.spawns.length}:${addrSum}:${posHash}:${privateHash};`;
    }
    return fp;
  }, [nodes]);

  const clusterKey = useCallback(
    (p: number[]) => {
      if (clusterPrecision > 0) {
        const snap = (v: number) =>
          Math.round(v / clusterPrecision) * clusterPrecision;
        return `${snap(p[0])}:${snap(p[1])}`;
      }
      return `${p[0]}:${p[1]}`;
    },
    [clusterPrecision],
  );

  const refreshSpawns = useCallback(
    (state: UserStoreState) => {
      // Read nodes from ref (always latest) instead of closure dependency.
      // This prevents refreshSpawns from being recreated on every nodes change.
      const currentNodes = nodesRef.current;
      let newSpawns: (Spawns[number] & { score?: number })[] = [];
      // Deduplication map: key = "x:y" coordinates (snapped by clusterPrecision)
      const spawnsByCoordinate = new Map<string, Spawn>();
      if (state.search) {
        if (state.search.length < 3 || !searchIndex) {
          setSpawns(newSpawns);
          return;
        }
        newSpawns = searchIndex
          .search(state.search)
          .map((result) => ({ ...result.item, score: result.score }));
        const privateMapName = newSpawns[0]?.mapName;
        if (publicSearchSpawns) {
          newSpawns.push(
            ...publicSearchSpawns
              .filter((n) => n.mapName !== privateMapName)
              .map((spawn) => ({
                ...spawn,
                id: spawn.id ?? spawn.type,
                mapName: spawn.mapName,
                type: spawn.type,
              })),
          );
        }
        newSpawns.forEach((spawn) => {
          const key = clusterKey(spawn.p);
          if (!spawnsByCoordinate.has(key)) {
            spawnsByCoordinate.set(key, { ...spawn, cluster: [] });
          } else {
            spawnsByCoordinate.get(key)!.cluster!.push(spawn);
          }
        });
      } else {
        const debug = isDebug();

        // For including the selected spawn even when its filter is off
        const selectedNodeId = state.selectedNodeId;

        currentNodes.forEach((node) => {
          if (node.mapName && node.mapName !== state.mapName) {
            return;
          }
          const isFilterActive = state.filters.includes(node.type) || debug;
          // If filter is off, only include the specific selected spawn
          if (!isFilterActive && selectedNodeId) {
            const selectedSpawnData = node.spawns.find((s) => {
              const sid = s.id ?? node.type;
              const nodeId = sid.includes("@")
                ? sid
                : `${sid}@${s.p[0]}:${s.p[1]}`;
              return nodeId === selectedNodeId;
            });
            if (selectedSpawnData) {
              const spawn = {
                ...selectedSpawnData,
                id: selectedSpawnData.id ?? node.type,
                mapName: node.mapName,
                type: node.type,
              } as Spawn;
              const key = clusterKey(spawn.p);
              if (!spawnsByCoordinate.has(key)) {
                spawnsByCoordinate.set(key, { ...spawn, cluster: [] });
              } else {
                spawnsByCoordinate.get(key)!.cluster!.push(spawn);
              }
              newSpawns.push(spawn);
            }
            return;
          }
          if (!isFilterActive) {
            return;
          }
          node.spawns.forEach((s) => {
            const spawn = {
              ...s,
              id: s.id ?? node.type,
              mapName: node.mapName,
              type: node.type,
            } as Spawn;
            if (spawn.data) {
              for (const filter of globalFilters) {
                if (spawn.data[filter.group]) {
                  const values = spawn.data[filter.group];
                  if (!values.some((v) => state.globalFilters.includes(v))) {
                    return;
                  }
                }
              }
            }
            const key = clusterKey(spawn.p);
            if (!spawnsByCoordinate.has(key)) {
              spawnsByCoordinate.set(key, { ...spawn, cluster: [] });
            } else {
              spawnsByCoordinate.get(key)!.cluster!.push(spawn);
            }
            newSpawns.push(spawn);
          });
        });
      }

      newSpawns = Array.from(spawnsByCoordinate.values());
      newSpawns.sort((a, b) => {
        // Sort by score if both have scores (search mode)
        if (a.score !== undefined && b.score !== undefined) {
          const scoreDiff = a.score - b.score;
          if (scoreDiff !== 0) {
            return scoreDiff;
          }
        }
        // Sort by mapName as secondary sort
        if (a.mapName && b.mapName) {
          return b.mapName.localeCompare(a.mapName);
        }
        return 0;
      });

      setSpawns(newSpawns);
    },
    [searchIndex, publicSearchSpawns, clusterKey],
  );

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const state = useUserStore.getState();
    refreshSpawns(state);

    const unsubscribeFilters = useUserStore.subscribe(
      (state) => state.filters,
      () => {
        refreshSpawns(useUserStore.getState());
      },
    );
    const unsubscribeSearch = useUserStore.subscribe(
      (state) => state.search,
      () => {
        refreshSpawns(useUserStore.getState());
      },
    );
    const unsubscribeGlobalFilters = useUserStore.subscribe(
      (state) => state.globalFilters,
      () => {
        refreshSpawns(useUserStore.getState());
      },
    );
    const unsubscribeMapName = useUserStore.subscribe(
      (state) => state.mapName,
      () => {
        refreshSpawns(useUserStore.getState());
      },
    );
    const unsubscribeSelectedNode = useUserStore.subscribe(
      (state) => state.selectedNodeId,
      () => {
        refreshSpawns(useUserStore.getState());
      },
    );

    return () => {
      unsubscribeFilters();
      unsubscribeSearch();
      unsubscribeGlobalFilters();
      unsubscribeMapName();
      unsubscribeSelectedNode();
    };
  }, [isHydrated, refreshSpawns, mapName, nodesFingerprint]);

  return (
    <Context.Provider
      value={{
        isHydrated,
        nodes,
        staticDrawings,
        regions,
        allFilters,
        filters,
        spawns,
        icons,
        typesIdMap,
        globalFilters,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export const useCoordinates = (): ContextValue => {
  const value = useContext(Context);

  if (value === null) {
    throw new Error("useCoordinates must be used within a CoordinatesProvider");
  }

  return value;
};
