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