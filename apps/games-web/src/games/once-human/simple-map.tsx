"use client";

// Local re-export so we can dynamic-import a relative path. Importing
// `@repo/ui/data` works for static imports but Next.js/webpack rejects
// the same subpath inside `import("...")` calls.
export { SimpleMapDynamic as default } from "@repo/ui/data";
