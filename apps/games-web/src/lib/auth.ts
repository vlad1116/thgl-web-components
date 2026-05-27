import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";

/**
 * Account auth for route handlers.
 *
 * The Patreon OAuth flow stores a JWT-signed `userId` cookie (see
 * /api/patreon/redirect). This module extracts the decrypted Patreon
 * user id from that cookie. No Patreon API roundtrip — the cookie
 * itself is the credential, signed by us, so we only verify the
 * signature.
 *
 *   getUserIdFromCookies() → string | null   (soft, for optional auth)
 *   requireAccount()       → string          (throws UnauthenticatedError)
 */

export class UnauthenticatedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export async function getUserIdFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("userId")?.value;
  if (!raw) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("[auth] JWT_SECRET not set");
    return null;
  }
  try {
    return verify(raw, secret) as string;
  } catch {
    return null;
  }
}

export async function requireAccount(): Promise<string> {
  const id = await getUserIdFromCookies();
  if (!id) throw new UnauthenticatedError();
  return id;
}
