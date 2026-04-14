import { createSitemap, createGenerateSitemaps } from "@repo/lib";
import { APP_CONFIG } from "@/config";

export const generateSitemaps = createGenerateSitemaps(APP_CONFIG);

export default createSitemap(APP_CONFIG);
