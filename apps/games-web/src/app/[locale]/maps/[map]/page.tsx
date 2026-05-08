import { createMapPage, createMapPageGenerateMetadata } from "@repo/ui/apps";
import { multiTenant } from "@/lib/multi-tenant";

export const generateMetadata = multiTenant(createMapPageGenerateMetadata);
export default multiTenant(createMapPage);
