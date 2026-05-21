import Link from "next/link";
import { GamesSearchFilter } from "@/games/thgl-web/components/games-search-filter";

export function ClientAppsPage() {
  return (
    <section className="px-4 pt-10 pb-20 mx-auto space-y-10 max-w-7xl">
      {/* Static header - rendered on server */}
      <div className="text-center space-y-6">
        <h2 className="text-4xl md:text-5xl font-bold">
          Supported <span className="text-primary">Games</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover interactive maps, overlays, and tools for your favorite games
        </p>
      </div>

      {/* Interactive search/filter - client component */}
      <GamesSearchFilter />

      {/* Static footer - rendered on server */}
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
