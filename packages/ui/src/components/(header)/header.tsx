"use client";

import { cn } from "@repo/lib";
import { HTMLAttributes } from "react";
import { FilterDetectionWarning } from "../(ads)";
import { GameSwitcher } from "./game-switcher";
import { Settings } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogTrigger } from "../ui/dialog";
import { User } from "./user";
import { ExternalAnchor } from "./external-anchor";
import { useT } from "../(providers)";

export function Header({
  children,
  activeApp,
  settingsDialogContent,
  infoActions: _infoActions,
  ...props
}: {
  children: React.ReactNode;
  activeApp: string;
  settingsDialogContent?: JSX.Element;
  infoActions?: JSX.Element;
} & HTMLAttributes<HTMLDivElement>): JSX.Element {
  const t = useT();

  return (
    <header
      className={cn(
        "px-2 h-[54px] z-[99990] fixed left-0 right-0 top-0 border-b bg-gradient-to-b backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 flex items-center",
        props.className,
      )}
      {...props}
    >
      {/* Game switcher — all screen sizes */}
      <GameSwitcher activeApp={activeApp} />

      {/* Navigation content (Brand, Links, Account) */}
      <nav className="ml-2 grow flex items-center gap-2 text-sm font-bold min-w-0">
        {children}
      </nav>

      {/* Social links — desktop only */}
      <div className="hidden md:flex items-center gap-1 ml-2">
        <ExternalAnchor
          className="p-2 hover:bg-muted rounded-md transition-colors"
          href="https://th.gl/discord"
          title="Discord"
        >
          <svg fill="currentColor" height="16" viewBox="0 0 16 16" width="16" className="opacity-70 hover:opacity-100">
            <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z" />
          </svg>
        </ExternalAnchor>
        <ExternalAnchor
          className="p-2 hover:bg-muted rounded-md transition-colors"
          href="https://github.com/The-Hidden-Gaming-Lair"
          title="GitHub"
        >
          <svg fill="currentColor" height="16" viewBox="0 0 16 16" width="16" className="opacity-70 hover:opacity-100">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </ExternalAnchor>
        <ExternalAnchor
          className="p-2 hover:bg-muted rounded-md transition-colors"
          href="https://www.reddit.com/r/TheHiddenGamingLair/"
          title="Reddit"
        >
          <svg fill="currentColor" height="16" viewBox="0 0 16 16" width="16" className="opacity-70 hover:opacity-100">
            <path d="M6.167 8a.831.831 0 0 0-.83.83c0 .459.372.84.83.831a.831.831 0 0 0 0-1.661zm1.843 3.647c.315 0 1.403-.038 1.976-.611a.232.232 0 0 0 0-.306.213.213 0 0 0-.306 0c-.353.363-1.126.487-1.67.487-.545 0-1.308-.124-1.671-.487a.213.213 0 0 0-.306 0 .213.213 0 0 0 0 .306c.564.563 1.652.61 1.977.61zm.992-2.807c0 .458.373.83.831.83.458 0 .83-.381.83-.83a.831.831 0 0 0-1.66 0z" />
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.828-1.165c-.315 0-.602.124-.812.325-.801-.573-1.9-.945-3.121-.993l.534-2.501 1.738.372a.83.83 0 1 0 .83-.869.83.83 0 0 0-.744.468l-1.938-.41a.203.203 0 0 0-.153.028.186.186 0 0 0-.086.134l-.592 2.788c-1.24.038-2.358.41-3.17.992-.21-.2-.496-.324-.81-.324a1.163 1.163 0 0 0-.478 2.224c-.02.115-.029.23-.029.353 0 1.795 2.091 3.256 4.669 3.256 2.577 0 4.668-1.451 4.668-3.256 0-.114-.01-.238-.029-.353.401-.181.688-.592.688-1.069 0-.65-.525-1.165-1.165-1.165z" />
          </svg>
        </ExternalAnchor>
      </div>

      {/* Action buttons — all screen sizes */}
      <div className="flex items-center gap-1 ml-2 shrink-0">
        {settingsDialogContent && (
          <Dialog>
            <Button asChild size="icon" title={t("settings")} variant="outline">
              <DialogTrigger>
                <Settings className="h-4 w-4" />
              </DialogTrigger>
            </Button>
            {settingsDialogContent}
          </Dialog>
        )}
        <User isExpanded={false} />
      </div>

      <FilterDetectionWarning />
    </header>
  );
}
