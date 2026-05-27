import { kv as raw } from "@vercel/kv";

/**
 * Retry-wrapped Vercel KV client. Drop-in replacement for
 * `import { kv } from "@vercel/kv"`.
 *
 * Why this exists: on Vercel, the network path between Functions and
 * KV is short + stable, so the SDK's zero-retry default is fine. On
 * Bunny, the container egresses to Upstash EU (AWS eu-central-1) over
 * the public internet — occasional transient `fetch failed` errors
 * (idle TCP RSTs, packet loss, pool exhaustion in undici) showed up
 * post-migration with no retry to absorb them, signing users out.
 *
 * Three attempts with exponential backoff covers the typical hiccup
 * without making real failures slow (~350ms worst case before giving
 * up). Errors after exhaustion bubble to the caller — callers wrap
 * their own try/catch (see getAccount, /api/patreon/redirect).
 */

const MAX_RETRIES = 3;
const BACKOFFS_MS = [50, 100, 200];

async function withRetry<T>(op: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await op();
    } catch (err) {
      lastError = err;
      if (attempt === MAX_RETRIES) {
        const msg = err instanceof Error ? err.message : String(err);
        const cause =
          err instanceof Error && (err as { cause?: unknown }).cause
            ? ` cause=${String((err as { cause?: unknown }).cause)}`
            : "";
        console.error(
          `[kv] ${label} failed after ${MAX_RETRIES + 1} attempts: ${msg}${cause}`,
        );
        throw err;
      }
      await new Promise((r) =>
        setTimeout(r, BACKOFFS_MS[attempt] ?? 200),
      );
    }
  }
  throw lastError;
}

type SetArgs = Parameters<typeof raw.set>;

export const kv = {
  get: <T>(key: string) => withRetry(() => raw.get<T>(key), `get(${key})`),
  set: (key: SetArgs[0], value: SetArgs[1], options?: SetArgs[2]) =>
    withRetry(() => raw.set(key, value, options), `set(${String(key)})`),
  del: (...keys: Parameters<typeof raw.del>) =>
    withRetry(() => raw.del(...keys), `del(${keys.join(",")})`),
};
