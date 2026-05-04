"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { localizePath, cn } from "@repo/lib";
import { MoreHorizontal, Menu } from "lucide-react";

type NavItem = {
  href: string;
  labelKey: string;
  fallback: string;
  primary?: boolean; // primary links show inline when space allows
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "ui.nav_home", fallback: "Home", primary: true },
  { href: "/db/units", labelKey: "ui.nav_units", fallback: "Units", primary: true },
  { href: "/db/heroes", labelKey: "ui.nav_heroes", fallback: "Heroes", primary: true },
  { href: "/db/spells", labelKey: "ui.nav_spells", fallback: "Spells", primary: true },
  { href: "/db/artifacts", labelKey: "ui.nav_artifacts", fallback: "Artifacts", primary: true },
  { href: "/db/skills", labelKey: "ui.nav_skills", fallback: "Skills", primary: true },
  { href: "/db/factions", labelKey: "ui.nav_factions", fallback: "Factions", primary: true },
];

const EXTRA_LINKS = [
  { href: "https://th.gl/privacy", label: "Privacy Policy" },
  { href: "https://th.gl/terms", label: "Terms of Service" },
];

function resolveLabel(dict: Record<string, string>, key: string, fallback: string): string {
  const value = dict[key];
  if (!value) return fallback;
  if (value[0] === "@") return dict[value] ?? fallback;
  return value;
}

export function DbNavLinks({ locale = "en", dict = {} }: { locale?: string; dict?: Record<string, string> }) {
  const pathname = usePathname();
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(NAV_ITEMS.length);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Measure how many links fit
  useEffect(() => {
    function measure() {
      if (!containerRef.current || !measureRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const children = measureRef.current.children;
      let total = 0;
      let count = 0;
      const moreButtonWidth = 40;

      for (let i = 0; i < children.length; i++) {
        const childWidth = (children[i] as HTMLElement).offsetWidth + 4; // gap
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
      const inMenu = menuRef.current?.contains(target);
      const inMobile = mobileMenuRef.current?.contains(target);
      if (!inMenu && !inMobile) {
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

  const resolvedItems = NAV_ITEMS.map((item) => ({
    ...item,
    label: resolveLabel(dict, item.labelKey, item.fallback),
  }));
  const visibleItems = resolvedItems.slice(0, visibleCount);
  const overflowItems = resolvedItems.slice(visibleCount);
  const hasOverflow = overflowItems.length > 0;

  return (
    <>
      {/* Hidden measurer — renders all items offscreen to measure widths */}
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

      {/* Mobile-only menu button */}
      <div className="sm:hidden relative" ref={mobileMenuRef}>
        <button
          onClick={() => setOverflowOpen((v) => !v)}
          aria-label="Navigation menu"
          className="text-xs px-2.5 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-zinc-800 transition-colors flex items-center gap-1"
        >
          <Menu className="w-4 h-4" />
        </button>
        {overflowOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 rounded-lg border border-neutral-700 bg-zinc-900 shadow-2xl z-50 py-1">
            {resolvedItems.map((item) => {
              const href = localizePath(item.href, locale);
              const isHome = item.href === "/";
              const isActive = isHome
                ? pathname === "/" || pathname === `/${locale}`
                : pathname.startsWith(href);
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={cn(
                    "block px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "text-amber-400 bg-amber-900/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-zinc-800",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="border-t border-neutral-800 my-1" />
            {EXTRA_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-zinc-800 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Desktop nav */}
      <div ref={containerRef} className="flex-1 hidden sm:flex items-center gap-1 min-w-0">
        {visibleItems.map((item) => {
          const href = item.href.startsWith("http")
            ? item.href
            : localizePath(item.href, locale);
          const isHome = item.href === "/";
          const isActive = isHome
            ? pathname === "/" || pathname === `/${locale}`
            : pathname.startsWith(href);

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "text-xs px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap",
                isActive
                  ? "bg-amber-900/30 text-amber-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-zinc-800",
              )}
            >
              {item.label}
            </Link>
          );
        })}

        {/* More button */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setOverflowOpen((v) => !v)}
            aria-label="More navigation links"
            className={cn(
              "text-xs px-2 py-1.5 rounded-md transition-colors",
              overflowOpen
                ? "bg-zinc-800 text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-zinc-800",
            )}
            title="More"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {overflowOpen && (
            <div className="absolute top-full right-0 mt-1 w-48 rounded-lg border border-neutral-700 bg-zinc-900 shadow-2xl z-50 py-1">
              {/* Overflow nav items */}
              {overflowItems.map((item) => {
                const href = localizePath(item.href, locale);
                const isActive = pathname.startsWith(href);
                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={cn(
                      "block px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "text-amber-400 bg-amber-900/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-zinc-800",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Separator + extra links */}
              <div className="border-t border-neutral-800 my-1" />
              {EXTRA_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-zinc-800 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
