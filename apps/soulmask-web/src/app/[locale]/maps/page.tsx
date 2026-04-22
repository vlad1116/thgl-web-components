import { APP_CONFIG } from "@/config";
import { createMapsPage, createMapsPageGenerateMetadata } from "@repo/ui/apps";

export const generateMetadata = createMapsPageGenerateMetadata(APP_CONFIG);

export default createMapsPage(APP_CONFIG);
