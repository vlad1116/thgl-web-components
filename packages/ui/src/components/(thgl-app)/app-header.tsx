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
  Label,
} from "../(controls)";
import { Bug, CircleUser, ExternalLink as ExternalLinkIcon, LogOut, Menu, Minus, Settings, Shield } from "lucide-react";
import { ExternalAnchor } from "../(header)";
import { AccountDialog } from "./account-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { ScriptLoader } from "../(ads)/nitro-script";
import ConsentLink from "../(ads)/consent-link";

const GITHUB_SVG_PATH =
  "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z";

const REDDIT_SVG_PATHS = [
  "M6.167 8a.831.831 0 0 0-.83.83c0 .459.372.84.83.831a.831.831 0 0 0 0-1.661zm1.843 3.647c.315 0 1.403-.038 1.976-.611a.232.232 0 0 0 0-.306.213.213 0 0 0-.306 0c-.353.363-1.126.487-1.67.487-.545 0-1.308-.124-1.671-.487a.213.213 0 0 0-.306 0 .213.213 0 0 0 0 .306c.564.563 1.652.61 1.977.61zm.992-2.807c0 .458.373.83.831.83.458 0 .83-.381.83-.83a.831.831 0 0 0-1.66 0z",
  "M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.828-1.165c-.315 0-.602.124-.812.325-.801-.573-1.9-.945-3.121-.993l.534-2.501 1.738.372a.83.83 0 1 0 .83-.869.83.83 0 0 0-.744.468l-1.938-.41a.203.203 0 0 0-.153.028.186.186 0 0 0-.086.134l-.592 2.788c-1.24.038-2.358.41-3.17.992-.21-.2-.496-.324-.81-.324a1.163 1.163 0 0 0-.478 2.224c-.02.115-.029.23-.029.353 0 1.795 2.091 3.256 4.669 3.256 2.577 0 4.668-1.451 4.668-3.256 0-.114-.01-.238-.029-.353.401-.181.688-.592.688-1.069 0-.65-.525-1.165-1.165-1.165z",
] as const;

const DISCORD_SVG_PATH =
  "M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z";

function SocialIcon({ paths, className }: { paths: readonly string[]; className?: string }) {
  return (
    <svg fill="currentColor" height="14" viewBox="0 0 16 16" width="14" className={className}>
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export function AppHeader({
  title,
  children,
  isOverlay,
  settingsDialogContent,
}: {
  title?: React.ReactNode;
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  // Right button count: window controls + settings? + user + burger
  const windowControlCount = isOverlay ? 1 : 3; // close + min + max
  const actionButtonCount = 2 + (settingsDialogContent ? 1 : 0); // user, burger (+ settings)
  const rightPx = (windowControlCount + actionButtonCount) * 32;

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
        {title && (
          <div className="ml-2 shrink-0 flex items-center gap-2 text-sm font-bold">
            {title}
            {isRunningAsAdmin && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-500 border border-amber-500/20">
                <Shield className="w-3 h-3" />
                <span>Admin</span>
              </div>
            )}
          </div>
        )}
        <nav
          className="ml-2 grow flex items-center gap-2 text-sm font-bold overflow-hidden"
          style={{ paddingRight: rightPx }}
        >
          {children}
          {!title && isRunningAsAdmin && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-500 border border-amber-500/20">
              <Shield className="w-3 h-3" />
              <span>Admin</span>
            </div>
          )}
        </nav>

        {/* Right side buttons */}
        <div
          className="absolute top-0 right-0 h-[32px] flex items-center"
          onDoubleClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Settings — outline style matching web */}
          {settingsDialogContent && (
            <Button
              size="icon"
              variant="outline"
              className="h-6 w-6 mx-0.5"
              onClick={() => setIsSettingsOpen((v) => !v)}
              title="Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          )}
          {/* User — outline style matching web */}
          <Button
            size="icon"
            variant="outline"
            className="h-6 w-6 mx-0.5"
            onClick={() => account.setShowUserDialog(!account.showUserDialog)}
            title="Account"
          >
            <CircleUser
              className={cn(
                "h-3.5 w-3.5",
                account.userId && "text-primary",
              )}
            />
          </Button>
          {/* Burger menu — always visible */}
          <button
            className="h-full w-[32px] inline-flex items-center justify-center hover:bg-neutral-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            type="button"
            title="Menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Window controls */}
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
      </header>

      {/* Burger menu panel — all screen sizes */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-[999998]"
            onClick={() => setIsMenuOpen(false)}
          />
          <div
            className="fixed top-[32px] right-0 w-64 bg-zinc-900/95 backdrop-blur-xl border-b border-l border-neutral-800 p-3 flex flex-col gap-2 z-[999998] pointer-events-auto"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Social links */}
            <div className="flex items-center gap-1">
              <ExternalAnchor
                className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-[#6974f3] transition-colors"
                href="https://th.gl/discord"
                title="Discord"
              >
                <SocialIcon paths={[DISCORD_SVG_PATH]} />
              </ExternalAnchor>
              <ExternalAnchor
                className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors"
                href="https://github.com/The-Hidden-Gaming-Lair"
                title="GitHub"
              >
                <SocialIcon paths={[GITHUB_SVG_PATH]} className="opacity-70" />
              </ExternalAnchor>
              <ExternalAnchor
                className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors"
                href="https://www.reddit.com/r/TheHiddenGamingLair/"
                title="Reddit"
              >
                <SocialIcon paths={REDDIT_SVG_PATHS} className="opacity-70" />
              </ExternalAnchor>
              <div className="grow" />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => {
                  setIsDebugDialogOpen(true);
                  setIsMenuOpen(false);
                }}
                title="Send Debug Snapshot"
              >
                <Bug className="w-4 h-4" />
              </Button>
            </div>
            <Separator />
            {/* Legal links */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <ExternalAnchor
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                href="https://www.th.gl/legal-notice"
              >
                Legal Notice
                <ExternalLinkIcon className="w-2.5 h-2.5 opacity-40" />
              </ExternalAnchor>
              <ExternalAnchor
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                href="https://www.th.gl/privacy-policy"
              >
                Privacy Policy
                <ExternalLinkIcon className="w-2.5 h-2.5 opacity-40" />
              </ExternalAnchor>
              <ScriptLoader>
                <ConsentLink />
              </ScriptLoader>
            </div>
          </div>
        </>
      )}

      {/* Settings dialog (controlled) */}
      {settingsDialogContent && (
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          {settingsDialogContent}
        </Dialog>
      )}

      {/* Debug snapshot dialog */}
      <Dialog
        open={isDebugDialogOpen}
        onOpenChange={setIsDebugDialogOpen}
      >
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

      {/* Account dialog */}
      <AccountDialog />

      {/* Close action dialog */}
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
