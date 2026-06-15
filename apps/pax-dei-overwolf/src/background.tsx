import {
  Actor,
  closeMainWindow,
  createDwellTracker,
  initBackground,
  initGameEventsPlugin,
  sendActorsToAPI as sendActorsToAPIHelper,
} from "@repo/lib/overwolf";
import { fetchVersion } from "@repo/lib";
import { APP_CONFIG } from "./config";

try {
  const version = await fetchVersion(APP_CONFIG.name);
  const typesIdMap = version.data.typesIdMap;
  await initGameEventsPlugin(
    {
      onPureActors: senActorsToGamingTools,
      onActors: sendActorsToAPI,
    },
    Object.keys(typesIdMap),
    undefined,
    undefined,
    (actor) => {
      const offset = actor.mapName === "gallia_pve_01" ? SMALL : LARGE;

      const x = actor.x - offset.OFFSET_X;
      const y = actor.y - offset.OFFSET_Y;
      const angle = toRadians(-offset.CAMERA_ANGLE);
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      const newX = x * cosAngle - y * sinAngle;
      const newY = x * sinAngle + y * cosAngle;

      actor.x = newY;
      actor.y = newX;
    },
  );
} catch (err) {
  await closeMainWindow();
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

const SMALL = {
  ORTHOGRAPHIC_WIDTH: 409600,
  OFFSET_X: 409600 / 2,
  OFFSET_Y: -409600 / 2,
  CAMERA_ANGLE: 0,
};
const LARGE = {
  ORTHOGRAPHIC_WIDTH: 1024000 * 1.6,
  OFFSET_X: (1024000 * 1.6) / 2,
  OFFSET_Y: -(1024000 * 0.4) / 2,
  CAMERA_ANGLE: 0,
};

let lastSend = 0;
let lastActorAddresses: number[] = [];
// Only report actors that have stayed visible for >= 5s, to drop transient
// memory-read / loading-state blinks that would otherwise become false spawns.
const dwellTracker = createDwellTracker();
async function sendActorsToAPI(actors: Actor[]) {
  // Observe every frame, before the send throttle, so dwell accrues continuously.
  dwellTracker.observe(actors);
  if (Date.now() - lastSend < 10000) {
    return;
  }
  lastSend = Date.now();
  const newActors = actors.filter(
    (actor) =>
      !lastActorAddresses.includes(actor.address) &&
      dwellTracker.isStable(actor.address),
  );
  lastActorAddresses = actors.map((actor) => actor.address);
  if (newActors.length === 0) {
    return;
  }
  await sendActorsToAPIHelper("pax-dei", newActors);
}

let lastSendGT = 0;
let lastActorAddressesGT: number[] = [];
const dwellTrackerGT = createDwellTracker();
async function senActorsToGamingTools(actors: Actor[]) {
  // Observe every frame, before the send throttle, so dwell accrues continuously.
  dwellTrackerGT.observe(actors);
  if (Date.now() - lastSendGT < 10000) {
    return;
  }
  lastSendGT = Date.now();
  const newActors = actors.filter(
    (actor) =>
      !lastActorAddressesGT.includes(actor.address) &&
      dwellTrackerGT.isStable(actor.address),
  );
  lastActorAddressesGT = actors.map((actor) => actor.address);
  if (newActors.length === 0) {
    return;
  }
  try {
    await fetch(
      "https://paxdei-api.gaming.tools/api/v2/location-reports/thgl",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          newActors.map((a) => ({
            entityId: a.type,
            mapId: a.mapName,
            x: a.x,
            y: a.y,
            z: a.z,
          })),
        ),
      },
    );
  } catch (e) {
    //
  }
}

await initBackground(
  APP_CONFIG.gameClassId,
  APP_CONFIG.appId,
  APP_CONFIG.discordApplicationId,
);
