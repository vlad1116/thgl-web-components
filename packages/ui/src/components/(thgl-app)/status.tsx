"use client";
import { requestFromMain, useLiveState } from "@repo/lib/thgl-app";
import { Separator } from "../ui/separator";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../(controls)";
import { useAccountStore } from "@repo/lib";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Gamepad2,
  User,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { useState } from "react";

export function Status() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const account = useAccountStore();
  const runningGames = useLiveState((state) => state.runningGames);
  const version = useLiveState((state) => state.version);
  const isRunningAsAdmin = useLiveState((state) => state.isRunningAsAdmin);
  const connectedClients = useLiveState((state) => state.connectedClients);
  const controllerClient = connectedClients?.find(
    (client) => client.role === "controller",
  );
  const dashboardClient = connectedClients?.find(
    (client) => client.role === "dashboard",
  );

  return (
    <>
      {isRunningAsAdmin === false && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Admin Rights Required</AlertTitle>
          <AlertDescription>
            Running as standard user. Some features may not work properly.
            Please restart as administrator.
          </AlertDescription>
        </Alert>
      )}
      <div className="rounded-lg border bg-card">
        {/* Running Games */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Currently Running</span>
          </div>
          {runningGames && runningGames.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {runningGames.map((game) => (
                <Badge key={game.processName} variant="secondary">
                  {game.processName}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No supported games detected
            </p>
          )}
        </div>

        <Separator />

        {/* Account */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Account</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => account.setShowUserDialog(true)}
          >
            {account?.decryptedUserId ? (
              <>
                <User className="h-4 w-4 mr-2" />
                {account.decryptedUserId}
              </>
            ) : (
              <>
                <User className="h-4 w-4 mr-2" />
                Sign in with Patreon
              </>
            )}
          </Button>
        </div>

        {/* Advanced Section (Collapsible) */}
        <Separator />
        <div className="p-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <span className="text-sm font-medium">Developer Tools</span>
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {showAdvanced && (
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Version:</span>
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
              <div>
                <span>Inspect: </span>
                <Button
                  className="h-auto p-0"
                  variant="link"
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
                {", "}
                <Button
                  className="h-auto p-0"
                  variant="link"
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
          )}
        </div>
      </div>
    </>
  );
}
