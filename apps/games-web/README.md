# games-web

Multi-tenant Next.js app that serves all THGL game web apps from a single
deployment, replacing the per-game `*-web` apps on Vercel.

The same container handles `avowed.th.gl`, `palia.th.gl`, etc. by inspecting
the `Host` header in middleware and resolving the right `AppConfig`.

## How it works

1. `middleware.ts` reads the `Host` header → looks up `AppConfig` in
   `src/configs/index.ts` → sets `x-thgl-app` request header.
2. Server components call `getAppConfig()` (`src/lib/get-app-config.ts`)
   which reads that header and returns the matching config.
3. Each route file is a 1-line passthrough using the `multiTenant()` wrapper:

   ```ts
   // before (single-tenant):
   export default createMapPage(APP_CONFIG);

   // after (multi-tenant):
   export default multiTenant(createMapPage);
   ```

## Adding a new game

1. Copy the game's existing config from `apps/{game}-web/src/config.ts` to
   `apps/games-web/src/configs/{game}.ts`. Rename the export from
   `APP_CONFIG` to the game slug (e.g. `palia`).
2. Add the import + entry to `apps/games-web/src/configs/index.ts`:

   ```ts
   import { palia } from "./palia";
   export const APP_CONFIGS = { avowed, palia };
   ```

3. Configure DNS so `palia.th.gl` resolves to the container (via the Bunny
   pull zone with custom hostname).
4. Push to main — `games-web-deploy.yml` builds and deploys automatically.

## Migration strategy

Migrate one game at a time:

1. Add the game's config to this app, deploy.
2. Test by overriding hosts: `curl -H "Host: avowed.th.gl" http://container-ip:3100/`
3. Switch DNS / Bunny pull zone for that subdomain to the container.
4. Verify in production, then delete the per-game `apps/{game}-web/` app.

## Local development

```bash
bun run dev
# Test as a specific game by setting the Host header:
curl -H "Host: avowed.localhost" http://localhost:3100/
```

## Build & run as Docker

```bash
# from monorepo root
docker build -f apps/games-web/Dockerfile -t games-web .
docker run -p 3100:3100 games-web
```

## Special pages

A few games have unique routes (e.g. `palia` has `/leaderboard`,
`/weekly-wants`, `/rummage-pile`). These are NOT included here yet — those
games stay on the dedicated `palia-web` app for now. Or, port those routes
into this app and gate them by `appConfig.name`.
