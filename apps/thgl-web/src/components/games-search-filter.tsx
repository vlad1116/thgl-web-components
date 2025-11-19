"use client";

import { Input } from "@repo/ui/controls";
import { games } from "@repo/lib";
import { GameCard } from "@/components/game-card";
import { FilterTabs } from "@/components/filter-tabs";
import { useGameFilter, type GameFilterType } from "@/hooks/use-game-filter";

const FILTERS: { id: GameFilterType; label: string }[] = [
  { id: "all", label: "All Games" },
  { id: "companion", label: "Companion App" },
  { id: "overwolf", label: "Overwolf" },
  { id: "web", label: "Website" },
];

export function GamesSearchFilter() {
  const { search, setSearch, activeFilter, setActiveFilter, filteredGames } =
    useGameFilter({ games });

  return (
    <div className="space-y-10">
      {/* Search Input */}
      <div className="max-w-md mx-auto">
        <Input
          type="search"
          placeholder="Search games..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-background"
        />
      </div>

      {/* Filter Tabs */}
      <FilterTabs
        filters={FILTERS}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Results Count */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {filteredGames.length}{" "}
        {filteredGames.length === 1 ? "game" : "games"}
      </div>

      {/* Game Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      {filteredGames.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          No games found matching your criteria
        </div>
      )}
    </div>
  );
}
