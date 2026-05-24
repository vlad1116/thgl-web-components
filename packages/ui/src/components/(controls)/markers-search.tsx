"use client";

import { cn, TilesConfig, useSettingsStore, useUserStore } from "@repo/lib";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Input } from "../ui/input";
import { MarkersSearchResults } from "./markers-search-results";
import { MarkersFilters } from "./markers-filters";
import { ScrollArea } from "../ui/scroll-area";
import {
  PanelLeftClose,
  Search,
  SlidersHorizontal,
  TriangleAlert,
  UnfoldVertical,
  X,
} from "lucide-react";
import { Separator } from "../ui/separator";
import { MapSelect } from "./map-select";
import { Presets } from "./presets";
import { GlobalFilters } from "./global-filters";
import { useT } from "../(providers)";

export function MarkersSearch({
  lastMapUpdate,
  appName,
  children,
  tileOptions,
  additionalFilters,
  embed,
  iconsPath,
  className,
  mapEnTitles,
}: {
  lastMapUpdate?: number;
  appName: string;
  children?: ReactNode;
  tileOptions: TilesConfig;
  additionalFilters?: ReactNode;
  embed?: boolean;
  iconsPath: string;
  className?: string;
  mapEnTitles?: Record<string, string>;
}): JSX.Element {
  const t = useT();
  const { _hasHydrated, search, setSearch, searchIsLoading } =
    useUserStore();
  const [internalSearch, setInternalSearch] = useState(search);
  const showFilters = useSettingsStore((state) => state.showFilters);
  const toggleShowFilters = useSettingsStore(
    (state) => state.toggleShowFilters,
  );

  const mapNames = Object.entries(tileOptions).map(([k, v]) => ({
    name: k,
    defaultTitle: v.defaultTitle || mapEnTitles?.[k] || t(k),
  }));

  useEffect(() => {
    if (_hasHydrated) {
      setInternalSearch(search);
    }
  }, [_hasHydrated]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch(internalSearch);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [internalSearch]);
  const isLoading = searchIsLoading || search !== internalSearch;

  // Mobile: collapse filters on first render
  const mobileInitRef = useRef(false);
  useEffect(() => {
    if (mobileInitRef.current || embed) return;
    mobileInitRef.current = true;
    if (window.matchMedia("(max-width: 767px)").matches && showFilters) {
      toggleShowFilters();
    }
  }, [_hasHydrated]);

  const panelVisible = showFilters;

  return (
    <>
      {/* Floating filter toggle when panel is hidden */}
      <button
        className={cn(
          "fixed top-[64px] left-2 z-[500] h-8 px-3 rounded-md border border-input bg-background shadow-sm flex items-center gap-1.5 text-xs font-medium cursor-pointer hover:bg-accent transition-all",
          panelVisible && "opacity-0 pointer-events-none",
          embed && "hidden",
          className,
        )}
        onClick={toggleShowFilters}
        type="button"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filters
      </button>

    <div
      className={cn(
        `fixed w-[200px] md:w-[300px] lg:w-[363px] top-[64px] z-[500] pointer-events-none flex flex-col gap-1`,
        `bottom-[60px] h-[calc(100vh-134px)] md:bottom-2 md:h-[calc(100vh-74px)]`,
        `transition-[left] duration-200`,
        panelVisible ? "left-2" : "left-[calc(-100%-8px)]",
        { "top-2 md:ml-0 h-[100vh]": embed },
        className,
      )}
    >
      <div
        className="relative flex w-full pointer-events-auto bg-card border rounded-md"
      >
        <Input
          autoComplete="off"
          autoCorrect="off"
          className=" placeholder:text-gray-400"
          onChange={(event) => {
            setInternalSearch(event.target.value);
          }}
          placeholder={t("markers.search.placeholder")}
          type="text"
          value={internalSearch}
        />
        {internalSearch ? (
          <button
            className="flex absolute inset-y-0 right-6 items-center pr-2 text-gray-400 hover:text-gray-200"
            onClick={() => {
              setInternalSearch("");
            }}
            type="button"
          >
            <svg
              className="block w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 0h24v24H0z" fill="none" stroke="none" />
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
            <div className="h-3/6 w-px bg-gray-600 mx-1.5" />
          </button>
        ) : (
          <div className="flex absolute inset-y-0 right-6 items-center pr-2 text-gray-400">
            <svg
              className="block w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <div className="h-3/6 w-px bg-gray-600 mx-1.5" />
          </div>
        )}
        <button
          aria-expanded={showFilters}
          aria-haspopup="menu"
          aria-label={showFilters ? "Close filters" : "Open filters"}
          className={cn(
            `flex absolute inset-y-0 right-1 items-center pr-2 text-gray-400 hover:text-gray-200 md:text-white`,
          )}
          onClick={toggleShowFilters}
          type="button"
        >
          {showFilters ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <UnfoldVertical className="h-4 w-4" />
          )}
        </button>
      </div>
      <div
        className={cn(
          "pointer-events-auto border rounded-md bg-card text-card-foreground shadow relative pb-1 overflow-hidden text-sm flex flex-col",
          {
            collapse: !showFilters,
          },
        )}
      >
        {lastMapUpdate && (
          <div className="text-[10px] text-muted-foreground px-2.5 py-1 uppercase tracking-wide">
            {t("markers.search.update")}{" "}
            <span className="tabular-nums">
              {new Date(lastMapUpdate).toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              })}
            </span>
          </div>
        )}
        {additionalFilters && (
          <div className="shrink-0 max-h-[50%] overflow-hidden flex flex-col">
            <ScrollArea type="auto">{additionalFilters}</ScrollArea>
            <Separator />
          </div>
        )}
        {mapNames.length > 1 && (
          <div className="shrink-0">
            <MapSelect mapNames={mapNames} />
            <Separator />
          </div>
        )}
        <div className="shrink-0">
          <Presets />
          <Separator />
          <GlobalFilters />
        </div>
        <ScrollArea type="auto" className="min-h-0">
          {internalSearch ? (
            <>
              {isLoading && internalSearch.length >= 3 && (
                <div className="p-2 text-center">
                  <Search className="w-4 h-4 mx-auto" />
                  {t("markers.search.searching")}
                </div>
              )}
              {internalSearch.length < 3 && (
                <div className="p-2 text-center">
                  <TriangleAlert className="w-4 h-4 mx-auto" />
                  {t("markers.search.moreCharacters")}
                </div>
              )}
              {!isLoading && internalSearch.length >= 3 && (
                <MarkersSearchResults
                  hasMultipleMaps={mapNames.length > 1}
                  appName={appName}
                  iconsPath={iconsPath}
                />
              )}
            </>
          ) : (
            <MarkersFilters appName={appName} iconsPath={iconsPath} />
          )}
        </ScrollArea>
      </div>
      <div className="grow" />
      {children}
    </div>
    </>
  );
}
