// Re-export the generic hero so existing BPSR pages don't need to
// rewrite their imports just because we moved the implementation.
export { WikiSectionHero as SectionHero } from "@/lib/db/wiki";
