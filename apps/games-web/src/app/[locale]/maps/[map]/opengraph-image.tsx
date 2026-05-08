import {
  fetchDict,
  fetchVersion,
  getMapNameFromVersion,
  getOpenGraphImageUrl,
} from "@repo/lib";
import { ImageResponse } from "next/og";
import { getAppConfig } from "@/lib/get-app-config";

export async function generateImageMetadata() {
  const config = await getAppConfig();
  return [{ alt: `${config.title} Interactive Map` }];
}

export default async function Image({ params }: { params: { map: string } }) {
  const config = await getAppConfig();
  const [version, dict] = await Promise.all([
    fetchVersion(config.name),
    fetchDict(config.name),
  ]);
  const mapName = getMapNameFromVersion(version, params.map, dict);

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
          src={getOpenGraphImageUrl(config.name, mapName!)}
          height="630"
          width="1200"
        />
      </div>
    ),
  );
}
