import {
  fetchDict,
  fetchVersion,
  getMapNameFromVersion,
  getOpenGraphImageUrl,
} from "@repo/lib";
import { ImageResponse } from "next/og";
import { getAppConfig } from "@/lib/get-app-config";

// A single static `alt` replaces generateImageMetadata: the latter ran
// at build time inside Next 16's metadata-id collection (no request), so
// its getAppConfig() → headers() call is unavailable there. The Image
// renderer below still resolves the tenant config at request time.
export const alt = "Interactive Map";

// Next.js 16 passes `params` to metadata image routes as a Promise.
export default async function Image({
  params,
}: {
  params: Promise<{ map: string }>;
}) {
  const { map } = await params;
  const config = await getAppConfig();
  const [version, dict] = await Promise.all([
    fetchVersion(config.name),
    fetchDict(config.name),
  ]);
  const mapName = getMapNameFromVersion(version, map, dict);

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src={getOpenGraphImageUrl(config.name, mapName!)}
        height="630"
        width="1200"
      />
    </div>,
  );
}
