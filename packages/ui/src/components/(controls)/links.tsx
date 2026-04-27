"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ExternalAnchor,
  DiscordIcon,
  GitHubIcon,
  RedditIcon,
} from "../(header)";
import { ExternalLink, MoreHorizontal, Menu } from "lucide-react";
import { AppConfig, localizePath, cn } from "@repo/lib";
import { Badge } from "../ui/badge";
import { useI18n } from "../(providers)";
import { ScriptLoader } from "../(ads)";
import ConsentLink from "../(ads)/consent-link";

const NAV_BEFORE = [
  { href: "/", title: "home.title" },
  { href: "/maps", title: "interactive_map" },
] as const;

const NAV_AFTER = [
  { href: "/guides", title: "config.internalLinks.guides.title" },
] as const;

export function Links({
  appConfig,
  hideReleaseNotes,
  children,
}: {
  appConfig: AppConfig;
  hideReleaseNotes?: boolean;
  children?: React.ReactNode;
}): JSX.Element {
  const pathname = usePathname();
  const { locale, t } = useI18n();
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const resolvedItems = useMemo(() => {
    const appLinks =
      appConfig.internalLinks?.filter(
        (l) =>
          l.href !== "/" &&
          !l.href.startsWith("/maps") &&
          !l.href.startsWith("/guides"),
      ) ?? [];

    // Order: Home, Maps, app-specific links, Guides, In-Game App
    const allLinks: { href: string; title: string; external?: boolean }[] = [
      ...NAV_BEFORE,
      ...appLinks,
      ...NAV_AFTER,
    ];

    return allLinks.map((l) => {
      const href = localizePath(l.href, locale);
      const isHome = l.href === "/";
      const isActive = isHome
        ? pathname === "/" || pathname === `/${locale}`
        : pathname.startsWith(href);
      return { href, label: t(l.title), isActive, rawHref: l.href };
    });
  }, [appConfig.internalLinks, appConfig.appUrl, locale, pathname, t]);

  // Measure how many links fit inline
  useEffect(() => {
    function measure() {
      if (!containerRef.current || !measureRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const children = measureRef.current.children;
      let total = 0;
      let count = 0;
      const moreButtonWidth = 40;

      for (let i = 0; i < children.length; i++) {
        const childWidth = (children[i] as HTMLElement).offsetWidth + 4;
        if (total + childWidth + moreButtonWidth > containerWidth) break;
        total += childWidth;
        count++;
      }
      setVisibleCount(Math.max(1, count));
    }

    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!overflowOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !mobileMenuRef.current?.contains(target)
      ) {
        setOverflowOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [overflowOpen]);

  // Close when navigating
  useEffect(() => {
    setOverflowOpen(false);
  }, [pathname]);

  const visibleItems = resolvedItems.slice(0, visibleCount);
  const overflowItems = resolvedItems.slice(visibleCount);
  const hasOverflow = overflowItems.length > 0;
  const overflowHasActive = overflowItems.some((item) => item.isActive);

  const externalContent = (
    <>
      {appConfig.promoLinks?.map(({ href, title }) => (
        <Link key={href} href={localizePath(href, locale)}>
          <Badge>{t(title)}</Badge>
        </Link>
      ))}
      {appConfig.externalLinks?.map(({ href, title }) => (
        <ExternalAnchor
          key={href}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-input bg-background/50 hover:bg-accent hover:text-accent-foreground transition-colors"
          href={href}
        >
          {t(title)}
          <ExternalLink className="w-3 h-3 opacity-50" />
        </ExternalAnchor>
      ))}
    </>
  );

  const legalFooter = (
    <>
      <ExternalAnchor
        className="block px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-zinc-800 transition-colors"
        href="https://www.th.gl/legal-notice"
      >
        {t("legal_notice")}
      </ExternalAnchor>
      <ExternalAnchor
        className="block px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-zinc-800 transition-colors"
        href="https://www.th.gl/privacy-policy"
      >
        {t("privacy_policy")}
      </ExternalAnchor>
    </>
  );

  const dropdownContent = (items: typeof resolvedItems, showAll = false, alignLeft = false) => (
    <div className={cn("absolute top-full mt-1 w-52 rounded-lg border border-neutral-700 bg-zinc-900 shadow-2xl z-50 py-1", alignLeft ? "left-0" : "right-0")}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "block px-3 py-2 text-sm transition-colors",
            item.isActive
              ? "text-amber-400 bg-amber-900/20"
              : "text-muted-foreground hover:text-foreground hover:bg-zinc-800",
          )}
        >
          {item.label}
        </Link>
      ))}

      {/* Promo/external links */}
      {/* In-Game App — mobile only (desktop shows it in header) */}
      {showAll && appConfig.appUrl && (
        <>
          <div className="border-t border-neutral-800 my-1" />
          <ExternalAnchor
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-zinc-800 transition-colors"
            href={appConfig.appUrl}
          >
            {t("links.inGameApp")}
            <ExternalLink className="w-3 h-3 opacity-50" />
          </ExternalAnchor>
        </>
      )}

      {/* Promo/external links */}
      {!!(appConfig.promoLinks?.length || appConfig.externalLinks?.length) && (
        <div className="flex flex-wrap gap-1.5 px-3 py-2">
          {externalContent}
        </div>
      )}

      {/* Locale switcher + social icons */}
      {(showAll || (children && hasOverflow)) && (
        <>
          <div className="border-t border-neutral-800 my-1" />
          <div className="flex items-center justify-center gap-1.5 px-3 py-2">
            {(showAll || hasOverflow) && children}
            {showAll && (
              <>
                <ExternalAnchor
                  className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background/50 hover:bg-accent transition-colors"
                  href="https://th.gl/discord"
                  title="Discord"
                >
                  <DiscordIcon size={14} className="opacity-70" />
                </ExternalAnchor>
                <ExternalAnchor
                  className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background/50 hover:bg-accent transition-colors"
                  href="https://github.com/The-Hidden-Gaming-Lair"
                  title="GitHub"
                >
                  <GitHubIcon size={14} className="opacity-70" />
                </ExternalAnchor>
                <ExternalAnchor
                  className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background/50 hover:bg-accent transition-colors"
                  href="https://www.reddit.com/r/TheHiddenGamingLair/"
                  title="Reddit"
                >
                  <RedditIcon size={14} className="opacity-70" />
                </ExternalAnchor>
              </>
            )}
          </div>
        </>
      )}

      <div className="border-t border-neutral-800 my-1" />
      {legalFooter}
      <ScriptLoader>
        <div className="px-3 py-1">
          <ConsentLink />
        </div>
      </ScriptLoader>
    </div>
  );

  return (
    <>
      {/* Hidden measurer */}
      <div
        ref={measureRef}
        className="flex items-center gap-1 absolute -left-[9999px] opacity-0 pointer-events-none"
        aria-hidden
      >
        {resolvedItems.map((item) => (
          <span key={item.href} className="text-xs px-2.5 py-1.5 whitespace-nowrap">
            {item.label}
          </span>
        ))}
      </div>

      {/* Mobile: hamburger menu */}
      <div className="sm:hidden relative" ref={mobileMenuRef}>
        <button
          onClick={() => setOverflowOpen((v) => !v)}
          aria-label="Navigation menu"
          className="text-xs px-2.5 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-zinc-800 transition-colors flex items-center gap-1"
        >
          <Menu className="w-4 h-4" />
        </button>
        {overflowOpen && dropdownContent(resolvedItems, true, true)}
      </div>

      {/* Desktop: inline links with overflow */}
      <div ref={containerRef} className="flex-1 hidden sm:flex items-center gap-1 min-w-0">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-xs px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap",
              item.isActive
                ? "bg-amber-900/30 text-amber-400"
                : "text-muted-foreground hover:text-foreground hover:bg-zinc-800",
            )}
          >
            {item.label}
          </Link>
        ))}

        {/* More/overflow button */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setOverflowOpen((v) => !v)}
            aria-label="More navigation links"
            className={cn(
              "text-xs px-2 py-1.5 rounded-md transition-colors",
              overflowHasActive
                ? "bg-amber-900/30 text-amber-400"
                : overflowOpen
                  ? "bg-zinc-800 text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-zinc-800",
            )}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {overflowOpen &&
            dropdownContent(overflowItems, false)}
        </div>

      </div>
    </>
  );
}
