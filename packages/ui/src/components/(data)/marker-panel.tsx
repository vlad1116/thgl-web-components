"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  API_FORGE_URL,
  cn,
  useAccountStore,
  useGameState,
  useSettingsStore,
  useUserStore,
} from "@repo/lib";
import { useCoordinates, useT } from "../(providers)";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Button } from "../(controls)";
import {
  Copy,
  Eye,
  EyeOff,
  MessageCircle,
  Navigation,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { AdditionalTooltip, AdditionalTooltipType } from "../(content)";
import { Comments } from "./comments";
import Markdown from "markdown-to-jsx";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

function formatCoordinates(
  coords: [number, number] | [number, number, number],
  format?: string,
): string {
  if (format) {
    return format
      .replace("{x}", coords[1].toFixed(0))
      .replace("{y}", coords[0].toFixed(0))
      .replace("{z}", coords[2]?.toFixed(0) ?? "");
  }
  return coords[2] !== undefined
    ? `${coords[1].toFixed(0)}, ${coords[0].toFixed(0)}, ${coords[2].toFixed(0)}`
    : `${coords[1].toFixed(0)}, ${coords[0].toFixed(0)}`;
}

function copyToClipboard(text: string): void {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

function DiscoveryToggle({ id }: { id: string }) {
  const isDiscovered = useSettingsStore((state) => state.isDiscoveredNode)(id);
  const toggle = useSettingsStore((state) => state.toggleDiscoveredNode);

  return (
    <Tooltip delayDuration={400}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors w-full",
            isDiscovered
              ? "bg-primary/15 text-primary hover:bg-primary/25"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
          )}
          onClick={() => toggle(id)}
          onContextMenu={(e) => {
            e.preventDefault();
            toggle(id);
          }}
        >
          {isDiscovered ? (
            <Eye className="w-4 h-4 shrink-0" />
          ) : (
            <EyeOff className="w-4 h-4 shrink-0" />
          )}
          <span>{isDiscovered ? "Discovered" : "Not discovered"}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-[200px] text-xs">
        <p>Right-click to toggle. Discovered nodes can be hidden in settings.</p>
      </TooltipContent>
    </Tooltip>
  );
}

function PrivateNodeActions({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const setTempPrivateNode = useSettingsStore(
    (state) => state.setTempPrivateNode,
  );
  const removeMyNode = useSettingsStore((state) => state.removeMyNode);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="flex-1 gap-1.5"
        onClick={() => {
          const myFilter = useSettingsStore
            .getState()
            .myFilters.find((filter) =>
              filter.nodes?.some(
                (node) =>
                  `${node.id ?? filter.name}@${node.p[0]}:${node.p[1]}` === id,
              ),
            );
          const privateNode = myFilter?.nodes?.find(
            (node) =>
              `${node.id ?? myFilter.name}@${node.p[0]}:${node.p[1]}` === id,
          );
          if (!myFilter || !privateNode) return;
          setTempPrivateNode({
            ...privateNode,
            filter: myFilter.name,
          });
          onClose();
        }}
      >
        <Pencil className="w-3.5 h-3.5" />
        Edit
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className="flex-1 gap-1.5"
        onClick={() => {
          removeMyNode(id.split("@")[0]);
          onClose();
        }}
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </Button>
    </div>
  );
}

