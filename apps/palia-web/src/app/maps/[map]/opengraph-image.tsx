import { APP_CONFIG } from "@/config";
import {
  fetchVersion,
  getMapNameFromVersion,
  getOpenGraphImageUrl,
} from "@repo/lib";
import { ImageResponse } from "next/og";

export const alt = `${APP_CONFIG.title} Interactive Map`;

export default async function Image({ params }: { params: { map: string } }) {
  const version = await fetchVersion(APP_CONFIG.name);
  const mapName = getMapNameFromVersion(version, params.map);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={getOpenGraphImageUrl(APP_CONFIG.name, mapName!)}
          height="630"
          width="1200"
        />
      </div>
    ),
  );
}
