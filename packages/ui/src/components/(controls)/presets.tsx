import { REGION_FILTERS, useCoordinates } from "../(providers)";
import { useUserStore } from "../(providers)";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Checkbox } from "../ui/checkbox";
import { ChevronRight, RotateCw, Trash2, Check, X } from "lucide-react";
import { Input } from "../ui/input";
import { useSettingsStore, type FilterPreset } from "@repo/lib";
import { useMemo, useState, type JSX } from "react";

// Legacy presets are a bare string[] (filters only); new ones are FilterPreset.
const normalize = (preset: string[] | FilterPreset): FilterPreset =>
  Array.isArray(preset) ? { filters: preset } : preset;

const setEq = (a: Set<string>, b: Set<string>) => {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
};

// Treat "off" alerts as absent so {x:false} compares equal to {}.
const enabledKeys = (record: Record<string, boolean> = {}) =>
  new Set(Object.keys(record).filter((key) => record[key]));

// Treat default size (1) as absent so an explicit 1 compares equal to unset.
const sizeMap = (record: Record<string, number> = {}) => {
  const map = new Map<string, number>();
  for (const [key, value] of Object.entries(record)) {
    if (value !== 1) map.set(key, value);
  }
  return map;
};

const sizeMapEq = (a: Map<string, number>, b: Map<string, number>) => {
  if (a.size !== b.size) return false;
  for (const [key, value] of a) if (b.get(key) !== value) return false;
  return true;
};