export function MarkerPanel({
  appName,
  hideComments,
  additionalTooltip,
  coordinateCopyFormat,
  headerOffset = "54px",
}: {
  appName: string;
  hideComments?: boolean;
  additionalTooltip?: AdditionalTooltipType;
  coordinateCopyFormat?: string;
  headerOffset?: string;
}) {
  const t = useT();
  const { spawns, filters } = useCoordinates();
  const selectedNodeId = useUserStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useUserStore((state) => state.setSelectedNodeId);
  const player = useGameState((state) => state.player);

  // Track previous ID for slide animation
  const [visible, setVisible] = useState(false);
  const prevIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedNodeId) {
      // Small delay for slide-in animation
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
    prevIdRef.current = selectedNodeId;
  }, [selectedNodeId]);

  // Find the spawn data
  const spawn = useMemo(() => {
    if (!selectedNodeId) return null;
    for (const s of spawns) {
      const spawnId = s.id?.includes("@")
        ? s.id
        : `${s.id || s.type}@${s.p[0]}:${s.p[1]}`;
      if (spawnId === selectedNodeId) return s;
      if (s.cluster) {
        for (const c of s.cluster) {
          const clusterId = c.id?.includes("@")
            ? c.id
            : `${c.id || c.type}@${c.p[0]}:${c.p[1]}`;
          if (clusterId === selectedNodeId) return c;
        }
      }
    }
    return null;
  }, [selectedNodeId, spawns]);

  const distance = useMemo(
    () =>
      player && spawn
        ? Math.sqrt(
            Math.pow(player.x - spawn.p[0], 2) +
              Math.pow(player.y - spawn.p[1], 2) +
              Math.pow(
                player.z - (spawn.p.length === 3 ? spawn.p[2] : player.z),
                2,
              ),
          )
        : undefined,
    [player, spawn],
  );

  const filter = spawn
    ? filters.find((f) => f.values.some((v) => v.id === spawn.type))
    : null;

  const termId = spawn
    ? (spawn.name ?? spawn.id ?? spawn.type).replace(/my_\d+_/, "")
    : "";

  const nodeId = spawn
    ? spawn.id?.includes("@")
      ? spawn.id
      : `${spawn.id || spawn.type}@${spawn.p[0]}:${spawn.p[1]}`
    : "";

  const desc = useMemo(() => {
    if (!spawn) return "";
    if (spawn.description) return spawn.description.replace("\n", "<br>");
    if (termId) return t(termId, { isDesc: true, fallback: "" });
    return "";
  }, [spawn, termId, t]);

  const close = () => setSelectedNodeId(null);

  if (!selectedNodeId) return null;

  const panelContent = (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0">
        <button
          type="button"
          className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors shrink-0"
          onClick={close}
        >
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-semibold truncate grow">
          {spawn ? t(termId || spawn.type, { fallback: spawn.type }) : "Loading..."}
        </h2>
        {spawn && (
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium leading-none shrink-0">
            {t(spawn.type, { fallback: spawn.type })}
          </span>
        )}
      </div>

      {spawn ? (
        <ScrollArea className="flex-1" type="auto">
          <div className="p-3 space-y-3">
            {/* Metadata */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1">
                {formatCoordinates(spawn.p, coordinateCopyFormat)}
                <button
                  type="button"
                  className="h-4 w-4 p-0.5 rounded hover:bg-muted hover:text-foreground transition-colors"
                  onClick={() => {
                    copyToClipboard(formatCoordinates(spawn.p, coordinateCopyFormat));
                    toast("Copied to clipboard");
                  }}
                >
                  <Copy className="w-full h-full" />
                </button>
              </span>
              {distance != null && (
                <>
                  <span className="opacity-30">|</span>
                  <span className="inline-flex items-center gap-0.5">
                    <Navigation className="w-3 h-3" />
                    {distance.toFixed(0)}
                  </span>
                </>
              )}
              {filter?.group && (
                <>
                  <span className="opacity-30">|</span>
                  <span>{t(filter.group, { fallback: filter.group })}</span>
                </>
              )}
            </div>

            {/* Additional game-specific data */}
            {additionalTooltip && (
              <div className="text-xs text-muted-foreground">
                <AdditionalTooltip items={additionalTooltip} latLng={spawn.p} />
              </div>
            )}

            {/* Description */}
            {desc && (
              <>
                <Separator />
                <div className="text-sm leading-relaxed">
                  <Markdown options={{ forceBlock: false }}>{desc}</Markdown>
                </div>
              </>
            )}

            {/* Discovery */}
            <Separator />
            <DiscoveryToggle id={nodeId} />

            {/* Private node actions */}
            {spawn.isPrivate && (
              <>
                <Separator />
                <PrivateNodeActions id={nodeId} onClose={close} />
              </>
            )}

            {/* Comments */}
            {!hideComments && !spawn.isPrivate && !spawn.address && (
              <>
                <Separator />
                <Comments id={nodeId} appName={appName} />
              </>
            )}
          </div>
        </ScrollArea>
      ) : (
        <div className="p-3 text-sm text-muted-foreground">
          Node not found
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop: right side panel */}
      <div
        className={cn(
          "hidden md:flex flex-col fixed right-0 z-[500] w-[360px] bg-card border-l shadow-lg pointer-events-auto",
          "transition-transform duration-200 ease-out",
          visible ? "translate-x-0" : "translate-x-full",
        )}
        style={{
          top: headerOffset,
          height: `calc(100dvh - ${headerOffset})`,
        }}
      >
        {panelContent}
      </div>

      {/* Mobile: bottom sheet */}
      <div
        className={cn(
          "md:hidden fixed inset-x-0 bottom-0 z-[500] bg-card border-t rounded-t-xl shadow-lg pointer-events-auto",
          "transition-transform duration-200 ease-out",
          visible ? "translate-y-0" : "translate-y-full",
        )}
        style={{
          maxHeight: "70dvh",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex flex-col overflow-hidden" style={{ maxHeight: "calc(70dvh - 20px)" }}>
          {panelContent}
        </div>
      </div>
    </>
  );
}
