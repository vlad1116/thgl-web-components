import { APP_CONFIG } from "@/config";
import { DATA_FORGE_CDN_URL } from "@repo/lib";
import { createMapPageGenerateMetadata, createMapPage } from "@repo/ui/apps";
import { MapOverlays } from "@repo/ui/data";

export const generateMetadata = createMapPageGenerateMetadata(APP_CONFIG);

const CDN = `${DATA_FORGE_CDN_URL}/crimson-desert/icons/overlays`;

export default createMapPage(
  APP_CONFIG,
  <MapOverlays configUrl={`${CDN}/overlays.json`} basePath={CDN} />,
);
