"use client";

import { cn } from "@repo/lib";
import { useState } from "react";
import { Button } from "../(controls)";
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  Grid3x3,
  Newspaper,
  Settings,
  User,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../(controls)";
import { useAccountStore } from "@repo/lib";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
}

export function SidebarNav() {
  const [isExpanded, setIsExpanded] = useState(false);
  const account = useAccountStore();
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      id: "status",
      label: "Status",
      icon: Zap,
      href: "/dashboard/status",
    },
    {
      id: "apps",
      label: "Apps",
      icon: Grid3x3,
      href: "/dashboard/apps",
    },
    {
      id: "updates",
      label: "Updates",
      icon: Newspaper,
      href: "/dashboard/updates",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
    },
  ];

  return (
    <aside
      className={cn(
        "h-full border-r bg-card flex flex-col transition-all duration-300",
        isExpanded ? "w-[180px]" : "w-[60px]",
      )}
    >
      {/* Toggle Button */}
      <div className="p-3 border-b flex justify-center">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? (
            <ChevronLeft className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const button = (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={cn(
                "w-full transition-colors hover:bg-primary/10 hover:text-primary",
                isExpanded ? "justify-start" : "justify-center",
                isActive && "bg-primary/10 text-primary",
              )}
              asChild
            >
              <Link href={item.href}>
                <Icon className={cn("h-4 w-4", isExpanded && "mr-2")} />
                {isExpanded && <span className="text-sm">{item.label}</span>}
              </Link>
            </Button>
          );

          if (!isExpanded) {
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          return button;
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-2 border-t space-y-1">
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
