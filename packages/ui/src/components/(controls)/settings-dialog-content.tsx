"use client";
import { Button } from "../ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  writeFileOverwolf,
  saveFile,
  useSettingsStore,
  useAccountStore,
  openFileOrFiles,
  FiltersConfig,
} from "@repo/lib";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { ReactNode } from "react";
import { Switch } from "../ui/switch";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { IconSizes } from "./icon-sizes";
import { ColorPicker } from "./color-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Slider } from "../ui/slider";
import { ProfileManager } from "./profile-manager";
import { Play } from "lucide-react";
import { playAlertSound, ALERT_SOUND_OPTIONS } from "./audio-alert";

export function SettingsDialogContent({
  activeApp,
  more,
  children,
  hideAppSettings,
  withoutTraceLines = false,
  filters,
}: {
  activeApp: string;
  more?: ReactNode;
  children?: ReactNode;
  hideAppSettings?: boolean;
  withoutTraceLines?: boolean;
  filters: FiltersConfig;
}) {
  const settingsStore = useSettingsStore();
  const profileSettings = useSettingsStore((state) => state);
  const hasPreviewAccess = useAccountStore(
    (state) => state.perks.previewReleaseAccess,
  );

  return (
    <DialogContent
      onMouseDown={(e) => e.stopPropagation()}
      aria-describedby="settings-dialog-description"
    >
      <DialogHeader>
        <DialogTitle>Settings</DialogTitle>
        <DialogDescription id="settings-dialog-description">
          Configure your application settings below.
        </DialogDescription>
      </DialogHeader>
      <ScrollArea>
        <div className="space-y-2 pr-3">
          {more ? (
            <>
              {more}
              <Separator />
            </>
          ) : null}
          <h4 className="text-md font-semibold">Profiles</h4>
          <p className="text-muted-foreground text-xs">
            Manage your settings profiles to quickly switch between different
            configurations.
          </p>
          <ProfileManager activeApp={activeApp} />
          <Separator />
          <h4 className="text-md font-semibold">Discovered Nodes</h4>
          <p className="text-muted-foreground text-xs">
            You discovered {settingsStore.discoveredNodes.length} nodes.
          </p>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={() => {
                const fileName = `${activeApp}_discovered_nodes_${Date.now()}.json`;
                if (typeof overwolf === "undefined") {
                  const blob = new Blob(
                    [JSON.stringify(settingsStore.discoveredNodes)],
                    {
                      type: "text/json",
                    },
                  );
                  saveFile(blob, fileName);
                } else {
                  writeFileOverwolf(
                    JSON.stringify(settingsStore.discoveredNodes),
                    overwolf.io.paths.documents + "\\the-hidden-gaming-lair",
                    fileName,
                  );
                }
              }}
            >
              Backup
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                const file = await openFileOrFiles();
                if (!file) {
                  return;
                }
                const reader = new FileReader();
                reader.addEventListener("load", (loadEvent) => {
                  const text = loadEvent.target?.result;
                  if (!text || typeof text !== "string") {
                    return;
                  }
                  try {
                    let discoveredNodes = JSON.parse(text);
                    if (!Array.isArray(discoveredNodes)) {
                      discoveredNodes = [];
                    } else if (
                      discoveredNodes.some((node) => typeof node !== "string")
                    ) {
                      discoveredNodes = discoveredNodes.filter(
                        (node) => typeof node === "string",
                      );
                    }
                    settingsStore.setDiscoveredNodes(discoveredNodes);
                    toast.success("Discovered nodes restored");
                  } catch (error) {
                    // Do nothing
                  }
                });
                reader.readAsText(file);
              }}
            >
              Restore
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                settingsStore.setDiscoveredNodes([]);
                toast.warning("Discovered nodes reset");
              }}
            >
              Reset
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="hide-discovered-nodes">Hide Discovered Nodes</Label>
            <Switch
              id="hide-discovered-nodes"
              checked={settingsStore.hideDiscoveredNodes}
              onCheckedChange={settingsStore.toggleHideDiscoveredNodes}
            />
          </div>
          <Separator />
          <h4 className="text-md font-semibold">My Filters</h4>
          <p className="text-muted-foreground text-xs">
            You have {settingsStore.myFilters.length} filters.
          </p>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={() => {
                const fileName = `${activeApp}_My_Filters_${Date.now()}.json`;
                if (typeof overwolf === "undefined") {
                  const blob = new Blob(
                    [JSON.stringify(settingsStore.myFilters)],
                    {
                      type: "text/json",
                    },
                  );
                  saveFile(blob, fileName);
                } else {
                  writeFileOverwolf(
                    JSON.stringify(settingsStore.myFilters),
                    overwolf.io.paths.documents + "\\the-hidden-gaming-lair",
                    fileName,
                  );
                }
              }}
            >
              Backup
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                const file = await openFileOrFiles();
                if (!file) {
                  return;
                }
                const reader = new FileReader();
                reader.addEventListener("load", (loadEvent) => {
                  const text = loadEvent.target?.result;
                  if (!text || typeof text !== "string") {
                    return;
                  }
                  try {
                    let myFilters = JSON.parse(text);
                    if (!Array.isArray(myFilters)) {
                      myFilters = [];
                    }

                    settingsStore.setMyFilters(myFilters);
                    toast.success("My filters restored");
                  } catch (error) {
                    // Do nothing
                  }
                });
                reader.readAsText(file);
              }}
            >
              Restore
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                settingsStore.setMyFilters([]);
                toast.warning("My filters reset");
              }}
            >
              Reset
            </Button>
          </div>
          <Separator />
          <h4 className="text-md font-semibold">User Interface</h4>
          <div className="flex items-center gap-2 justify-between">
            <Label htmlFor="color-blind-mode">Color Blind Mode</Label>
            <Select
              value={profileSettings.colorBlindMode}
              onValueChange={settingsStore.setColorBlindMode}
            >
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="protanopia">Protanopia</SelectItem>
                <SelectItem value="deuteranopia">Deuteranopia</SelectItem>
                <SelectItem value="tritanopia">Tritanopia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 justify-between">
            <Label htmlFor="color-blind-severity">Color Blind Severity</Label>
            <div className="flex items-center gap-2">
              <Slider
                id="color-blind-severity"
                className="w-40 h-8 p-0"
                min={0}
                max={1}
                step={0.05}
                value={[profileSettings.colorBlindSeverity]}
                onValueChange={(values) => {
                  settingsStore.setColorBlindSeverity(values[0]);
                }}
              />
              <span className="text-xs text-muted-foreground w-10 text-right">
                {Math.round(profileSettings.colorBlindSeverity * 100)}%
              </span>
            </div>
          </div>
          {hideAppSettings ? (
            <IconSizes filters={filters} />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-trace-line">
                  Zoom map on filters change
                </Label>
                <Switch
                  id="show-trace-line"
                  checked={profileSettings.fitBoundsOnChange}
                  onCheckedChange={settingsStore.toggleFitBoundsOnChange}
                />
              </div>
              <div className="flex items-center gap-2 justify-between">
                Reset Interface
                <Button onClick={settingsStore.resetTransform} size="sm">
                  Reset
                </Button>
              </div>
              <IconSizes filters={filters} />
              <Separator />
              <h4 className="text-md font-semibold">Trace Line</h4>
              {withoutTraceLines ? (
                <p className="text-muted-foreground text-xs">
                  This game does not support trace lines.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-trace-line">Show Trace Line</Label>
                    <Switch
                      id="show-trace-line"
                      checked={profileSettings.showTraceLine}
                      onCheckedChange={settingsStore.toggleShowTraceLine}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="follow-player">Follow Player</Label>
                    <Switch
                      id="follow-player"
                      checked={profileSettings.followPlayer}
                      onCheckedChange={settingsStore.toggleFollowPlayer}
                    />
                  </div>
                  <div className="flex items-center gap-2 justify-between">
                    <Label htmlFor="trace-line-length">Trace Line Length</Label>
                    <Input
                      type="number"
                      id="trace-line-length"
                      value={profileSettings.traceLineLength}
                      className="w-fit"
                      onChange={(event) =>
                        settingsStore.setTraceLineLength(+event.target.value)
                      }
                      min={0}
                    />
                  </div>
                  <div className="flex items-center gap-2 justify-between">
                    <Label htmlFor="trace-line-rate">Trace Line Rate</Label>
                    <Input
                      type="number"
                      id="trace-line-rate"
                      value={profileSettings.traceLineRate}
                      className="w-fit"
                      onChange={(event) =>
                        settingsStore.setTraceLineRate(+event.target.value)
                      }
                      min={0}
                    />
                  </div>
                  <div className="flex items-center gap-2 justify-between">
                    <Label htmlFor="trace-line-color">Trace Line Color</Label>
                    <ColorPicker
                      id="trace-line-color"
                      value={profileSettings.traceLineColor}
                      onChange={settingsStore.setTraceLineColor}
                    />
                  </div>
                </>
              )}
              <Separator />
              <h4 className="text-md font-semibold">Audio Alerts</h4>
              <p className="text-muted-foreground text-xs">
                Play a sound when tracked items appear within range. Configure
                per-filter alerts using the settings icon next to each filter.
              </p>
              {!hasPreviewAccess && (
                <p className="text-amber-500 text-xs">
                  This feature requires{" "}
                  <a
                    href="https://www.th.gl/support-me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-amber-400"
                  >
                    Preview Release
                  </a>{" "}
                  access to function.
                </p>
              )}
              <div className="flex items-center justify-between">
                <Label htmlFor="audio-alerts-enabled">Enable Audio Alerts</Label>
                <Switch
                  id="audio-alerts-enabled"
                  checked={profileSettings.audioAlertsEnabled}
                  onCheckedChange={settingsStore.setAudioAlertsEnabled}
                  disabled={!hasPreviewAccess && !profileSettings.audioAlertsEnabled}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 justify-between">
                  <Label htmlFor="audio-alert-range">Alert Range</Label>
                  <Input
                    type="number"
                    id="audio-alert-range"
                    value={profileSettings.audioAlertRange}
                    className="w-24"
                    onChange={(e) =>
                      settingsStore.setAudioAlertRange(+e.target.value)
                    }
                    min={10}
                    disabled={!profileSettings.audioAlertsEnabled}
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  Distance in map units. The ideal value depends on the game and
                  map scale.
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-audio-alert-range">Show Range on Map</Label>
                  <Switch
                    id="show-audio-alert-range"
                    checked={profileSettings.showAudioAlertRange}
                    onCheckedChange={settingsStore.toggleShowAudioAlertRange}
                    disabled={!profileSettings.audioAlertsEnabled}
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  Display a circle around your player to visualize the alert
                  range.
                </p>
              </div>
              <div className="flex items-center gap-2 justify-between">
                <Label htmlFor="audio-alert-sound">Alert Sound</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={profileSettings.audioAlertSound}
                    onValueChange={settingsStore.setAudioAlertSound}
                    disabled={!profileSettings.audioAlertsEnabled}
                  >
                    <SelectTrigger className="w-28 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALERT_SOUND_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() =>
                      playAlertSound(
                        profileSettings.audioAlertSound,
                        profileSettings.audioAlertVolume,
                      )
                    }
                    disabled={!profileSettings.audioAlertsEnabled}
                    title="Preview sound"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-between">
                <Label htmlFor="audio-alert-volume">Volume</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="audio-alert-volume"
                    className="w-28 h-8 p-0"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[profileSettings.audioAlertVolume]}
                    onValueChange={(values) => {
                      settingsStore.setAudioAlertVolume(values[0]);
                    }}
                    disabled={!profileSettings.audioAlertsEnabled}
                  />
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {Math.round(profileSettings.audioAlertVolume * 100)}%
                  </span>
                </div>
              </div>
            </>
          )}
          {children}
        </div>
      </ScrollArea>
    </DialogContent>
  );
}