export function Presets(): JSX.Element {
  const coordinates = useCoordinates();
  const { setFilters, filters, globalFilters, setGlobalFilters } =
    useUserStore();
  const presets = useSettingsStore((state) => state.presets);
  const addPreset = useSettingsStore((state) => state.addPreset);
  const removePreset = useSettingsStore((state) => state.removePreset);
  const applyPresetSettings = useSettingsStore(
    (state) => state.applyPresetSettings,
  );
  // Snapshotted into a preset on save, restored on apply, compared for "active".
  const baseIconSize = useSettingsStore((state) => state.baseIconSize);
  const iconSizeByGroup = useSettingsStore((state) => state.iconSizeByGroup);
  const iconSizeByFilter = useSettingsStore((state) => state.iconSizeByFilter);
  const audioAlertByFilter = useSettingsStore(
    (state) => state.audioAlertByFilter,
  );

  const [presetName, setPresetName] = useState("");
  // Which categories the "Save" form will capture.
  const [captureFilters, setCaptureFilters] = useState(true);
  const [captureSizes, setCaptureSizes] = useState(true);
  const [captureAlerts, setCaptureAlerts] = useState(true);
  // Two-step delete confirmation: holds the name awaiting confirmation.
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const allGlobalFilters = useMemo(
    () =>
      coordinates.globalFilters.flatMap((filter) =>
        filter.values.flatMap((value) => value.id),
      ),
    [coordinates.globalFilters],
  );

  const defaultGlobalFilters = useMemo(
    () =>
      coordinates.globalFilters.flatMap((filter) =>
        filter.values.flatMap((value) => (value.defaultOn ? value.id : [])),
      ),
    [coordinates.globalFilters],
  );

  const currentActive = useMemo(
    () => new Set([...filters, ...globalFilters]),
    [filters, globalFilters],
  );

  const splitFilters = (ids: string[]) => {
    const global: string[] = [];
    const local: string[] = [];
    for (const id of ids) {
      (allGlobalFilters.includes(id) ? global : local).push(id);
    }
    return { global, local };
  };

  // The active-filter Set that applying this preset would produce.
  const expectedActiveSet = (ids: string[]) => {
    const { global, local } = splitFilters(ids);
    const resolvedGlobal = global.length === 0 ? defaultGlobalFilters : global;
    return new Set([...local, ...resolvedGlobal]);
  };

  // Build a preset snapshot from the current state, including only the
  // requested categories.
  const buildSnapshot = (capture: {
    filters: boolean;
    sizes: boolean;
    alerts: boolean;
  }): FilterPreset => {
    const preset: FilterPreset = {};
    if (capture.filters) preset.filters = [...filters, ...globalFilters];
    if (capture.sizes) {
      preset.baseIconSize = baseIconSize;
      preset.iconSizeByGroup = iconSizeByGroup;
      preset.iconSizeByFilter = iconSizeByFilter;
    }
    if (capture.alerts) preset.audioAlertByFilter = audioAlertByFilter;
    return preset;
  };

  const applyPreset = (preset: string[] | FilterPreset) => {
    const normalized = normalize(preset);
    if (normalized.filters) {
      const { global, local } = splitFilters(normalized.filters);
      setFilters(local);
      setGlobalFilters(global.length === 0 ? defaultGlobalFilters : global);
    }
    applyPresetSettings({
      iconSizes:
        normalized.iconSizeByGroup !== undefined
          ? {
              baseIconSize: normalized.baseIconSize ?? 1,
              iconSizeByGroup: normalized.iconSizeByGroup,
              iconSizeByFilter: normalized.iconSizeByFilter ?? {},
            }
          : undefined,
      audioAlertByFilter: normalized.audioAlertByFilter,
    });
  };

  // A preset is "active" when every category it captured matches the current
  // state. Derived from live state, so it self-corrects the moment the user
  // changes a filter/size/alert — it never shows a stale highlight.
  const isPresetActive = (preset: string[] | FilterPreset) => {
    const normalized = normalize(preset);
    let captured = false;
    if (normalized.filters) {
      captured = true;
      if (!setEq(expectedActiveSet(normalized.filters), currentActive)) {
        return false;
      }
    }
    if (normalized.iconSizeByGroup !== undefined) {
      captured = true;
      if ((normalized.baseIconSize ?? 1) !== baseIconSize) return false;
      if (!sizeMapEq(sizeMap(normalized.iconSizeByGroup), sizeMap(iconSizeByGroup)))
        return false;
      if (
        !sizeMapEq(
          sizeMap(normalized.iconSizeByFilter ?? {}),
          sizeMap(iconSizeByFilter),
        )
      ) {
        return false;
      }
    }
    if (normalized.audioAlertByFilter !== undefined) {
      captured = true;
      if (!setEq(enabledKeys(normalized.audioAlertByFilter), enabledKeys(audioAlertByFilter)))
        return false;
    }
    return captured;
  };

  const trimmedName = presetName.trim();
  const nameExists = Object.prototype.hasOwnProperty.call(
    presets,
    trimmedName,
  );
  const nothingCaptured = !captureFilters && !captureSizes && !captureAlerts;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedName || nothingCaptured) return;
    addPreset(
      trimmedName,
      buildSnapshot({
        filters: captureFilters,
        sizes: captureSizes,
        alerts: captureAlerts,
      }),
    );
    setPresetName("");
  };

  // Re-save a preset over its current contents, keeping the categories it
  // already captures (so "update" means "match my current setup").
  const updatePreset = (name: string, preset: string[] | FilterPreset) => {
    const normalized = normalize(preset);
    addPreset(
      name,
      buildSnapshot({
        filters: normalized.filters !== undefined,
        sizes: normalized.iconSizeByGroup !== undefined,
        alerts: normalized.audioAlertByFilter !== undefined,
      }),
    );
  };

  // Compact summary of what a preset controls, e.g. "Filters · Sizes".
  const presetSummary = (preset: string[] | FilterPreset) => {
    const normalized = normalize(preset);
    const parts: string[] = [];
    if (normalized.filters) parts.push("Filters");
    if (normalized.iconSizeByGroup !== undefined) parts.push("Sizes");
    if (normalized.audioAlertByFilter !== undefined) parts.push("Alerts");
    return parts.join(" · ");
  };

  return (
    <div className="flex items-center px-1.5 py-0.5 gap-0.5">
      <button
        className="text-[10px] text-muted-foreground hover:text-primary px-1.5 py-1 transition-colors uppercase tracking-wide"
        onClick={() => {
          setFilters(coordinates.allFilters);
          setGlobalFilters(allGlobalFilters);
        }}
        type="button"
      >
        All
      </button>
      <div className="w-px h-3 bg-border/50" />
      <button
        className="text-[10px] text-muted-foreground hover:text-primary px-1.5 py-1 transition-colors uppercase tracking-wide"
        onClick={() => {
          setFilters([]);
          setGlobalFilters(defaultGlobalFilters);
        }}
        type="button"
      >
        None
      </button>
      <div className="w-px h-3 bg-border/50" />
      <button
        className="text-[10px] text-muted-foreground hover:text-primary px-1.5 py-1 transition-colors uppercase tracking-wide"
        onClick={() => {
          setGlobalFilters(defaultGlobalFilters);

          const defaultFilters = [
            ...coordinates.filters.flatMap((filter) =>
              filter.defaultOn
                ? filter.values
                    .filter((value) => value.defaultOn !== false)
                    .map((value) => value.id)
                : [],
            ),
            ...REGION_FILTERS.map((filter) => filter.id),
          ];
          setFilters(defaultFilters);
        }}
        type="button"
      >
        Default
      </button>
      <div className="grow" />
      <DropdownMenu
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center text-[10px] text-muted-foreground hover:text-primary px-1.5 py-1 transition-colors uppercase tracking-wide"
            type="button"
          >
            Presets
            <ChevronRight className="ml-0.5 h-2.5 w-2.5 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72">
          {Object.entries(presets).map(([name, preset]) => {
            const active = isPresetActive(preset);
            const confirming = pendingDelete === name;
            return (
              <div
                key={name}
                className={`flex items-center w-full rounded-sm transition-colors ${
                  active ? "bg-primary/10" : ""
                }`}
              >
                <DropdownMenuItem
                  onClick={() => applyPreset(preset)}
                  className="grow gap-2 min-w-0"
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                      active ? "bg-primary" : "bg-transparent"
                    }`}
                    aria-hidden
                  />
                  <span className="flex flex-col min-w-0 leading-tight">
                    <span
                      className={`truncate ${active ? "text-primary" : ""}`}
                    >
                      {name}
                    </span>
                    <span className="truncate text-[10px] text-muted-foreground uppercase tracking-wide">
                      {presetSummary(preset) || "Empty"}
                    </span>
                  </span>
                </DropdownMenuItem>
                {confirming ? (
                  <>
                    <Button
                      className="shrink-0 text-destructive hover:text-destructive"
                      variant="ghost"
                      size="icon"
                      title="Confirm delete"
                      onClick={() => {
                        removePreset(name);
                        setPendingDelete(null);
                      }}
                      type="button"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      className="shrink-0"
                      variant="ghost"
                      size="icon"
                      title="Cancel"
                      onClick={() => setPendingDelete(null)}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      className="shrink-0 text-muted-foreground hover:text-primary"
                      variant="ghost"
                      size="icon"
                      title="Update preset to current setup"
                      onClick={() => updatePreset(name, preset)}
                      type="button"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                    <Button
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      variant="ghost"
                      size="icon"
                      title="Delete preset"
                      onClick={() => setPendingDelete(name)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            );
          })}
          {Object.keys(presets).length === 0 && (
            <DropdownMenuItem disabled>No presets saved</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <form className="flex flex-col gap-2 p-1" onSubmit={handleSubmit}>
            <p className="text-[10px] text-muted-foreground leading-snug px-0.5">
              Choose what this preset captures. Applying it restores only the
              checked categories.
            </p>
            <div className="flex items-center gap-3 px-0.5">
              <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none">
                <Checkbox
                  checked={captureFilters}
                  onCheckedChange={(checked) =>
                    setCaptureFilters(checked === true)
                  }
                />
                Filters
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none">
                <Checkbox
                  checked={captureSizes}
                  onCheckedChange={(checked) =>
                    setCaptureSizes(checked === true)
                  }
                />
                Sizes
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none">
                <Checkbox
                  checked={captureAlerts}
                  onCheckedChange={(checked) =>
                    setCaptureAlerts(checked === true)
                  }
                />
                Alerts
              </label>
            </div>
            <Input
              type="text"
              placeholder="Preset name"
              value={presetName}
              onChange={(event) => {
                setPresetName(event.target.value);
              }}
              onKeyDown={(event) => {
                event.stopPropagation();
              }}
              required
            />
            <Button
              className="w-full"
              size="sm"
              type="submit"
              disabled={!trimmedName || nothingCaptured}
            >
              {nameExists ? "Update Preset" : "Save Preset"}
            </Button>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
