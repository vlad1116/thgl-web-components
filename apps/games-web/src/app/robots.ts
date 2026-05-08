import { createRobots } from "@repo/lib";
import { multiTenant } from "@/lib/multi-tenant";

export default multiTenant(createRobots);
