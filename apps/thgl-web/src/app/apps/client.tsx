"use client";
import { useState } from "react";
import Link from "next/link";
import { Input } from "@repo/ui/controls";
import { games } from "@repo/lib";
import { GameCard } from "@/components/game-card";
import { cn } from "@/lib/utils";

type FilterType = "all" | "companion" | "overwolf" | "web";

const FILTERS: { id: FilterType; label: string }[] = [
  { id: "all", label: "All Games" },
  { id: "companion", label: "Companion App" },
  { id: "overwolf", label: "Overwolf" },
  { id: "web", label: "Website" },
];

export function ClientAppsPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filtered = games.filter((game) => {
    // Search filter
    const matchesSearch = game.title
      .toLowerCase()
      .includes(search.toLowerCase());
    if (!matchesSearch) return false;

    // Platform filter
    switch (activeFilter) {
      case "companion":
        return !!game.companion;
      case "overwolf":
        return !!game.overwolf;
      case "web":
        return !!game.web;
      case "all":
      default:
        return true;
    }
  });

  return (
    <section className="px-4 pt-10 pb-20 mx-auto space-y-10 max-w-7xl">
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold">
          Supported <span className="text-primary">Games</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover interactive maps, overlays, and tools for your favorite games
        </p>
        <div className="max-w-md mx-auto">
          <Input
            type="search"
            placeholder="Search games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition",
              activeFilter === filter.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {filtered.length} {filtered.length === 1 ? "game" : "games"}
      </div>

      {/* Game Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          No games found matching your criteria
        </div>
      )}

      {/* Request New Game Support */}
      <div className="text-center pt-8 border-t border-border">
        <p className="text-muted-foreground text-sm">
          Don't see your game?{" "}
          <Link
            href="/faq/request-new-game-support"
            className="text-brand hover:underline font-medium"
          >
            Request new game support
          </Link>
        </p>
      </div>
    </section>
  );
}
