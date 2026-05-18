import { revalidateTag } from "next/cache";
import { palia } from "@/configs/palia";

/**
 * On-demand revalidation endpoint. Currently only Palia uses this — it
 * gets pinged when the upstream palia-api updates leaderboard,
 * rummage-pile, or weekly-wants data and we want the next page render
 * to bust the `force-cache` / tagged data fetches.
 *
 * Secret-gated; no per-tenant routing needed because revalidateTag is
 * a global Next cache primitive and only palia routes set these tags.
 *
 * Two cache layers are invalidated:
 *
 *   1. Next.js Data Cache (`revalidateTag`) — refreshes the upstream
 *      fetch on the next render. Works natively on the Bunny container.
 *   2. Bunny CDN edge cache (`purgeBunny`) — the container has fresh
 *      data after step 1, but Bunny still serves the prior 60s-cached
 *      HTML until the s-maxage expires. Purge explicitly so end users
 *      see the update within seconds instead of up to a minute.
 *
 * The Bunny purge is fire-and-forget (`async=true`) — the response to
 * the caller doesn't block on Bunny round-trips.
 */

// Map upstream tag → palia path. Tags we don't know about still get
// revalidateTag()-ed (in case palia-api adds new ones), but we skip the
// edge purge for them since we don't know which URL to invalidate.
const TAG_TO_PATH: Record<string, string> = {
  leaderboard: "/leaderboard",
  "rummage-pile": "/rummage-pile",
  "weekly-wants": "/weekly-wants",
};

async function purgeBunny(urls: string[]): Promise<void> {
  const accessKey = process.env.BUNNY_ACCOUNT_API_KEY;
  if (!accessKey || urls.length === 0) return;

  await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(
          `https://api.bunny.net/purge?url=${encodeURIComponent(url)}&async=true`,
          {
            method: "POST",
            headers: { AccessKey: accessKey, accept: "application/json" },
          },
        );
        if (!res.ok) {
          console.error(`Bunny purge failed (${res.status}): ${url}`);
        }
      } catch (err) {
        console.error(`Bunny purge error: ${url}`, err);
      }
    }),
  );
}

/** Build every locale variant of the given canonical path. */
function paliaUrlsForPath(path: string): string[] {
  const base = `https://${palia.domain}.th.gl`;
  return palia.supportedLocales.map((locale) =>
    locale === "en" ? `${base}${path}` : `${base}/${locale}${path}`,
  );
}

export async function POST(request: Request) {
  const secret = request.headers.get("authorization")?.split(" ")[1];
  if (secret !== process.env.PALIA_REVALIDATE_SECRET) {
    return Response.json({ message: "Invalid token" }, { status: 401 });
  }

  const body = await request.json();
  const tag = body.tag;
  if (typeof tag !== "string") {
    return Response.json({ message: "Invalid tag" }, { status: 400 });
  }

  revalidateTag(tag);

  const path = TAG_TO_PATH[tag];
  const purgedUrls = path ? paliaUrlsForPath(path) : [];
  if (purgedUrls.length > 0) {
    // Fire purge in the background so the response returns fast — Bunny
    // accepts async=true purges and processes them within a few seconds.
    purgeBunny(purgedUrls).catch((err) =>
      console.error("Bunny purge batch failed:", err),
    );
  }

  return Response.json({
    revalidated: true,
    purged: purgedUrls.length,
    now: Date.now(),
  });
}
