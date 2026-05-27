import { TH_GL_URL } from "./config";
import { DrawingsAndNodes } from "./settings";

/**
 * Legacy Vercel-Blob–backed shared-filter helpers.
 *
 * The /api/shared-filters endpoint is permanently 410 Gone since the
 * shared-filters rework. Components still call putSharedFilters for
 * pre-rework localStorage entries with `isShared + url` set — we
 * keep the function callable but silently no-op on 410 so existing
 * UIs don't throw unhandled rejections in prod. New code paths use
 * filters-api.ts instead.
 */

interface SharedFilterBlob {
  url: string;
  downloadUrl: string;
  pathname: string;
  contentType?: string;
  contentDisposition: string;
}

export async function putSharedFilters(
  filename: string,
  myFilter: DrawingsAndNodes,
): Promise<SharedFilterBlob | null> {
  try {
    const response = await fetch(
      `${TH_GL_URL}/api/shared-filters?filename=${filename}`,
      {
        method: "PUT",
        body: JSON.stringify(myFilter),
      },
    );
    if (response.status === 410) return null;
    if (!response.ok) {
      throw new Error("Can not upload blob");
    }
    return (await response.json()) as SharedFilterBlob;
  } catch (err) {
    // Network/410/etc. — keep local state, don't escalate to caller.
    console.warn("[legacy shared-filters] put failed:", err);
    return null;
  }
}

export async function getSharedFilterByCode(
  code: string,
): Promise<SharedFilterBlob | null> {
  const response = await fetch(`${TH_GL_URL}/api/shared-filters?code=${code}`);
  if (response.status === 410) return null;
  if (!response.ok) {
    throw new Error("Can not find shared filter");
  }
  return (await response.json()) as SharedFilterBlob;
}
