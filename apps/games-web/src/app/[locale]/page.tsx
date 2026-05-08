import { createHomePage, createHomePageGenerateMetadata } from "@repo/ui/apps";
import { multiTenant } from "@/lib/multi-tenant";

export const generateMetadata = multiTenant(createHomePageGenerateMetadata);
export default multiTenant(createHomePage);
