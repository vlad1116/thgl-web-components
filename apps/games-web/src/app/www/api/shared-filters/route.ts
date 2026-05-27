import { put, list, ListBlobResult } from "@vercel/blob";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "*",
};

function errorJson(message: string, status: number) {
  return Response.json({ error: message }, { status, headers });
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");
    if (!filename) return errorJson("No filename provided", 400);
    if (!request.body) return errorJson("No body provided", 400);

    const existingName = filename.split("/shared-filters/")[1];
    const name = existingName || filename;
    const blob = await put(`/shared-filters/${name}`, request.body, {
      access: "public",
      contentType: "application/json",
      cacheControlMaxAge: 0,
      addRandomSuffix: !existingName,
      allowOverwrite: true,
    });

    return Response.json(blob, { headers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[shared-filters PUT] ${msg}`);
    return errorJson(msg, 500);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    if (!code) return errorJson("No code provided", 400);

    let hasMore = true;
    let cursor;
    while (hasMore) {
      const listResult: ListBlobResult = await list({
        prefix: "shared-filters/",
        cursor,
      });
      hasMore = listResult.hasMore;
      cursor = listResult.cursor;
      const blob = listResult.blobs.find((blob) => blob.url.endsWith(code));
      if (blob) return Response.json(blob, { headers });
    }
    return errorJson("No shared filters found", 404);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[shared-filters GET] ${msg}`);
    return errorJson(msg, 500);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers });
}
