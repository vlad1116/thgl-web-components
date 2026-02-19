import { EventBus, MESSAGES } from "./event-bus";
import { getGameInfo, listenToGameLaunched, setFeatures } from "./games";
import { ActorPlayer } from "./plugin";

declare global {
  interface Window {
    gameEventBus: EventBus;
  }
}

export function listenToGEP(
  gameClassId: number,
  interestedInFeatures: string[],
  gameInfoToPlayer: (gameInfo: any) => ActorPlayer | null,
) {
  window.gameEventBus = new EventBus();

  let isActive = false;

  let firstPlayerData = false;
  let lastPlayerError = "";
  let prevPlayer: ActorPlayer | null = null;

  async function refreshPlayerState() {
    try {
      const latestGameInfo = await getGameInfo();

      const player = gameInfoToPlayer(latestGameInfo);
      if (!player) {
        setTimeout(refreshPlayerState, 50);
        return;
      }
      if (!firstPlayerData) {
        firstPlayerData = true;
        console.log("Got first data", JSON.stringify(player));
      }
      if (lastPlayerError) {
        lastPlayerError = "";
        window.gameEventBus.trigger(MESSAGES.PLAYER_ERROR, null);
      }
      if (
        !prevPlayer ||
        player.x !== prevPlayer.x ||
        player.y !== prevPlayer.y ||
        player.z !== prevPlayer.z ||
        player.r !== prevPlayer.r ||
        player.mapName !== prevPlayer.mapName
      ) {
        prevPlayer = player;
        window.gameEventBus.trigger(MESSAGES.PLAYER, player);
      }
      setTimeout(refreshPlayerState, 50);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : (err as string);
      if (errorMessage !== lastPlayerError) {
        lastPlayerError = errorMessage;
        window.gameEventBus.trigger(MESSAGES.PLAYER_ERROR, errorMessage);
      }
      setTimeout(refreshPlayerState, 200);
    }
  }

  listenToGameLaunched(() => {
    if (!isActive) {
      isActive = false;
      refreshPlayerState();
      console.log("Game launched -> start updating player position");
    }

    setTimeout(() => setFeatures(interestedInFeatures), 1000);
  }, gameClassId);
}
