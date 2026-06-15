import {
  Actor,
  createDwellTracker,
  initBackground,
  initGameEventsPlugin,
  sendActorsToAPI as sendActorsToAPIHelper,
} from "@repo/lib/overwolf";
import { fetchVersion } from "@repo/lib";
import { APP_CONFIG } from "./config";

const version = await fetchVersion(APP_CONFIG.name);
const typesIdMap = version.data.typesIdMap;
initGameEventsPlugin(
  {
    onActors: sendActorsToAPI,
  },
  Object.keys(typesIdMap),
);

let lastSend = 0;
let lastActorAddresses: number[] = [];
// Only report actors that have stayed visible for >= 5s, to drop transient
// memory-read / loading-state blinks that would otherwise become false spawns.
const dwellTracker = createDwellTracker();
async function sendActorsToAPI(actors: Actor[]) {
  // Observe every frame, before the send throttle, so dwell accrues continuously.
  dwellTracker.observe(actors);
  if (Date.now() - lastSend < 15000) {
    return;
  }
  lastSend = Date.now();
  const newActors = actors.filter(
    (actor) =>
      !lastActorAddresses.includes(actor.address) &&
      actor.type.startsWith("BP_MapObject_") &&
      dwellTracker.isStable(actor.address),
  );
  lastActorAddresses = actors.map((actor) => actor.address);
  if (newActors.length === 0) {
    return;
  }
  await sendActorsToAPIHelper("palworld", newActors);
}

await initBackground(
  APP_CONFIG.gameClassId,
  APP_CONFIG.appId,
  APP_CONFIG.discordApplicationId,
);
