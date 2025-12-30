"use client";

import { Settings, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import {
  ScrollArea,
  Label,
  Switch,
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/controls";
import {
  addScheduledTask,
  removeScheduledTask,
  openDevToolsForUrl,
  useLiveState,
  useTHGLAppState,
  setGpuFlag,
  GpuFlag,
} from "@repo/lib/thgl-app";
import { useState } from "react";

// GPU flag options with descriptions
const gpuFlagOptions: {
  value: GpuFlag;
  label: string;
  description: string;
}[] = [
  {
    value: "none",
    label: "Default (Hardware Acceleration)",
    description: "Full GPU acceleration. Best performance for interactive maps.",
  },
  {
    value: "disable-direct-composition-video",
    label: "Disable Video Overlays",
    description:
      "Only disables DirectComposition for video content. Try this first if you experience screen flickering.",
  },
  {
    value: "disable-gpu-compositing",
    label: "Disable GPU Compositing",
    description:
      "Disables GPU-based compositing. May help with multi-monitor flickering issues.",
  },
  {
    value: "disable-gpu",
    label: "Software Rendering",
    description:
      "Completely disables GPU. Slowest option, use only as a last resort.",
  },
];

export default function SettingsPage() {
  const [showDevTools, setShowDevTools] = useState(false);
  const [initialGpuFlag, setInitialGpuFlag] = useState<GpuFlag | null>(null);
  const openDashboardOnStart = useTHGLAppState(
    (state) => state.openDashboardOnStart,
  );
  const setOpenDashboardOnStart = useTHGLAppState(
    (state) => state.setOpenDashboardOnStart,
  );
  const isTaskInstalled = useLiveState((state) => state.isTaskInstalled);
  const setIsTaskInstalled = useLiveState((state) => state.setIsTaskInstalled);
  const version = useLiveState((state) => state.version);
  const connectedClients = useLiveState((state) => state.connectedClients);
  const gpuFlag = useLiveState((state) => state.gpuFlag);
  const setGpuFlagState = useLiveState((state) => state.setGpuFlag);

  // Track the initial GPU flag value when component mounts
  if (initialGpuFlag === null && gpuFlag) {
    setInitialGpuFlag(gpuFlag);
  }

  const gpuFlagChanged = initialGpuFlag !== null && gpuFlag !== initialGpuFlag;

  const handleGpuFlagChange = (value: GpuFlag) => {
    setGpuFlag(value)
      .then(() => {
        setGpuFlagState(value);
      })
      .catch(console.error);
  };

  const controllerClient = connectedClients?.find(
    (client) => client.role === "controller",
  );
  const dashboardClient = connectedClients?.find(
    (client) => client.role === "dashboard",
  );

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-6 pb-20 space-y-6 max-w-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Settings</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure your companion app preferences
          </p>
        </div>

        {/* Startup Preferences */}
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h3 className="text-sm font-semibold">Startup</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="open-app-on-start"
                  className="text-sm font-normal cursor-pointer"
                >
                  Launch on Windows startup
                </Label>
                <p className="text-xs text-muted-foreground">
                  Start the companion app when Windows boots
                </p>
              </div>
              <Switch
                id="open-app-on-start"
                checked={!!isTaskInstalled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    addScheduledTask();
                  } else {
                    removeScheduledTask();
                  }
                  setIsTaskInstalled(checked);
                }}
              />
            </div>
            <div className="border-t" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="open-dashboard-on-start"
                  className="text-sm font-normal cursor-pointer"
                >
                  Open dashboard on launch
                </Label>
                <p className="text-xs text-muted-foreground">
                  Show this window when the app starts
                </p>
              </div>
              <Switch
                id="open-dashboard-on-start"
                checked={openDashboardOnStart}
                onCheckedChange={setOpenDashboardOnStart}
              />
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            Game-specific auto-run settings can be configured on each
            game&apos;s page in the sidebar. App settings like hotkeys can be
            configured in the overlay or desktop windows.
          </p>
        </div>

        {/* GPU / Display Settings */}
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h3 className="text-sm font-semibold">Display</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="gpu-flag" className="text-sm font-normal">
                GPU Acceleration
              </Label>
              <Select
                value={gpuFlag}
                onValueChange={(value) => handleGpuFlagChange(value as GpuFlag)}
              >
                <SelectTrigger id="gpu-flag" className="w-full">
                  <SelectValue placeholder="Select GPU mode" />
                </SelectTrigger>
                <SelectContent>
                  {gpuFlagOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {gpuFlagOptions.find((o) => o.value === gpuFlag)?.description}
              </p>
            </div>
            {gpuFlagChanged && (
              <div className="flex items-center justify-between gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-500">
                    Restart required to apply changes.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-500"
                  onClick={() => window.chrome.webview.postMessage("restartApp")}
                >
                  Restart
                </Button>
              </div>
            )}
            {gpuFlag !== "none" && (
              <div className="flex items-start gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 p-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-500">
                  Non-default GPU settings may reduce map performance. Only use
                  if experiencing display issues.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Developer Tools (Collapsible) */}
        <div className="rounded-lg border bg-card">
          <Button
            variant="ghost"
            className="w-full justify-between p-4 h-auto"
            onClick={() => setShowDevTools(!showDevTools)}
          >
            <span className="text-sm font-semibold">Developer Tools</span>
            {showDevTools ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {showDevTools && (
            <div className="px-4 pb-4 space-y-3 text-sm">
              <div className="border-t" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Version:</span>
                <Tooltip>
                  <TooltipTrigger className="hover:text-foreground">
                    {version?.buildVersion ?? "Unknown"}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Version: {version?.buildVersion ?? "Unknown"}</p>
                    <p>Date: {version?.buildDate}</p>
                    <p>Time: {version?.buildTime}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Inspect:</span>
                  <div className="space-x-2">
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() =>
                        openDevToolsForUrl(
                          controllerClient?.href || "/controller",
                        )
                      }
                    >
                      controller
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() =>
                        openDevToolsForUrl(
                          dashboardClient?.href || "/dashboard",
                        )
                      }
                    >
                      dashboard
                    </Button>
                  </div>
                </div>
                {/* Game windows (overlays, desktop) */}
                {connectedClients?.filter((c) => c.role === "client").length ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Game windows:</span>
                    <div className="flex flex-wrap gap-x-2 gap-y-1 justify-end">
                      {connectedClients
                        ?.filter((c) => c.role === "client")
                        .map((client) => {
                          // Extract a friendly name from the URL
                          const url = new URL(client.href);
                          const pathParts = url.pathname.split("/").filter(Boolean);
                          const name = pathParts[pathParts.length - 1] || "window";
                          return (
                            <Button
                              key={client.id}
                              variant="link"
                              size="sm"
                              className="h-auto p-0"
                              onClick={() => openDevToolsForUrl(client.href)}
                            >
                              {name}
                            </Button>
                          );
                        })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
