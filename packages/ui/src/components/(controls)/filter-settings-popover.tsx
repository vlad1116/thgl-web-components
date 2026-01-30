"use client";

import { Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { useSettingsStore, useAccountStore } from "@repo/lib";
import { useMemo } from "react";
import { FilterTooltip } from "./filter-tooltip";

type FilterSettingsPopoverProps =
  | {
      filterId: string;
      filterLabel: string;
      isGroup?: false;
      groupId?: never;
      filterIds?: never;
      liveOnly?: boolean;
    }
  | {
      filterId?: never;
      filterLabel: string;
      isGroup: true;
      groupId: string;
      filterIds: string[];
      liveOnly?: never;
    };

export function FilterSettingsPopover(props: FilterSettingsPopoverProps) {
  const { filterLabel, isGroup } = props;

  const iconSizeByFilter = useSettingsStore((s) => s.iconSizeByFilter);
  const setIconSizeByFilter = useSettingsStore((s) => s.setIconSizeByFilter);
  const iconSizeByGroup = useSettingsStore((s) => s.iconSizeByGroup);
  const setIconSizeByGroup = useSettingsStore((s) => s.setIconSizeByGroup);
  const audioAlertByFilter = useSettingsStore((s) => s.audioAlertByFilter);
  const toggleAudioAlertByFilter = useSettingsStore(
    (s) => s.toggleAudioAlertByFilter,
  );
  const setAudioAlertByFilters = useSettingsStore(
    (s) => s.setAudioAlertByFilters,
  );
  const masterEnabled = useSettingsStore((s) => s.audioAlertsEnabled);
  const hasPreviewAccess = useAccountStore(
    (s) => s.perks.previewReleaseAccess,
  );

  // For groups, calculate if all/some/none have audio enabled
  const groupAudioState = useMemo(() => {
    if (!isGroup) return null;
    const filterIds = props.filterIds;
    const enabledCount = filterIds.filter(
      (id) => audioAlertByFilter[id],
    ).length;
    if (enabledCount === 0) return "none";
    if (enabledCount === filterIds.length) return "all";
    return "some";
  }, [isGroup, isGroup ? props.filterIds : null, audioAlertByFilter]);

  const iconSize = isGroup
    ? (iconSizeByGroup[props.groupId] ?? 1)
    : (iconSizeByFilter[props.filterId] ?? 1);

  const audioEnabled = isGroup
    ? groupAudioState === "all"
    : (audioAlertByFilter[props.filterId] ?? false);

  const handleIconSizeChange = (value: number[]) => {
    if (isGroup) {
      setIconSizeByGroup(props.groupId, value[0]);
    } else {
      setIconSizeByFilter(props.filterId, value[0]);
    }
  };

  const handleAudioToggle = () => {
    if (isGroup) {
      // If all or some are enabled, disable all. If none are enabled, enable all.
      const newEnabled = groupAudioState === "none";
      setAudioAlertByFilters(props.filterIds, newEnabled);
    } else {
      toggleAudioAlertByFilter(props.filterId);
    }
  };

  return (
    <Popover modal>
      <PopoverTrigger asChild>
        <button
          className="p-1 hover:text-primary transition-colors shrink-0 text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
          type="button"
        >
          <Settings2 className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" side="right">
        {!isGroup && (
          <>
            {props.liveOnly && (
              <p className="font-bold text-sm text-orange-500">
                This filter is only available with the live mode of the In-Game
                app.
              </p>
            )}
            <FilterTooltip id={props.filterId} />
            <Separator />
          </>
        )}

        {isGroup && (
          <div className="font-medium text-sm truncate">{filterLabel}</div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs">
            Icon Size {isGroup && "(Group)"}
          </Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[iconSize]}
              onValueChange={handleIconSizeChange}
              min={0.1}
              max={2.5}
              step={0.1}
            />
            <span className="text-xs text-muted-foreground w-8 text-right">
              {iconSize.toFixed(1)}x
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Audio Alert {isGroup && "(All)"}</Label>
          <Switch
            checked={audioEnabled}
            onCheckedChange={handleAudioToggle}
          />
        </div>

        {isGroup && groupAudioState === "some" && (
          <p className="text-xs text-muted-foreground">
            Some filters in this group have audio alerts enabled.
          </p>
        )}

        {!masterEnabled && (
          <p className="text-xs text-muted-foreground">
            {!hasPreviewAccess ? (
              <>
                Requires{" "}
                <a
                  href="https://www.th.gl/support-me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  Preview Release
                </a>{" "}
                access. Enable audio alerts in Settings.
              </>
            ) : (
              "Enable audio alerts in Settings to activate."
            )}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
