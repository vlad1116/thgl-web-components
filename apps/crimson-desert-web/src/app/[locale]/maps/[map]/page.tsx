import { APP_CONFIG } from "@/config";
import { createMapPageGenerateMetadata, createMapPage } from "@repo/ui/apps";
import { CrimsonDesertZones } from "@repo/ui/data";

export const generateMetadata = createMapPageGenerateMetadata(APP_CONFIG);

export default createMapPage(APP_CONFIG, <CrimsonDesertZones />);
