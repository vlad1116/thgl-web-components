import { games, getUpdateMessages } from "@repo/lib";
import { notFound } from "next/navigation";
import { GamePageClient } from "./client";

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = games.find((g) => g.id === id);

  if (!game) {
    notFound();
  }

  const updateMessages = await getUpdateMessages(game.discordId);

  return <GamePageClient game={game} updateMessages={updateMessages} />;
}

// No generateStaticParams: the parent (app)/[locale]/layout.tsx calls
// requireApp("thgl-app") → headers(), which is a dynamic API. Static
// gen of this route would throw DYNAMIC_SERVER_USAGE at build time
// AND at runtime when an unknown id is requested. The dashboard is
// per-user content anyway, so there's no caching benefit lost.
