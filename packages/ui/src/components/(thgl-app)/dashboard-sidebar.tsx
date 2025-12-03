"use client";

import { cn, games, useAccountStore } from "@repo/lib";
import {
  requestOpenInBrowser,
  useLiveState,
  usePersistentState,
} from "@repo/lib/thgl-app";
import { Button } from "../(controls)";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Settings,
  User,
  Circle,
  Globe,
  HelpCircle,
  Lightbulb,
  BookOpen,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../(controls)";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ScrollArea } from "../ui/scroll-area";

export function DashboardSidebar() {
  const isExpanded = usePersistentState((state) => state.sidebarExpanded);
  const setIsExpanded = usePersistentState((state) => state.setSidebarExpanded);
  const account = useAccountStore();
  const pathname = usePathname();
  const runningGames = useLiveState((state) => state.runningGames);

  // Separate companion games and web-only games
  const companionGames = games.filter((game) => game.companion);
  const webOnlyGames = games.filter((game) => !game.companion && game.web);

  const isGameRunning = (gameId: string) => {
    const game = games.find((g) => g.id === gameId);
    if (!game?.companion?.games) return false;

    const processNames = game.companion.games.flatMap((g) =>
      g.processNames.map((p) => p.toLowerCase()),
    );

    return runningGames?.some((rg) =>
      processNames.includes(rg.processName.toLowerCase()),
    );
  };

  return (
    <aside
      className={cn(
        "h-full border-r bg-card flex flex-col transition-all duration-300",
        isExpanded ? "w-[220px]" : "w-[60px]",
      )}
    >
      {/* Toggle Button */}
      <div className="p-2 border-b">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          size={isExpanded ? "sm" : "icon"}
          variant="outline"
          className={cn("w-full", isExpanded ? "justify-start" : "justify-center")}
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform", {
              "rotate-180": !isExpanded,
            })}
          />
          {isExpanded && <span className="ml-2 text-xs">Collapse</span>}
        </Button>
      </div>

      {/* Home Link */}
      <div className="p-2 border-b">
        <NavItem
          href="/dashboard"
          icon={<Home className="h-4 w-4" />}
          label="Home"
          isActive={pathname === "/dashboard"}
          isExpanded={isExpanded}
        />
      </div>

      {/* External Links */}
      <div className="p-2 border-b space-y-1">
        {isExpanded && (
          <span className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Resources
          </span>
        )}
        <ExternalNavItem
          url="https://www.th.gl/faq"
          icon={<HelpCircle className="h-4 w-4" />}
          label="FAQ"
          isExpanded={isExpanded}
        />
        <ExternalNavItem
          url="https://www.th.gl/suggestions-issues"
          icon={<Lightbulb className="h-4 w-4" />}
          label="Suggestions"
          isExpanded={isExpanded}
        />
        <ExternalNavItem
          url="https://www.th.gl/blog"
          icon={<BookOpen className="h-4 w-4" />}
          label="Blog"
          isExpanded={isExpanded}
        />
        <ExternalNavItem
          url="https://th.gl/discord"
          icon={<MessageCircle className="h-4 w-4" />}
          label="Discord"
          isExpanded={isExpanded}
        />
      </div>

      {/* Games List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isExpanded && (
            <span className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Games
            </span>
          )}
          {companionGames.map((game) => {
            const isActive = pathname === `/dashboard/games/${game.id}`;
            const isRunning = isGameRunning(game.id);

            return (
              <NavItem
                key={game.id}
                href={`/dashboard/games/${game.id}`}
                icon={
                  <div className="relative">
                    <Image
                      src={game.logo}
                      alt={game.title}
                      width={20}
                      height={20}
                      className="rounded"
                    />
                    {isRunning && (
                      <Circle className="absolute -bottom-0.5 -right-0.5 h-2 w-2 fill-green-500 text-green-500" />
                    )}
                  </div>
                }
                label={game.title}
                isActive={isActive}
                isExpanded={isExpanded}
              />
            );
          })}

          {/* Web-Only Games */}
          {webOnlyGames.length > 0 && (
            <>
              {isExpanded && (
                <span className="px-2 pt-3 text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                  Web Only
                </span>
              )}
              {webOnlyGames.map((game) => {
                const isActive = pathname === `/dashboard/games/${game.id}`;

                return (
                  <NavItem
                    key={game.id}
                    href={`/dashboard/games/${game.id}`}
                    icon={
                      <div className="relative">
                        <Image
                          src={game.logo}
                          alt={game.title}
                          width={20}
                          height={20}
                          className="rounded opacity-70"
                        />
                        <Globe className="absolute -bottom-0.5 -right-0.5 h-2 w-2 text-muted-foreground" />
                      </div>
                    }
                    label={game.title}
                    isActive={isActive}
                    isExpanded={isExpanded}
                  />
                );
              })}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Bottom Actions */}
      <div className="p-2 border-t space-y-1">
        <NavItem
          href="/dashboard/settings"
          icon={<Settings className="h-4 w-4" />}
          label="Settings"
          isActive={pathname === "/dashboard/settings"}
          isExpanded={isExpanded}
        />
        {isExpanded ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => account.setShowUserDialog(true)}
          >
            <User className="h-4 w-4 mr-2" />
            <span className="truncate text-xs">
              {account?.decryptedUserId ? account.decryptedUserId : "Sign in"}
            </span>
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                onClick={() => account.setShowUserDialog(true)}
              >
                <User className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>
                {account?.decryptedUserId ? account.decryptedUserId : "Sign in"}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </aside>
  );
}

function NavItem({
  href,
  icon,
  label,
  isActive,
  isExpanded,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isExpanded: boolean;
}) {
  const button = (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "w-full transition-colors hover:bg-primary/10 hover:text-primary",
        isExpanded ? "justify-start" : "justify-center",
        isActive && "bg-primary/10 text-primary",
      )}
      asChild
    >
      <Link href={href}>
        <span className={cn(isExpanded && "mr-2")}>{icon}</span>
        {isExpanded && (
          <span className="text-sm truncate">{label}</span>
        )}
      </Link>
    </Button>
  );

  if (!isExpanded) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}

function ExternalNavItem({
  url,
  icon,
  label,
  isExpanded,
}: {
  url: string;
  icon: React.ReactNode;
  label: string;
  isExpanded: boolean;
}) {
  const button = (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "w-full transition-colors hover:bg-primary/10 hover:text-primary",
        isExpanded ? "justify-start" : "justify-center",
      )}
      onClick={() => requestOpenInBrowser(url)}
    >
      <span className={cn(isExpanded && "mr-2")}>{icon}</span>
      {isExpanded && (
        <>
          <span className="text-sm truncate flex-1 text-left">{label}</span>
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </>
      )}
    </Button>
  );

  if (!isExpanded) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
