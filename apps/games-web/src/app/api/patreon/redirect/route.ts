import { kv } from "@vercel/kv";
import { sign } from "jsonwebtoken";
import {
  type PatreonToken,
  type PatreonUser,
  getCurrentUser,
  getRedirectUriFromRequest,
  postToken,
  toCookieString,
  toCookieStringEmpty,
} from "@/games/thgl-app/patreon";
import { requireApp } from "@/lib/get-app-config";

const LOG = "[patreon/redirect]";

export const maxDuration = 25;
export async function GET(request: Request) {
  // Patreon OAuth callback is only valid on app.th.gl — other tenants 404.
  await requireApp("thgl-app");
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");

  // Patreon redirects back with ?error=... when the user denies or
  // something upstream rejects the request — surface it.
  if (oauthError) {
    console.error(
      `${LOG} patreon returned error=${oauthError} description=${searchParams.get("error_description") ?? ""}`,
    );
  }

  if (!code) {
    console.error(`${LOG} no ?code param — clearing cookie`);
    return new Response(null, {
      status: 302,
      headers: {
        "Set-Cookie": toCookieStringEmpty(),
        location: "/redirect",
      },
    });
  }

  // Validate required env vars up front so we don't spend a round-trip
  // to Patreon just to fail on a missing client_secret.
  const missing: string[] = [];
  if (!process.env.PATREON_CLIENT_ID) missing.push("PATREON_CLIENT_ID");
  if (!process.env.PATREON_CLIENT_SECRET) missing.push("PATREON_CLIENT_SECRET");
  if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");
  if (missing.length > 0) {
    console.error(`${LOG} missing env vars: ${missing.join(", ")}`);
    return Response.json(
      { error: "Server misconfigured", missing },
      { status: 503 },
    );
  }

  let tokenResponse: Response;
  let tokenResult: PatreonToken | { error: string; error_description?: string };
  try {
    // Must match the redirect_uri used in the authorize step. Derived
    // from this request's host so app.th.gl and www.th.gl each
    // round-trip to themselves.
    tokenResponse = await postToken(code, getRedirectUriFromRequest(request));
    tokenResult = (await tokenResponse.json()) as
      | PatreonToken
      | { error: string };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${LOG} postToken fetch threw: ${msg}`);
    return Response.json({ error: "Token exchange failed" }, { status: 502 });
  }
  if (!tokenResponse.ok) {
    console.error(
      `${LOG} postToken failed status=${tokenResponse.status} body=${JSON.stringify(tokenResult).slice(0, 300)}`,
    );
    return Response.json(tokenResult, {
      status: tokenResponse.status,
    });
  }

  const patreonToken = tokenResult as PatreonToken;

  let currentUserResponse: Response;
  let currentUserResult: PatreonUser | { error: string };
  try {
    currentUserResponse = await getCurrentUser(patreonToken);
    currentUserResult = (await currentUserResponse.json()) as
      | PatreonUser
      | { error: string };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${LOG} getCurrentUser fetch threw: ${msg}`);
    return Response.json({ error: "Identity fetch failed" }, { status: 502 });
  }
  if (!currentUserResponse.ok) {
    console.error(
      `${LOG} getCurrentUser failed status=${currentUserResponse.status} body=${JSON.stringify(currentUserResult).slice(0, 300)}`,
    );
    return Response.json(currentUserResult, {
      status: currentUserResponse.status,
    });
  }
  const currentUser = currentUserResult as PatreonUser;

  let signed: string;
  try {
    signed = sign(currentUser.data.id, process.env.JWT_SECRET!);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${LOG} jwt sign failed for id=${currentUser.data.id}: ${msg}`);
    return Response.json({ error: "Sign failed" }, { status: 500 });
  }

  try {
    await kv.set(`token:${currentUser.data.id}`, patreonToken, {
      ex: 2678400, // patreonToken.expires_in,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${LOG} kv.set failed for id=${currentUser.data.id}: ${msg}`);
    return Response.json({ error: "Token store failed" }, { status: 502 });
  }

  console.log(`${LOG} ok id=${currentUser.data.id} setting cookie + redirecting`);
  return new Response(null, {
    status: 302,
    headers: {
      "Set-Cookie": toCookieString(signed, 2678400), // patreonToken.expires_in),
      location: "/redirect",
    },
  });
}
