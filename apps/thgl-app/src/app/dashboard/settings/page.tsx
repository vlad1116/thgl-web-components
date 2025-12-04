"use client";

import { Settings, ChevronDown, ChevronUp } from "lucide-react";
import {
  ScrollArea,
  Label,
  Switch,
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/controls";
import {
  requestFromMain,
  useLiveState,
  usePersistentState,
} from "@repo/lib/thgl-app";
import { useState } from "react";

export default function SettingsPage() {
  const [showDevTools, setShowDevTools] = useState(false);
  const openDashboardOnStart = usePersistentState(
    (state) => state.openDashboardOnStart,
  );
  const setOpenDashboardOnStart = usePersistentState(
    (state) => state.setOpenDashboardOnStart,
  );
  const isTaskInstalled = useLiveState((state) => state.isTaskInstalled);
  const setIsTaskInstalled = useLiveState((state) => state.setIsTaskInstalled);
  const version = useLiveState((state) => state.version);
  const connectedClients = useLiveState((state) => state.connectedClients);

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
                  requestFromMain({
                    action: checked
                      ? "addScheduledTask"
                      : "removeScheduledTask",
                    payload: null,
                  });
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
                        requestFromMain({
                          action: "openDevTools",
                          payload: {
                            url: controllerClient?.href || "/controller",
                          },
                        })
                      }
                    >
                      controller
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() =>
                        requestFromMain({
                          action: "openDevTools",
                          payload: {
                            url: dashboardClient?.href || "/dashboard",
                          },
                        })
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
                              onClick={() =>
                                requestFromMain({
                                  action: "openDevTools",
                                  payload: { url: client.href },
                                })
                              }
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
