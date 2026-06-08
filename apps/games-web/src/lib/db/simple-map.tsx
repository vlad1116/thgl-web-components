"use client";

// Local re-export so the location map can be dynamic-imported by a relative
// path. A static import of `@repo/ui/data` works everywhere, but Next.js/webpack
// rejects the same subpath inside `import("...")` calls — so the dynamic import
// in `db-location-map.tsx` points here instead.
export { SimpleMapDynamic as default } from "@repo/ui/data";
