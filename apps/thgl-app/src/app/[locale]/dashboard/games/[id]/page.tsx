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

export function generateStaticParams() {
  return games
    .filter((game) => game.companion)
    .map((game) => ({
      id: game.id,
    }));
}
