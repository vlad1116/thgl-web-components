import { type AppConfig } from "@repo/lib";
import { getAppConfig } from "./get-app-config";

/**
 * Wrap a `(appConfig) => (props) => result` factory so the appConfig is
 * resolved per-request from headers instead of imported at module load.
 *
 * Used to convert the existing factory-style page exports from each
 * single-tenant app into multi-tenant equivalents:
 *
 *   // before (single-tenant):
 *   export default createMapPage(APP_CONFIG);
 *
 *   // after (multi-tenant):
 *   export default multiTenant(createMapPage);
 */
export function multiTenant<P, R, A extends unknown[] = []>(
  factory: (appConfig: AppConfig, ...rest: A) => (props: P) => R | Promise<R>,
  ...extraArgs: A
): (props: P) => Promise<R> {
  return async (props: P) => {
    const config = await getAppConfig();
    return factory(config, ...extraArgs)(props);
  };
}

/**
 * Variant for factories that return a value directly instead of a function
 * (e.g. createRobots, createSitemap), used for files like robots.ts.
 */
export function multiTenantValue<R, A extends unknown[] = []>(
  factory: (appConfig: AppConfig, ...rest: A) => R,
  ...extraArgs: A
): () => Promise<R> {
  return async () => {
    const config = await getAppConfig();
    return factory(config, ...extraArgs);
  };
}
