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
import { DiscordIcon, GitHubIcon, RedditIcon } from "./social-icons";
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
          <DiscordIcon className="opacity-70 hover:opacity-100" />
        </ExternalAnchor>
        <ExternalAnchor
          className="p-2 hover:bg-muted rounded-md transition-colors"
          href="https://github.com/The-Hidden-Gaming-Lair"
          title="GitHub"
        >
          <GitHubIcon className="opacity-70 hover:opacity-100" />
        </ExternalAnchor>
        <ExternalAnchor
          className="p-2 hover:bg-muted rounded-md transition-colors"
          href="https://www.reddit.com/r/TheHiddenGamingLair/"
          title="Reddit"
        >
          <RedditIcon className="opacity-70 hover:opacity-100" />
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
