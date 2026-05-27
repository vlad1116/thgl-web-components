/**
 * Legacy shared-filters endpoint. Disabled — the feature was reworked
 * into /api/filters (account-backed, see filters-db.ts) and the old
 * public-PUT path was used to overwrite other users' filters.
 *
 * GET/PUT now return 410 Gone with a JSON body pointing callers at
 * the new endpoints. OPTIONS still returns 204 for CORS preflight so
 * legacy clients don't see an opaque CORS error before the 410.
 */

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "*",
};

function gone() {
  return Response.json(
    {
      error: "Gone",
      message:
        "The shared-filters endpoint was replaced. Import filters via /api/filters/by-code/:code or browse the Community catalog in My Filters.",
    },
    { status: 410, headers },
  );
}

export function GET() {
  return gone();
}

export function PUT() {
  return gone();
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers });
}
