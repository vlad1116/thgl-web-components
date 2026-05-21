import type { Instrumentation } from "next";

/**
 * Next.js error-tracing hook. Runs server-side on every error thrown
 * during a request (server component render, route handler, server
 * action). Logs the full error including stack and digest — production
 * builds normally strip the message + stack from the response error
 * to avoid leaking source paths, which makes diagnosing things like
 * `DYNAMIC_SERVER_USAGE` impossible. Here we deliberately keep the
 * raw stack server-side (it never reaches the client).
 *
 * Useful digests to look for:
 *   - DYNAMIC_SERVER_USAGE — a dynamic API (cookies/headers/searchParams)
 *     was touched in a code path Next thought was static. Fix is usually
 *     `export const dynamic = "force-dynamic"` on the offending route.
 *   - NEXT_NOT_FOUND — notFound() called normally, not actually an error.
 *   - NEXT_REDIRECT — redirect() called normally, not actually an error.
 *
 * Disable in dev: instrumentation already fires next dev's own pretty
 * formatter, no need to duplicate. Guard with NODE_ENV.
 */
/**
 * Suppressed error patterns. These come from clients holding old
 * bundle JS (cached WebView2 / stale browser tabs) that still
 * reference Server Action IDs from the previous Vercel deployment
 * — they POST to the new Bunny container with action IDs that no
 * longer exist. Spammy and unactionable: the new code is fine, the
 * cached clients will age out on their own.
 *
 * `Unexpected end of form` is the follow-up parsing error when Next
 * tries (and fails) to read the body of an action POST whose target
 * action no longer exists.
 */
const STALE_CLIENT_PATTERNS = [
  /Failed to find Server Action/i,
  /Unexpected end of form/i,
];

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  const e = err as Error & { digest?: string };
  // Don't log "errors" that are normal control-flow primitives.
  if (e.digest === "NEXT_NOT_FOUND" || e.digest === "NEXT_REDIRECT") return;
  if (STALE_CLIENT_PATTERNS.some((re) => re.test(e.message))) return;

  const host = request.headers["host"] ?? "?";
  console.error(
    `[onRequestError] digest=${e.digest ?? "none"} routePath=${context.routePath ?? "?"} routeType=${context.routeType ?? "?"} routerKind=${context.routerKind ?? "?"} method=${request.method} path=${request.path} host=${host}`,
  );
  console.error(`  message: ${e.message}`);
  if (e.stack) {
    console.error(`  stack:\n${e.stack}`);
  }
};
