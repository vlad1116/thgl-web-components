import { APP_CONFIG } from "@/config";
import { createMapPageGenerateMetadata, createMapPage } from "@repo/ui/apps";
import { CrimsonDesertZones, CrimsonDesertSaveImport } from "@repo/ui/data";

export const generateMetadata = createMapPageGenerateMetadata(APP_CONFIG);

export default createMapPage(
  APP_CONFIG,
  <div className="space-y-2">
    <div className="px-2.5 pt-1">
      <CrimsonDesertSaveImport />
    </div>
    <CrimsonDesertZones />
  </div>,
);
