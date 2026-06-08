#!/usr/bin/env node
/**
 * CI-parity verification: typecheck + lint across the whole monorepo.
 *
 * This is the single gate used by the pre-push git hook AND the CI "Verify"
 * workflow, so "passes locally" means "passes in CI". Build stays out of it on
 * purpose — Next.js/Vite builds already typecheck, and a full `turbo run build`
 * is too heavy (and OOMs) for a pre-push hook.
 *
 * Concurrency is capped and the Node heap bumped because the monorepo OOMs when
 * turbo fans out ~12 `tsc` processes at once (observed on Windows dev machines).
 */
import { spawnSync } from "node:child_process";

const result = spawnSync("bunx turbo run typecheck lint --concurrency=2", {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NODE_OPTIONS:
      `${process.env.NODE_OPTIONS ?? ""} --max-old-space-size=8192`.trim(),
  },
});

process.exit(result.status ?? 1);
