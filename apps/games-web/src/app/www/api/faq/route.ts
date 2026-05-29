/**
 * Canonical FAQ feed. `faq-entries.ts` is the single source of truth for
 * the FAQ; this endpoint exposes it as JSON so external consumers (the
 * THGL Discord bot's web→Discord FAQ sync) can mirror it without importing
 * the web codebase. Served at https://www.th.gl/api/faq.
 */
import { faqEntries } from "@/games/thgl-web/lib/faq-entries";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  // Cache at the edge for an hour; the FAQ changes rarely and the bot
  // reconciles on its own interval regardless.
  "Cache-Control": "public, max-age=300, s-maxage=3600",
};

export function GET() {
  return Response.json(
    {
      baseUrl: "https://www.th.gl/faq",
      count: faqEntries.length,
      entries: faqEntries,
    },
    { headers },
  );
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers });
}
