# Multi-tenant Next.js container for THGL game web apps.
#
# Build context: monorepo root.
# Run from repo root: docker build -f apps/games-web/Dockerfile -t games-web .

# ------------------------------------------------------------------
# Stage 1: build (uses bun for install + turbo build)
# ------------------------------------------------------------------
FROM oven/bun:1.3.11 AS builder
WORKDIR /repo

# Copy whole monorepo (filtered by .dockerignore to skip node_modules / .next / dist).
# Workspaces force us to install everything together, but turbo prune could optimize this later.
COPY . .

# Install dependencies (workspace-aware via bun)
RUN bun install --frozen-lockfile

# Build games-web and all upstream packages (turbo orders dependencies).
# NODE_ENV pinned: nothing in this stage sets it, and next.config.js values
# resolved at build time (env inlining, prod-only header rules) must never
# see a development-ish environment in an image build.
ENV NODE_ENV=production
RUN bunx turbo run build --filter=games-web

# ------------------------------------------------------------------
# Stage 2: runtime (slim node image, only what's needed to run)
# ------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3100
ENV HOSTNAME=0.0.0.0

# Next.js standalone output bundles all required deps
COPY --from=builder /repo/apps/games-web/.next/standalone ./
COPY --from=builder /repo/apps/games-web/.next/static ./apps/games-web/.next/static
COPY --from=builder /repo/apps/games-web/public ./apps/games-web/public

EXPOSE 3100

CMD ["node", "apps/games-web/server.js"]
