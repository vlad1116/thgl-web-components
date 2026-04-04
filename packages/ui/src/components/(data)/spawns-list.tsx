"use client";
import { getNodeId, type SimpleSpawn, useSettingsStore } from "@repo/lib";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { useT } from "../(providers)";
import { Check, ImageUpscale, X } from "lucide-react";

export function SpawnsList({
  spawns,
  onShowClick,
  highlightedIds,
  typeGroupLabels,
}: {
  spawns: SimpleSpawn[];
  onShowClick: (spawnIDs: string[]) => void;
  highlightedIds: string[];
  /** Map of type ID → group display name for section headers */
  typeGroupLabels?: Record<string, string>;
}) {
  useSettingsStore((state) => state.discoveredNodes);
  const t = useT();
  const isDiscoveredNode = useSettingsStore((state) => state.isDiscoveredNode);
  const setDiscoverNode = useSettingsStore((state) => state.setDiscoverNode);

  // Build sections of spawn entries, grouped by type and optionally by group label.
  // Groups by type ID (not display name) so different filter types with the same
  // translated name stay separate (e.g. common "sifudog" vs predator "predator_sifudog").
  type Entry = { name: string; spawns: SimpleSpawn[]; groupLabel: string | null };
  type Section = { label: string | null; entries: Entry[] };

  const sections: Section[] = (() => {
    // Group spawns by display name, but use a composite key of
    // "type:name" so same-named spawns from different filter types
    // stay separate (e.g. common vs predator "Dogen").
    const useTypeKey = Boolean(typeGroupLabels);
    const grouped: Record<string, SimpleSpawn[]> = {};
    for (const spawn of spawns) {
      const name = t(spawn.id, { fallback: spawn.type });
      const key = useTypeKey ? `${spawn.type || ""}::${name}` : name;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(spawn);
    }

    if (typeGroupLabels) {
      // Organize entries into sections by group label
      const groupMap = new Map<string, Entry[]>();
      for (const [, groupSpawns] of Object.entries(grouped)) {
        const name = t(groupSpawns[0].id, { fallback: groupSpawns[0].type });
        const typeId = groupSpawns[0].type || "";
        const groupLabel = typeGroupLabels[typeId] ?? null;
        const key = groupLabel ?? "__ungrouped";
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push({ name, spawns: groupSpawns, groupLabel });
      }
      return [...groupMap.entries()].map(([key, entries]) => ({
        label: key === "__ungrouped" ? null : key,
        entries,
      }));
    }

    // No group labels — flat list
    return [{
      label: null,
      entries: Object.entries(grouped).map(([, s]) => ({
        name: t(s[0].id, { fallback: s[0].type }),
        spawns: s,
        groupLabel: null,
      })),
    }];
  })();

  const markDiscoveredLabel = t("guide.spawns.markDiscovered", { fallback: "Mark as Discovered" });
  const resetProgressLabel = t("guide.spawns.resetProgress", { fallback: "Reset Progress" });
  const highlightLabel = t("guide.spawns.highlightOnMap", { fallback: "Highlight on Map" });

  return (
    <div className="flex flex-col gap-1 max-w-2xl w-full">
      {sections.map((section, si) => (
        <div key={section.label ?? si}>
          {section.label && (
            <h4 className="text-sm font-semibold text-muted-foreground mt-4 mb-1.5 px-1 border-b border-border/50 pb-1">
              {section.label}
            </h4>
          )}
          {section.entries.map((entry) => {
            const { name, spawns: groupSpawns } = entry;
            const progress = groupSpawns.filter((spawn) =>
              isDiscoveredNode(getNodeId(spawn)),
            ).length;
            const max = groupSpawns.length;
            const isMax = progress === max;
            const groupSpawnIds = groupSpawns.map((s) => s.id);
            const isHighlighted = highlightedIds.some((id) =>
              groupSpawnIds.includes(id),
            );
            return (
              <div key={name} className="flex gap-2 items-center">
                <div className="relative grow overflow-hidden">
                  <p className="text-md font-bold px-2 py-2 text-shadow truncate">
                    <span className="truncate">{name}</span>
                    <span className="text-xs ml-2 font-normal">
                      ({progress}/{max})
                    </span>
                  </p>
                  <Progress
                    value={progress}
                    max={max}
                    className="absolute inset-0 h-full -z-10 rounded-md"
                    aria-label={`${name}: ${progress} of ${max}`}
                  />
                </div>
                <Button
                  size="icon"
                  onClick={() => {
                    groupSpawns.forEach((s) => setDiscoverNode(s.id, true));
                  }}
                  disabled={isMax}
                  className="shrink-0"
                  variant={isMax ? "ghost" : "outline"}
                  aria-label={markDiscoveredLabel}
                  title={markDiscoveredLabel}
                >
                  <Check color={isMax ? "green" : undefined} />
                </Button>
                <Button
                  size="icon"
                  onClick={() => {
                    if (progress > 0 && !confirm(`Reset all ${progress} discovered ${name}?`)) return;
                    groupSpawns.forEach((s) => setDiscoverNode(s.id, false));
                  }}
                  disabled={progress === 0}
                  className="shrink-0"
                  variant="destructive"
                  aria-label={resetProgressLabel}
                  title={resetProgressLabel}
                >
                  <X />
                </Button>
                <Button
                  size="icon"
                  onClick={() => onShowClick(isHighlighted ? [] : groupSpawnIds)}
                  className="shrink-0"
                  variant={isHighlighted ? "secondary" : "ghost"}
                  aria-label={highlightLabel}
                  title={highlightLabel}
                >
                  <ImageUpscale />
                </Button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
