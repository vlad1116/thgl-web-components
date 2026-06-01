#!/usr/bin/env node
// Dump or bump the meta.version of every Overwolf app manifest.
//
// Usage:
//   node scripts/bump-version.mjs                 # dump current versions
//   node scripts/bump-version.mjs major           # bump major for all apps  (X.0.0)
//   node scripts/bump-version.mjs minor           # bump minor for all apps  (X.Y.0)
//   node scripts/bump-version.mjs fix             # bump patch for all apps  (X.Y.Z+1)
//   node scripts/bump-version.mjs fix diablo4     # bump patch for one app only
//
// "patch" is accepted as an alias for "fix". Bumping follows semver: a major
// bump resets minor+patch to 0, a minor bump resets patch to 0.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const APPS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "apps");
const BUMP_TYPES = { major: 0, minor: 1, fix: 2, patch: 2 };

function usage() {
  console.log(
    [
      "Dump or bump the version in the Overwolf app manifests.",
      "",
      "Usage:",
      "  node scripts/bump-version.mjs                 dump current versions",
      "  node scripts/bump-version.mjs <major|minor|fix> [app]  bump (all apps, or one)",
      "",
      "'patch' is an alias for 'fix'. Major/minor bumps reset lower parts to 0.",
    ].join("\n"),
  );
}

// Find every apps/*-overwolf/manifest.json
function findManifests() {
  return readdirSync(APPS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.endsWith("-overwolf"))
    .map((d) => ({ app: d.name, path: join(APPS_DIR, d.name, "manifest.json") }))
    .filter((m) => {
      try {
        readFileSync(m.path);
        return true;
      } catch {
        return false;
      }
    })
    .sort((a, b) => a.app.localeCompare(b.app));
}

function readVersion(path) {
  return JSON.parse(readFileSync(path, "utf8"))?.meta?.version;
}

function bump(version, type) {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n))) {
    throw new Error(`Unexpected version "${version}" (expected X.Y.Z)`);
  }
  const i = BUMP_TYPES[type];
  parts[i] += 1;
  for (let j = i + 1; j < parts.length; j++) parts[j] = 0;
  return parts.join(".");
}

// Replace meta.version in place, preserving the file's exact formatting and
// line endings (a targeted string swap rather than re-serializing the JSON).
function writeVersion(path, oldVersion, newVersion) {
  const text = readFileSync(path, "utf8");
  const needle = `"version": "${oldVersion}"`;
  const count = text.split(needle).length - 1;
  if (count !== 1) {
    throw new Error(
      `Expected exactly one '${needle}' in ${path}, found ${count}`,
    );
  }
  writeFileSync(path, text.replace(needle, `"version": "${newVersion}"`));
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    usage();
    return;
  }

  const [type, appFilter] = args;
  if (type !== undefined && !(type in BUMP_TYPES)) {
    console.error(`Unknown bump type "${type}". Use major, minor, or fix.\n`);
    usage();
    process.exitCode = 1;
    return;
  }

  let manifests = findManifests();
  if (appFilter) {
    const want = appFilter.endsWith("-overwolf")
      ? appFilter
      : `${appFilter}-overwolf`;
    manifests = manifests.filter((m) => m.app === want);
    if (manifests.length === 0) {
      console.error(`No Overwolf app matching "${appFilter}".`);
      process.exitCode = 1;
      return;
    }
  }

  const pad = Math.max(...manifests.map((m) => m.app.length));

  // Dump mode
  if (!type) {
    for (const { app, path } of manifests) {
      console.log(`${app.padEnd(pad)}  ${readVersion(path)}`);
    }
    return;
  }

  // Bump mode
  for (const { app, path } of manifests) {
    const oldVersion = readVersion(path);
    const newVersion = bump(oldVersion, type);
    writeVersion(path, oldVersion, newVersion);
    console.log(`${app.padEnd(pad)}  ${oldVersion} -> ${newVersion}`);
  }
}

main();
