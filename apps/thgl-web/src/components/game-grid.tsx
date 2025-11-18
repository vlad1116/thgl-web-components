import Link from "next/link";
import { type Game } from "@repo/lib";
import { GameCard } from "./game-card";
import { SectionHeader } from "./sections";
import { cn } from "@/lib/utils";

interface GameGridProps {
  games: Game[];
  title?: string;
  description?: string;
  columns?: 2 | 3;
  showViewAll?: boolean;
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
}

export function GameGrid({
  games,
  title,
  description,
  columns = 3,
  showViewAll = false,
  viewAllHref = "/apps",
  viewAllLabel = "View all supported games →",
  className,
}: GameGridProps) {
  const gridClass = columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 md:grid-cols-3";

  return (
    <div className={cn("space-y-6", className)}>
      {title && <SectionHeader title={title} description={description} />}

      <div className={cn("grid gap-6", gridClass)}>
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      {showViewAll && (
        <div className="text-center pt-2">
          <Link
            href={viewAllHref}
            className="underline text-sm text-muted-foreground hover:text-white"
          >
            {viewAllLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
