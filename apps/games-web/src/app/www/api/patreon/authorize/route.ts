import { type NextRequest } from "next/server";

const ALLOWED_DOMAINS = [".th.gl", "localhost"];

function isAllowedReturnTo(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(
      (domain) =>
        parsed.hostname === domain ||
        parsed.hostname.endsWith(domain),
    );
  } catch {
    return false;
  }
}

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get("return_to");

  const clientId = process.env.PATREON_CLIENT_ID;
  const redirectUri = process.env.PATREON_REDIRECT_URL;

  if (!clientId || !redirectUri) {
    return Response.json(
      { error: "OAuth not configured" },
      { status: 503 },
    );
  }

  // Encode return_to in state param (only allow *.th.gl domains)
  const state =
    returnTo && isAllowedReturnTo(returnTo)
      ? Buffer.from(JSON.stringify({ return_to: returnTo })).toString(
          "base64url",
        )
      : undefined;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
  });

  if (state) {
    params.set("state", state);
  }

  return new Response(null, {
    status: 302,
    headers: {
      location: `https://www.patreon.com/oauth2/authorize?${params}`,
    },
  });
}
