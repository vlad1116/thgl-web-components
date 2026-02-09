# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Key Commands

### Development
- **Run specific app**: `bunx turbo run dev --filter={app-name}...` (e.g., `--filter=palworld-web...`)
- **Run by type**:
  - Web apps: `bun run dev:web`
  - Overwolf apps: `bun run dev:overwolf`
  - Specific game: `bun run dev:{game-name}` (e.g., `dev:palworld`)

### Build & Quality
- **Build**: `bun run build` or `turbo run build`
- **Typecheck**: `bun run typecheck`
- **Lint**: `bun run lint`
- **Clean**: `bun run clean`
- **Update dependencies**: `bun run update-deps`

### Testing
No test framework is configured - the project relies on TypeScript, linting, and formatting for code quality.

## Architecture Overview

This is a TurboRepo monorepo for The Hidden Gaming Lair, containing game-specific web and Overwolf apps.

### Project Structure
- **Apps** (`apps/`): Each game has two app types:
  - `{game-name}-web`: Next.js web app (e.g., palworld.th.gl)
  - `{game-name}-overwolf`: Vite-based Overwolf in-game overlay
  - Special apps: `thgl-web` (main site), `thgl-app` (Windows companion)

- **Shared Packages** (`packages/`):
  - `@repo/lib`: Core logic, types, utilities, game configurations
  - `@repo/ui`: Shared React components using Radix UI + Tailwind
    - Component folders organized by usage context (see UI Package Structure below)
  - Config packages: `config-eslint`, `config-typescript`, `config-tailwind`

### Key Configuration Files
- Each app has a `src/config.ts` defining game-specific settings, routes, and map configurations
- Game definitions live in `packages/lib/src/games.ts`
- App configs extend `AppConfig` or `OverwolfAppConfig` types from `@repo/lib`

### Technology Stack
- **Runtime**: Bun (package manager and runtime)
- **Frameworks**: Next.js (web apps), Vite (Overwolf apps)
- **UI**: React + TypeScript + Tailwind CSS + Radix UI
- **State**: Zustand
- **Maps**: Leaflet for interactive game maps

### Development Notes
- All paths must be absolute, not relative
- Follow existing code patterns and conventions in the codebase
- Web apps auto-deploy to Vercel, Overwolf apps require manual updates
- No direct pushes to main - all changes via PR
- Use `.env.example` files for environment variable templates (never commit `.env` files)
- Repository is source-available but NOT open source - code cannot be reused for other projects
- Format code with Prettier, ensure ESLint passes before committing

### Component Patterns

The codebase uses reusable components to maintain consistency and reduce duplication:

#### Page Structure Components
- **PageShell**: Wrapper for page content with consistent spacing and max-width
- **PageHeader**: Standardized page headers with title and description
- **ViewMoreLink**: Consistent "view all" links with arrow icons

#### Content Components
- **InfoCard**: General-purpose card for links with optional badges, icons, and descriptions
  - Used by: PartnerCard, PlatformCard
  - Supports: external links, custom badge variants, h2/h3 title sizes
- **BenefitList**: Icon + description lists with configurable styling
  - Supports: emoji strings or Lucide icons, optional labels, size/spacing variants
  - Used in: partner-program, advertise pages

#### Best Practices
- Check for existing reusable components before creating new ones
- Look for repeated patterns (3+ occurrences) that could be extracted into components
- Prefer composition over duplication
- Keep components flexible with optional props and sensible defaults

### UI Package Structure

The `@repo/ui` package is organized into component folders by usage context to optimize tree-shaking and prevent circular dependencies:

#### Component Folder Organization
- **(overwolf)**: Overwolf-exclusive components (ads, app shell, hotkeys, resize borders)
  - Only used by `{game-name}-overwolf` apps
  - Import via `@repo/ui/overwolf`
- **(desktop)**: Shared desktop components used by both Overwolf apps and thgl-app
  - Components: StreamingSender, MapContainer, QR
  - Import via `@repo/ui/desktop`
- **(thgl-app)**: thgl-app-specific components (companion app for Windows)
  - Import via `@repo/ui/thgl-app`
- **(apps)**: Shared app-level components (RootLayout, MapPage, etc.)
  - Used by web and desktop apps
  - Import via `@repo/ui/apps`
- **(controls)**: UI controls and dialogs (Actions, Toaster, Settings, etc.)
  - Import via `@repo/ui/controls`
  - Note: MarkersSearch exported separately via `@repo/ui/markers-search`
- **(interactive-map)**: Map components (InteractiveMap, Markers, LivePlayer, etc.)
  - Import via `@repo/ui/interactive-map`
- **(header)**: Header components (Header, Brand, Account, PlausibleTracker)
  - Import via `@repo/ui/header`
- **(providers)**: Context providers (I18NProvider, TooltipProvider, CoordinatesProvider)
  - Import via `@repo/ui/providers`
- **(content)**: Content display components (markdown, discord messages, etc.)
  - Import via `@repo/ui/content`
- **(data)**: Data display components (spawns lists, map guides, progress tracking)
  - Import via `@repo/ui/data`
- **(peer)**: P2P collaboration components (Whiteboard)
  - Import via `@repo/ui/peer`
- **(ads)**: Ad components for web apps
  - Import via `@repo/ui/ads`

#### Tree-Shaking Best Practices
- **Barrel files use named exports only** - No wildcard `export *` to enable proper tree-shaking
- **Avoid circular dependencies** - Within `packages/ui`, use direct relative imports (e.g., `../ui/button`) instead of `@repo/ui/*` imports
- **Break dependency chains** - Components should not import from unrelated feature folders
- **Client components** - "use client" components in barrel files can prevent tree-shaking in Next.js; isolated exports help (e.g., `@repo/ui/markers-search`)
- **Package.json exports** - All component folders are explicitly exported in package.json for controlled access

## Overwolf Log Analysis

When asked to analyze Overwolf log files, refer to `.claude/overwolf-logs-analysis.md` for detailed instructions.

**Log Location**: `%LOCALAPPDATA%\Overwolf\Log`

**Quick Reference - Log Types**:
| Log File | Pattern | Purpose |
|----------|---------|---------|
| Trace | `Trace_*.log` | Platform actions, system state, errors |
| Game HTML | `<GameName>_*.Game.html` | Game integration, DLL injection, overlay rendering |
| OBS | OBS logs | Recording engine, encoder, audio/video devices |
| OverwolfPerf | OverwolfPerf logs | CPU/memory usage per process |
| DxDiag | DxDiag.txt | System hardware, drivers, DirectX info |

**Analysis Priority**:
1. Start with **Trace logs** - search for `ERROR` and `WARN` entries
2. Check **Game HTML logs** - for overlay/rendering issues
3. Review **OverwolfPerf** - for performance complaints
4. Check **DxDiag** - for hardware/driver compatibility