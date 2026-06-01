import dotenv from "dotenv";

import "reflect-metadata";

import { readFileSync } from "node:fs";

import {
  OwCliContainer,
  PromoteToProdCommand,
  ReleaseOpkCommand,
} from "@overwolf/ow-cli/bin/index.js";

dotenv.config({ path: ".env.local" });

// Overwolf application UID and the *name* (not numeric id) of the preview
// channel the test build was uploaded to. Both are passed in from the workflow,
// next to PREVIEW_ACCESS_CHANNEL_ID. promote-to-prod only accepts the channel
// name, and there is no API to resolve it from the id.
const APP_ID = process.env.OW_APP_ID;
const SOURCE_CHANNEL = process.env.PREVIEW_ACCESS_CHANNEL_NAME;

if (!APP_ID) {
  console.error("OW_APP_ID is required.");
  process.exit(1);
}
if (!SOURCE_CHANNEL) {
  console.error(
    "PREVIEW_ACCESS_CHANNEL_NAME is required (the preview channel name to promote from).",
  );
  process.exit(1);
}

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const version = manifest?.meta?.version;

if (!version) {
  console.error("Could not read meta.version from manifest.json");
  process.exit(1);
}

OwCliContainer.init();
console.log("Initialized OW CLI container");

const promoteCmd = OwCliContainer.resolve(PromoteToProdCommand);
const releaseCmd = OwCliContainer.resolve(ReleaseOpkCommand);

console.log(
  `Promoting version ${version} from channel "${SOURCE_CHANNEL}" to production...`,
);
const versionId = await promoteCmd.handler({
  appId: APP_ID,
  sourceChannel: SOURCE_CHANNEL,
  version,
});
console.log(`Promoted to production (version id ${versionId})`);

await releaseCmd.handler({
  versionId,
  percent: 100,
});
console.log(`Released version ${version} to 100% of production users.`);
