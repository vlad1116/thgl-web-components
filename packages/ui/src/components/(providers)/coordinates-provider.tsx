"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

// Proximity threshold for matching actors to static spawns (in game units)
const PROXIMITY_THRESHOLD = 1;

// Helper: construct node ID for discovery/tracking
const getNodeId = (
  spawnId: string | undefined,
  typeId: string,
  x: number,
  y: number,
): string => {
  return spawnId?.includes("@") ? spawnId : `${spawnId || typeId}@${x}:${y}`;
};

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

  // User-created custom markers (from myFilters)
  const customNodes = useMemo<NodesCoordinates>(() => {
    if (!isHydrated) {
      return [] as NodesCoordinates;
    }
    return myFilters.reduce<NodesCoordinates>((acc, myFilter) => {
      myFilter.nodes?.forEach((node) => {
        const nodeMapName = node.mapName;
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
            icon: node.icon,
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
                icon: node.icon,
                radius: node.radius,
                isPrivate: true,
              },
            ],
          });
        }
      });
      return acc;
    }, []);
  }, [isHydrated, myFilters]);

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

  const nodes = useMemo<NodesCoordinates>(() => {
    if (!isHydrated || !staticNodes) {
      return emptyArray as NodesCoordinates;
    }
    if (!liveMode || !typesIdMap || Object.keys(typesIdMap).length === 0) {
      return customNodes.concat(staticNodes);
    }
    const debug = isDebug();

    // Create lookup map for staticNodes to avoid repeated find() calls
    const staticNodesMap = new Map<string, NodesCoordinates[number]>();
    for (const node of staticNodes) {
      const key = `${node.type}::${node.mapName ?? ""}`;
      staticNodesMap.set(key, node);
    }

    const actorNodes: NodesCoordinates = [];
    const actorCategoriesByType = new Map<string, NodesCoordinates[number]>();
    actorLoop: for (const actor of actors) {
      let id = typesIdMap[actor.type];
      if (!id || actor.hidden) {
        if (!debug) continue;
        id = actor.type;
      }

      const mapName = actor.mapName;
      // Use map lookup instead of find() for O(1) access
      const staticNode = staticNodesMap.get(`${id}::${mapName ?? ""}`);

      let spawnToAdd: Spawn | null = null;

      // Check if actor matches a known spawn location
      if (staticNode && staticNode.spawns.length && !debug) {
        for (let i = 0; i < staticNode.spawns.length; i++) {
          const spawn = staticNode.spawns[i];
          const dx = spawn.p[0] - actor.x;
          const dy = spawn.p[1] - actor.y;
          if (
            dx > -PROXIMITY_THRESHOLD &&
            dx < PROXIMITY_THRESHOLD &&
            dy > -PROXIMITY_THRESHOLD &&
            dy < PROXIMITY_THRESHOLD
          ) {
            if (staticNode.static) {
              // Permanent node: skip actor entirely (already in realStaticNodes)
              continue actorLoop;
            }
            // Dynamic node: replace actor with spawn data (for metadata like id, description)
            spawnToAdd = {
              id: getNodeId(spawn.id, id, spawn.p[0], spawn.p[1]),
              ...spawn,
              address: actor.address, // Keep actor address for live tracking
            } as Spawn;
            break;
          }
        }
      }

      // If we didn't find a matching spawn, create one from the actor
      if (!spawnToAdd) {
        spawnToAdd = {
          id: `${id}@${actor.x}:${actor.y}`,
          address: actor.address,
          p: actor.z != null ? [actor.x, actor.y, actor.z] : [actor.x, actor.y],
        } as Spawn;
      }

      const key = `${id}::${mapName ?? ""}`;
      let category = actorCategoriesByType.get(key);

      if (!category) {
        category = {
          type: id,
          mapName: mapName,
          spawns: [],
        };
        actorCategoriesByType.set(key, category);
        actorNodes.push(category);
      }

      category.spawns.push(spawnToAdd);
    }

    if (debug) {
      return customNodes.concat(actorNodes);
    }

    return customNodes.concat(realStaticNodes, actorNodes);
  }, [isHydrated, liveMode, actors, customNodes, staticNodes]);

  useEffect(() => {
    if (!typesIdMap) {
      return;
    }
    const { setDiscoverNode, isDiscoveredNode } = useSettingsStore.getState();

    // Create lookup structures for O(1) access
    const filterValues = filters.flatMap((filter) => filter.values);
    const autoDiscoverSet = new Set(
      filterValues.filter((f) => f.autoDiscover).map((f) => f.id),
    );
    const staticNodesMap = new Map<string, NodesCoordinates[number]>();
    for (const node of staticNodes) {
      const key = `${node.type}::${node.mapName ?? ""}`;
      staticNodesMap.set(key, node);
    }

    actors.forEach((actor) => {
      if (typeof actor.hidden === "undefined") {
        return;
      }
      const id = typesIdMap[actor.type];
      if (!id || !autoDiscoverSet.has(id)) {
        return;
      }

      // Use map lookup instead of find() for O(1) access
      const staticNode = staticNodesMap.get(`${id}::${actor.mapName ?? ""}`);
      if (staticNode) {
        const spawn = staticNode.spawns.find((spawn) => {
          const dx = spawn.p[0] - actor.x;
          const dy = spawn.p[1] - actor.y;
          return (
            dx > -PROXIMITY_THRESHOLD &&
            dx < PROXIMITY_THRESHOLD &&
            dy > -PROXIMITY_THRESHOLD &&
            dy < PROXIMITY_THRESHOLD
          );
        });
        if (spawn) {
          const nodeId = getNodeId(
            spawn.id,
            staticNode.type,
            spawn.p[0],
            spawn.p[1],
          );
          if (isDiscoveredNode(nodeId) !== actor.hidden) {
            setDiscoverNode(nodeId, actor.hidden);
          }
          return;
        }
      }
      const nodeId = getNodeId(undefined, id, actor.x, actor.y);
      if (isDiscoveredNode(nodeId) !== actor.hidden) {
        setDiscoverNode(nodeId, actor.hidden);
      }
    });
  }, [typesIdMap, actors]);

  const searchIndex = useMemo(() => {
    const nodeSpawns = nodes.flatMap((node) =>
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
  }, [nodes, initialStaticNodes, mapName, t]);

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

  const refreshSpawns = useCallback(
    (state: UserStoreState) => {
      let newSpawns: (Spawns[number] & { score?: number })[] = [];
      // Deduplication map: key = "x:y" coordinates
      const spawnsByCoordinate = new Map<string, Spawn>();
      if (state.search) {
        if (state.search.length < 3) {
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
          const key = `${spawn.p[0]}:${spawn.p[1]}`;
          if (!spawnsByCoordinate.has(key)) {
            spawnsByCoordinate.set(key, { ...spawn, cluster: [] });
          } else {
            spawnsByCoordinate.get(key)!.cluster!.push(spawn);
          }
        });
      } else {
        const debug = isDebug();

        nodes.forEach((node) => {
          if (node.mapName && node.mapName !== state.mapName) {
            return;
          }
          if (!state.filters.includes(node.type) && !debug) {
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
            const key = `${spawn.p[0]}:${spawn.p[1]}`;
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
    [nodes, searchIndex, publicSearchSpawns],
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

    return () => {
      unsubscribeFilters();
      unsubscribeSearch();
      unsubscribeGlobalFilters();
      unsubscribeMapName();
    };
  }, [isHydrated, refreshSpawns, mapName]);

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
