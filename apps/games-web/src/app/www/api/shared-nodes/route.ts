/**
 * Legacy shared-nodes endpoint. Disabled — see /api/shared-filters
 * for the same rationale. The shared-nodes store has been dormant
 * since 2024 (40 blobs total, no new writes), but we keep this stub
 * around to give old clients a clean 410 instead of a 404.
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
      message: "The shared-nodes endpoint is no longer available.",
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
