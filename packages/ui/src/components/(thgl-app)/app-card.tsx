"use client";

import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button, Switch } from "../(controls)";
import {
  closeWebViews,
  openDesktopWebView,
  openDevToolsForUrl,
  requestSetWindowMode,
  useLiveState,
  usePersistentState,
} from "@repo/lib/thgl-app";
import { Game } from "@repo/lib";
import { Play, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export function AppCard({ game }: { game: Game }) {
  const [showDebug, setShowDebug] = useState(false);
  const disabledApps = usePersistentState((state) => state.disabledApps);
  const toggleDisabledApp = usePersistentState(
    (state) => state.toggleDisabledApp,
  );
  const connectedClients = useLiveState((state) => state.connectedClients);
  const windowMode = useLiveState((state) => state.windowMode);
  const setWindowMode = useLiveState((state) => state.setWindowMode);
  const isDisabled = disabledApps.includes(game.id);
  const companion = game.companion;
  if (!companion) {
    return null;
  }

  const fullBaseURL = companion.baseURL.startsWith("http")
    ? companion.baseURL
    : location.origin + companion.baseURL;

  const openClients = connectedClients?.filter(
    (connectedClient) =>
      connectedClient.role === "client" &&
      connectedClient.href.startsWith(fullBaseURL),
  ) ?? [];

  const appsOpenURLs = openClients.map((client) => client.href);
  const isRunning = appsOpenURLs.length > 0;
  const hasOverlayOpen = openClients.some((client) => client.href.includes("/overlay"));
  const hasDesktopOpen = openClients.some((client) => !client.href.includes("/overlay"));

  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-colors">
      <CardHeader className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative">
            <Image
              src={game.logo}
              alt=""
              width={48}
              height={48}
              className="rounded-lg"
            />
            {isRunning && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base leading-tight">
                  {game.title}
                </CardTitle>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Switch
                  checked={!isDisabled}
                  onCheckedChange={(checked) => {
                    toggleDisabledApp(game.id);
                    if (!checked && appsOpenURLs?.length) {
                      closeWebViews(appsOpenURLs);
                    }
                  }}
                />
                <span className="text-[10px] text-muted-foreground">
                  Auto-run
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        <Button
          disabled={isDisabled}
          size="sm"
          className="w-full"
          variant={isRunning ? "secondary" : "default"}
          onClick={async () => {
            // Determine new mode based on what's currently open
            let newMode: "overlay" | "desktop" | "both";
            if (hasOverlayOpen) {
              // Overlay is open, adding desktop → both
              newMode = "both";
            } else {
              // Nothing or only desktop open → desktop
              newMode = "desktop";
            }

            // Update mode if desktop isn't already open
            if (!hasDesktopOpen) {
              setWindowMode(newMode);
              await requestSetWindowMode(newMode).catch(console.error);
            }

            // Open desktop window
            openDesktopWebView(companion.desktopURL, game.title);
          }}
        >
          <Play className="h-4 w-4 mr-2" />
          {isRunning ? "Running" : "Launch App"}
        </Button>

        {isRunning && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-xs"
            onClick={() => setShowDebug(!showDebug)}
          >
            <span className="text-muted-foreground">Debug Tools</span>
            {showDebug ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        )}

        {showDebug && isRunning && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Inspect:</div>
            {appsOpenURLs?.map((url, index) => (
              <Button
                key={url}
                className="h-auto p-0 text-xs"
                variant="link"
                onClick={() => openDevToolsForUrl(url)}
              >
                {url.split("/").pop()?.toLowerCase()}
                {index < appsOpenURLs.length - 1 && ", "}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
