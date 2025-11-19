import { useState, useMemo } from "react";
import { type Game } from "@repo/lib";

export type GameFilterType = "all" | "companion" | "overwolf" | "web";

export interface UseGameFilterOptions {
  games: Game[];
  initialFilter?: GameFilterType;
}

export function useGameFilter({
  games,
  initialFilter = "all",
}: UseGameFilterOptions) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<GameFilterType>(initialFilter);

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
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
  }, [games, search, activeFilter]);

  return {
    search,
    setSearch,
    activeFilter,
    setActiveFilter,
    filteredGames,
  };
}
