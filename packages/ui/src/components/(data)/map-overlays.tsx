"use client";
import { useMapStore } from "../(interactive-map)/store";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { cn, useUserStore } from "@repo/lib";
import {
  ZoneOverlayLayer,
  DrawingLayer,
  type DrawingShape,
} from "@repo/lib/web-map";
import {
  ChevronRight,
  FoldVertical,
  Layers,
  UnfoldVertical,
} from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useT } from "../(providers)";
import useSWRImmutable from "swr/immutable";

interface ZoneEntry {
  values: number[];
  name: string;
  desc?: string;
  centers?: [number, number][];
}

interface ZoneLayer {
  group: string;
  bitmap: string;
  zones: ZoneEntry[];
}

interface OverlayConfig {
  mapName: string;
  bounds: [[number, number], [number, number]];
  layers: ZoneLayer[];
}

export interface MapOverlaysProps {
  configUrl: string;
  basePath: string;
}

/** Golden-angle HSL color for a zone value — matches data-mining zoneRGBA */
function zoneColor(val: number): [number, number, number, number] {
  const hue = ((val * 137.508) % 360) / 360;
  const sat = (65 + ((val * 7) % 20)) / 100;
  const lit = (45 + ((val * 11) % 15)) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = lit < 0.5 ? lit * (1 + sat) : lit + sat - lit * sat;
  const p = 2 * lit - q;
  return [
    Math.round(hue2rgb(p, q, hue + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, hue) * 255),
    Math.round(hue2rgb(p, q, hue - 1 / 3) * 255),
    180,
  ];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/** Pure UI for a single group */
function OverlayGroupUI({
  layer,
  activeCount,
  onToggleAll,
}: {
  layer: ZoneLayer;
  activeCount: number;
  onToggleAll: () => void;
}) {
  const [open, setOpen] = useState(false);
  const filters = useUserStore((state) => state.filters);
  const setFilters = useUserStore((state) => state.setFilters);
  const t = useT();
  const ratio = layer.zones.length > 0 ? activeCount / layer.zones.length : 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "group flex items-center transition-colors w-full px-1.5",
          { "text-muted-foreground": !activeCount },
        )}
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1 text-left transition-colors hover:text-primary py-1 px-0.5 truncate grow min-w-0",
              { "text-muted-foreground": !activeCount },
            )}
            type="button"
          >
            <ChevronRight
              className={cn(
                "h-3 w-3 shrink-0 transition-transform duration-200",
                open && "rotate-90",
              )}
            />
            <span className="font-semibold truncate">
              {t(layer.group) || layer.group}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
              {activeCount}/{layer.zones.length}
            </span>
          </button>
        </CollapsibleTrigger>
        <button
          className="text-[10px] text-muted-foreground hover:text-primary px-1.5 py-1 transition-colors shrink-0 uppercase tracking-wide"
          onClick={onToggleAll}
          type="button"
          title={activeCount ? "Disable all" : "Enable all"}
        >
          {activeCount ? "None" : "All"}
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-[2px] bg-muted/20 mx-1.5 overflow-hidden rounded-full">
        <div
          className="h-full bg-primary/50 transition-all duration-300 rounded-full"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <CollapsibleContent>
        <div className="flex flex-col">
          {layer.zones.map((zone) => {
            const filterName = `${layer.group}: ${zone.name}`;
            const isActive = filters.includes(filterName);
            const btn = (
              <button
                key={zone.values[0]}
                className={cn(
                  "flex items-center gap-2 transition-colors hover:text-primary py-0.5 pl-7 pr-2.5 text-sm truncate",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
                onClick={() => {
                  const newFilters = isActive
                    ? filters.filter((f) => f !== filterName)
                    : [...filters, filterName];
                  setFilters(newFilters);
                }}
                type="button"
              >
                <span className="truncate">{t(zone.name) || zone.name}</span>
              </button>
            );
            if (zone.desc) {
              const descText = t(`${zone.desc}_desc`) || zone.desc;
              return (
                <Tooltip
                  key={zone.values[0]}
                  delayDuration={300}
                  disableHoverableContent
                >
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[300px]">
                    <p className="font-semibold">{t(zone.name) || zone.name}</p>
                    <p className="text-xs text-muted-foreground">{descText}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
            return btn;
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function MapOverlays({ configUrl, basePath }: MapOverlaysProps) {
  const [open, setOpen] = useState(false);
  const map = useMapStore((state) => state.map);
  const filters = useUserStore((state) => state.filters);
  const setFilters = useUserStore((state) => state.setFilters);
  const t = useT();

  const { data: config } = useSWRImmutable<OverlayConfig>(configUrl, fetcher);
  const zoneLayersRef = useRef<Map<string, ZoneOverlayLayer>>(new Map());
  const addedRef = useRef<Set<string>>(new Set());
  const drawingLayerRef = useRef<DrawingLayer | null>(null);

  // Per-group active state
  const layerStates = useMemo(() => {
    if (!config) return [];
    return config.layers.map((layer) => {
      const itemNames = layer.zones.map((z) => `${layer.group}: ${z.name}`);
      const activeZones = layer.zones.filter((z) =>
        filters.includes(`${layer.group}: ${z.name}`),
      );
      return { layer, itemNames, activeZones };
    });
  }, [config, filters]);

  const allActiveItems = useMemo(
    () =>
      layerStates.flatMap(({ layer, activeZones }) =>
        activeZones.map((z) => `${layer.group}: ${z.name}`),
      ),
    [layerStates],
  );

  // Sync ZoneOverlayLayers with map
  useEffect(() => {
    if (!map || !config || map.mapName !== config.mapName) return;

    const zoneLayers = zoneLayersRef.current;
    const added = addedRef.current;

    for (const { layer, activeZones } of layerStates) {
      const hasActive = activeZones.length > 0;

      if (!zoneLayers.has(layer.group)) {
        const zl = new ZoneOverlayLayer({
          url: `${basePath}/${layer.bitmap}`,
          bounds: config.bounds,
        });
        zoneLayers.set(layer.group, zl);
      }

      const zl = zoneLayers.get(layer.group)!;

      if (hasActive && !added.has(layer.group)) {
        map.addLayer(zl, { zIndex: 20 });
        added.add(layer.group);
      } else if (!hasActive && added.has(layer.group)) {
        map.removeLayer(zl);
        added.delete(layer.group);
      }

      zl.clearAll();
      if (hasActive) {
        const toSet: {
          value: number;
          color: [number, number, number, number];
        }[] = [];
        for (const z of activeZones) {
          const color = zoneColor(z.values[0]);
          for (const v of z.values) {
            toSet.push({ value: v, color });
          }
        }
        zl.setZones(toSet);
      }
    }

    return () => {
      for (const [group] of zoneLayers) {
        if (added.has(group)) {
          const zl = zoneLayers.get(group);
          if (zl) map.removeLayer(zl);
        }
      }
      added.clear();
    };
  }, [map, config, filters]);

  // Labels
  useEffect(() => {
    if (!map || !config || map.mapName !== config.mapName) return;

    if (drawingLayerRef.current) {
      map.removeLayer(drawingLayerRef.current);
      drawingLayerRef.current = null;
    }

    const labelsData: { name: string; center: [number, number] }[] = [];
    for (const { activeZones } of layerStates) {
      for (const z of activeZones) {
        if (z.centers) {
          for (const c of z.centers) {
            labelsData.push({ name: t(z.name) || z.name, center: c });
          }
        }
      }
    }
    if (labelsData.length === 0) return;

    const dl = new DrawingLayer({ interactive: false });
    map.addLayer(dl, { zIndex: 25 });
    let idx = 0;
    for (const { name, center } of labelsData) {
      dl.addShape({
        id: `overlay_label_${idx++}`,
        type: "text",
        center,
        text: name,
        color: "#ffffffcc",
        size: 11,
        mapName: config.mapName,
      } as DrawingShape);
    }
    drawingLayerRef.current = dl;

    return () => {
      if (drawingLayerRef.current) {
        map.removeLayer(drawingLayerRef.current);
        drawingLayerRef.current = null;
      }
    };
  }, [map, config, allActiveItems.join(",")]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      zoneLayersRef.current.clear();
      addedRef.current.clear();
    };
  }, []);

  if (!map) return <Skeleton className="h-7 w-full" />;
  if (!config) return null;
  if (map.mapName !== config.mapName) return null;

  const totalActive = allActiveItems.length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center transition-colors w-full px-1.5">
        <CollapsibleTrigger asChild>
          <button
            className="text-left transition-colors p-1 pr-2 truncate grow flex items-center justify-between"
            type="button"
          >
            <span
              className={cn(
                "font-semibold flex items-center gap-1.5",
                totalActive > 0 && "text-primary",
              )}
            >
              <Layers className="h-4 w-4" />
              Zone Overlays
              {!open && totalActive > 0 && (
                <span className="text-[10px] font-normal opacity-60">
                  ({totalActive})
                </span>
              )}
            </span>
            {open ? (
              <FoldVertical className="h-4 w-4" />
            ) : (
              <UnfoldVertical className="h-4 w-4" />
            )}
          </button>
        </CollapsibleTrigger>
      </div>
      {open && (
        <div>
          {layerStates.map(({ layer, itemNames, activeZones }) => (
            <OverlayGroupUI
              key={layer.group}
              layer={layer}
              activeCount={activeZones.length}
              onToggleAll={() => {
                const hasActive = activeZones.length > 0;
                const newFilters = hasActive
                  ? filters.filter((f) => !itemNames.includes(f))
                  : [...new Set([...filters, ...itemNames])];
                setFilters(newFilters);
              }}
            />
          ))}
        </div>
      )}
    </Collapsible>
  );
}
