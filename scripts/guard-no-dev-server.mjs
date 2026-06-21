// Refuse to run a build while the games-web dev server is up.
//
// `next dev` (port 3100) and a build share output folders: a `next build`
// clobbers `apps/games-web/.next`, and rebuilding `@repo/lib`'s `dist` swaps the
// content-hashed chunks the running dev server already resolved — both surface as
// ChunkLoadError / "Cache-Control … revalidation of chunks" in the dev process.
// So stop the dev server before building.
//
// Fail-open: only blocks when a connection to 3100 actually succeeds (so CI,
// Docker, and any machine without a dev server build normally). Override with
// ALLOW_BUILD_WITH_DEV=1.
import net from "node:net";

const PORT = 3100;

// Only guard MANUAL builds (`bun run build` in a package) — the footgun. Builds
// orchestrated by turbo (the pre-push verify's typecheck `^build`, CI, the Docker
// image) set TURBO_HASH and are needed/safe, so let those through.
if (process.env.TURBO_HASH || process.env.ALLOW_BUILD_WITH_DEV === "1")
  process.exit(0);

const socket = net.connect({ port: PORT, host: "127.0.0.1" });
let settled = false;
const finish = (devRunning) => {
  if (settled) return;
  settled = true;
  socket.destroy();
  if (!devRunning) process.exit(0);
  console.error(
    `\n✖ Build aborted: the games-web dev server is running on port ${PORT}.\n` +
      `  A build clobbers the .next / dist output the dev server is using, which\n` +
      `  breaks it with ChunkLoadErrors. Stop the dev server first, then build\n` +
      `  (or set ALLOW_BUILD_WITH_DEV=1 to override).\n`,
  );
  process.exit(1);
};
socket.setTimeout(600);
socket.once("connect", () => finish(true));
socket.once("timeout", () => finish(false));
socket.once("error", () => finish(false)); // ECONNREFUSED → not running
