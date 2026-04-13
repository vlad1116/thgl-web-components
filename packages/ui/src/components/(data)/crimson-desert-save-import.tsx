"use client";

import { useState, useCallback } from "react";
import { DATA_FORGE_CDN_URL, useSettingsStore } from "@repo/lib";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { toast } from "sonner";
import { Upload, FileCheck, Loader2, AlertCircle, Copy } from "lucide-react";

const API_URL = DATA_FORGE_CDN_URL + "/api/crimson-desert/save";

type SaveParseResult = {
  discoveredNodeIds: string[];
  playerPosition: { x: number; y: number; z: number } | null;
  summary: {
    waypoints: number;
    chests: number;
    knowledge: number;
    quests: number;
    totalDiscovered: number;
    mapped?: number;
    matchedWaypoints?: number;
    matchedChests?: number;
    matchedQuests?: number;
    matchedKnowledge?: number;
  };
  totals?: { quests: number; knowledge: number; waypoints: number };
  error?: string;
};

type State =
  | { step: "idle" }
  | { step: "uploading" }
  | { step: "result"; data: SaveParseResult }
  | { step: "error"; message: string };

export function CrimsonDesertSaveImport() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>({ step: "idle" });
  const setDiscoveredNodes = useSettingsStore((s) => s.setDiscoveredNodes);
  const discoveredNodes = useSettingsStore((s) => s.discoveredNodes);

  const handleFile = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".save";

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setState({ step: "uploading" });

      try {
        const buffer = await file.arrayBuffer();
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: buffer,
        });

        const data: SaveParseResult = await response.json();

        if (!response.ok || data.error) {
          setState({ step: "error", message: data.error || "Parse failed" });
          return;
        }

        setState({ step: "result", data });
      } catch {
        setState({ step: "error", message: "Failed to connect to server" });
      }
    };

    input.click();
  }, []);

  const applyToMap = useCallback(
    (merge: boolean) => {
      if (state.step !== "result") return;
      const newIds = state.data.discoveredNodeIds;

      if (merge) {
        const merged = [...new Set([...discoveredNodes, ...newIds])];
        const added = merged.length - discoveredNodes.length;
        setDiscoveredNodes(merged);
        toast.success(`Added ${added} new discoveries`);
      } else {
        setDiscoveredNodes(newIds);
        toast.success(`Set ${newIds.length} discovered items`);
      }

      setState({ step: "idle" });
      setOpen(false);
    },
    [state, discoveredNodes, setDiscoveredNodes, setOpen],
  );

  const handleOpenChange = useCallback((v: boolean) => {
    setOpen(v);
    if (!v) setState({ step: "idle" });
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 text-xs h-8"
        onClick={() => setOpen(true)}
      >
        <Upload className="h-3.5 w-3.5" />
        Import Save File
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import Save File
            </DialogTitle>
            <DialogDescription>
              Upload your Crimson Desert save file to track discovered items on
              the map.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-xs text-muted-foreground border rounded-md p-2.5 bg-muted/30 flex items-center gap-2">
              <span className="font-mono text-[11px] leading-relaxed select-all flex-1">
                %LocalAppData%\Pearl Abyss\CD\save
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(
                    "%LocalAppData%\\Pearl Abyss\\CD\\save",
                  );
                  toast.success("Path copied");
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>

            {state.step === "idle" && (
              <Button className="w-full gap-2" onClick={handleFile}>
                <Upload className="h-4 w-4" />
                Select Save File
              </Button>
            )}

            {state.step === "uploading" && (
              <Button className="w-full gap-2" disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
                Parsing save file...
              </Button>
            )}

            {state.step === "error" && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-destructive border border-destructive/30 rounded-md p-3 bg-destructive/5">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {state.message}
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleFile}
                >
                  Try Again
                </Button>
              </div>
            )}

            {state.step === "result" && (
              <div className="space-y-4">
                {/* Overall game progress */}
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-muted/50 px-3 py-2 border-b flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">
                      Save File Progress
                    </span>
                  </div>
                  <div className="divide-y text-sm">
                    {(
                      [
                        ["Quests", state.data.summary.quests, state.data.totals?.quests],
                        ["Knowledge", state.data.summary.knowledge, state.data.totals?.knowledge],
                        ["Waypoints", state.data.summary.waypoints, state.data.totals?.waypoints],
                        ["Chests", state.data.summary.chests, undefined],
                      ] as [string, number, number | undefined][]
                    )
                      .filter(([, found]) => found > 0)
                      .map(([label, found, total]) => (
                        <div key={label} className="px-3 py-2 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-medium tabular-nums">
                              {found}{total ? <span className="text-muted-foreground font-normal"> / {total}</span> : null}
                            </span>
                          </div>
                          {total ? (
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${Math.min(100, (found / total) * 100)}%` }}
                              />
                            </div>
                          ) : null}
                        </div>
                      ))}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {state.data.discoveredNodeIds.length} locations can be marked as discovered on the map.
                </p>

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => applyToMap(true)}>
                    Merge with existing
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => applyToMap(false)}
                  >
                    Replace all
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={handleFile}
                >
                  Select a different file
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
