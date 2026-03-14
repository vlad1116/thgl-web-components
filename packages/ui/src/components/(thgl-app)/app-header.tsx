"use client";
import { cn, useAccountStore } from "@repo/lib";
import { useState } from "react";
import {
  sendDebugSnapshot,
  setCloseAction as setCloseActionApi,
  useLiveState,
  CloseAction,
} from "@repo/lib/thgl-app";
import {
  Button,
  Checkbox,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Label,
} from "../(controls)";
import { Bug, Info, LogOut, Minus, Settings, Shield, User } from "lucide-react";
import { ExternalAnchor } from "../(header)";
import { AccountDialog } from "./account-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";

export function AppHeader({
  children,
  isOverlay,
  settingsDialogContent,
}: {
  children: React.ReactNode;
  isOverlay?: boolean;
  settingsDialogContent?: JSX.Element;
}) {
  const account = useAccountStore();
  const isRunningAsAdmin = useLiveState((state) => state.isRunningAsAdmin);
  const closeAction = useLiveState((state) => state.closeAction);
  const setCloseAction = useLiveState((state) => state.setCloseAction);
  const [isStartDragging, setIsStartDragging] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [rememberChoice, setRememberChoice] = useState(false);
  const [debugContext, setDebugContext] = useState("");
  const [isSendingDebug, setIsSendingDebug] = useState(false);
  const [isDebugDialogOpen, setIsDebugDialogOpen] = useState(false);
  const [debugStatus, setDebugStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  const handleSendDebugSnapshot = async () => {
    setIsSendingDebug(true);
    setDebugStatus("idle");
    try {
      await sendDebugSnapshot(debugContext || "No additional context provided");
      setDebugContext("");
      setDebugStatus("success");
      // Auto-close dialog after 2 seconds on success
      setTimeout(() => {
        setIsDebugDialogOpen(false);
        setDebugStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Failed to send debug snapshot:", error);
      setDebugStatus("error");
    } finally {
      setIsSendingDebug(false);
    }
  };

  const handleCloseClick = () => {
    if (closeAction === "ask") {
      setRememberChoice(false);
      setIsCloseDialogOpen(true);
      return;
    }
    if (closeAction === "closeWindow") {
      window.chrome.webview.postMessage("closeWindow");
    } else {
      window.chrome.webview.postMessage("exitApp");
    }
  };

  const handleCloseChoice = (choice: "closeWindow" | "exit") => {
    if (rememberChoice) {
      const action: CloseAction = choice === "closeWindow" ? "closeWindow" : "exit";
      setCloseActionApi(action)
        .then(() => setCloseAction(action))
        .catch(console.error);
    }
    setIsCloseDialogOpen(false);
    if (choice === "closeWindow") {
      window.chrome.webview.postMessage("closeWindow");
    } else {
      window.chrome.webview.postMessage("exitApp");
    }
  };

  return (
    <>
      <svg style={{ display: "none" }} xmlns="http://www.w3.org/2000/svg">
        <symbol id="window-control_close" viewBox="0 0 30 30">
          <line
            fill="none"
            stroke="currentcolor"
            strokeLinecap="round"
            x1="19.5"
            x2="10.5"
            y1="10.5"
            y2="19.5"
          />
          <line
            fill="none"
            stroke="currentcolor"
            strokeLinecap="round"
            x1="10.5"
            x2="19.5"
            y1="10.5"
            y2="19.5"
          />
        </symbol>
        <symbol id="window-control_maximize" viewBox="0 0 30 30">
          <rect
            fill="none"
            height="9"
            stroke="currentcolor"
            width="9"
            x="10.5"
            y="10.5"
          />
        </symbol>
        <symbol id="window-control_restore" viewBox="0 0 30 30">
          <polyline
            fill="none"
            points="13.5 12 13.5 9.5 20.5 9.5 20.5 16.5 18 16.5"
            stroke="currentcolor"
          />
          <rect
            fill="none"
            height="7"
            stroke="currentcolor"
            width="7"
            x="9.5"
            y="13.5"
          />
        </symbol>
        <symbol id="window-control_minimize" viewBox="0 0 30 30">
          <line
            fill="none"
            stroke="currentcolor"
            x1="10"
            x2="20"
            y1="19.5"
            y2="19.5"
          />
        </symbol>
      </svg>
      <header
        className={cn(
          "px-2 h-[32px] fixed left-0 right-0 top-0 border-b bg-gradient-to-b backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 flex items-center pointer-events-auto z-[999999]",
        )}
        onDoubleClick={() => {
          window.chrome.webview.postMessage("maximize");
        }}
        onMouseDown={() => {
          setIsStartDragging(true);
        }}
        onMouseUp={() => {
          setIsStartDragging(false);
        }}
        onMouseMove={() => {
          if (isStartDragging) {
            window.chrome.webview.postMessage("drag");
            setIsStartDragging(false);
          }
        }}
      >
        <nav
          className={cn(
            "ml-2 grow flex items-center gap-2 text-sm font-bold overflow-hidden",
            isOverlay ? "pr-[192px]" : "pr-[256px]",
          )}
        >
          {children}
          {isRunningAsAdmin && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-500 border border-amber-500/20">
              <Shield className="w-3 h-3" />
              <span>Admin</span>
            </div>
          )}
          <div
            className={cn("absolute top-0 right-0 h-[32px]")}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Button
              asChild
              size="icon"
              variant="ghost"
              className="h-full w-[32px]  hover:text-[#6974f3]"
            >
              <ExternalAnchor href="https://th.gl/discord">
                <svg
                  fill="currentColor"
                  height="20"
                  viewBox="0 0 16 16"
                  width="20"
                  className="h-full w-full p-1.5"
                >
                  <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z" />
                </svg>
              </ExternalAnchor>
            </Button>
            {settingsDialogContent && (
              <Dialog>
                <Button
                  asChild
                  size="icon"
                  variant="ghost"
                  className="h-full w-[32px]"
                >
                  <DialogTrigger>
                    <Settings className="h-full w-full p-1.5" />
                  </DialogTrigger>
                </Button>
                {settingsDialogContent}
              </Dialog>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-full w-[32px]"
              onClick={() => account.setShowUserDialog(true)}
            >
              <User
                className={cn(
                  "h-full w-full p-1.5",
                  account.userId && "fill-primary stroke-primary",
                )}
              />
            </Button>
            <AccountDialog />
            <Dialog
              open={isDebugDialogOpen}
              onOpenChange={setIsDebugDialogOpen}
            >
              <Button
                asChild
                size="icon"
                variant="ghost"
                className="h-full w-[32px]"
              >
                <DialogTrigger>
                  <Bug className="h-full w-full p-1.5" />
                </DialogTrigger>
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Debug Snapshot</DialogTitle>
                  <DialogDescription>
                    For bug reports, please join our{" "}
                    <a
                      href="https://th.gl/discord"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:no-underline"
                    >
                      Discord server
                    </a>{" "}
                    and describe your issue there. Only send debug logs if asked
                    by support.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Textarea
                    placeholder="Description provided to support (e.g., 'Standing next to ore that is not detected')"
                    value={debugContext}
                    onChange={(e) => setDebugContext(e.target.value)}
                    rows={5}
                    disabled={isSendingDebug}
                  />
                  {debugStatus === "success" && (
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                      ✓ Debug snapshot sent successfully!
                    </div>
                  )}
                  {debugStatus === "error" && (
                    <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                      ✗ Failed to send debug snapshot. Check console for
                      details.
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDebugDialogOpen(false);
                      setDebugStatus("idle");
                    }}
                    disabled={isSendingDebug}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendDebugSnapshot}
                    disabled={isSendingDebug}
                  >
                    {isSendingDebug ? "Sending..." : "Send"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <HoverCard openDelay={50} closeDelay={50}>
              <HoverCardTrigger asChild>
                <Button size="icon" variant="ghost" className="h-full w-[32px]">
                  <Info className="h-full w-full p-1.5" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent side="bottom" className="w-fit flex flex-col">
                <Button asChild variant="link">
                  <ExternalAnchor href="https://www.th.gl/legal-notice">
                    Legal Notice
                  </ExternalAnchor>
                </Button>
                <Button asChild variant="link">
                  <ExternalAnchor href="https://www.th.gl/privacy-policy">
                    Privacy Policy
                  </ExternalAnchor>
                </Button>
              </HoverCardContent>
            </HoverCard>
            {!isOverlay && (
              <button
                className="h-full w-[32px] inline-flex hover:bg-neutral-700"
                onClick={() => {
                  window.chrome.webview.postMessage("minimize");
                }}
                type="button"
              >
                <svg className="h-full">
                  <use xlinkHref="#window-control_minimize" />
                </svg>
              </button>
            )}
            {!isOverlay && (
              <button
                className="h-full w-[32px] inline-flex hover:bg-neutral-700"
                onClick={() => {
                  window.chrome.webview.postMessage("maximize");
                }}
                type="button"
              >
                <svg className="h-full">
                  <use xlinkHref="#window-control_restore" />
                </svg>
              </button>
            )}
            <button
              className="h-full w-[32px] inline-flex hover:bg-red-600"
              id="close"
              onClick={handleCloseClick}
              type="button"
            >
              <svg className="h-full">
                <use xlinkHref="#window-control_close" />
              </svg>
            </button>
          </div>
        </nav>
      </header>
      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Close window</DialogTitle>
            <DialogDescription>
              What would you like to do?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <button
              type="button"
              className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent transition-colors"
              onClick={() => handleCloseChoice("closeWindow")}
            >
              <Minus className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Close this window</div>
                <div className="text-xs text-muted-foreground">
                  Close the window, app keeps running in background
                </div>
              </div>
            </button>
            <button
              type="button"
              className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent transition-colors"
              onClick={() => handleCloseChoice("exit")}
            >
              <LogOut className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Exit application</div>
                <div className="text-xs text-muted-foreground">
                  Quit the entire app
                </div>
              </div>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember-close-choice"
              checked={rememberChoice}
              onCheckedChange={(checked) => setRememberChoice(checked === true)}
            />
            <Label
              htmlFor="remember-close-choice"
              className="text-sm font-normal text-muted-foreground cursor-pointer select-none"
            >
              Remember my choice
            </Label>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
