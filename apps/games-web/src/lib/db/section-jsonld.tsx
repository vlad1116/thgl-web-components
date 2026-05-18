import type { AppConfig, DatabaseConfig } from "@repo/lib";
import { JSONLDScript } from "@repo/ui/apps";
import { resolveDict } from "@/lib/db/resolve-dict";
import { collectionPageJsonLd } from "@/lib/db/json-ld";

/**
 * Server component that emits CollectionPage JSON-LD for a `/db/<section>`
 * listing page. Computes the `ItemList` from the matching database entries
 * (with optional dict-key prefix per type — e.g. `faction_` for the
 * factions section).
 */
export function SectionJsonLd({
  appConfig,
  section,
  sectionLabel,
  description,
  dict,
  database,
  types,
  typePrefixes,
  nameLabelPrefixByType,
  /**
   * Optional resolver for an item's display name when the dict key is
   * absent. Used by BPSR (`item.props.title` carries the name; the dict
   * doesn't).
   */
  resolveName,
  locale = "en",
}: {
  appConfig: AppConfig;
  section: string;
  sectionLabel: string;
  description: string;
  dict: Record<string, string>;
  database: DatabaseConfig;
  /** Exact entry types whose items should appear in the ItemList */
  types?: string[];
  /**
   * Type prefixes — any category whose `type` starts with one of these
   * contributes its items (e.g. `["dictionary_"]`).
   */
  typePrefixes?: string[];
  /** Optional per-type prefix when looking up display names (e.g. {factions: "faction_"}). */
  nameLabelPrefixByType?: Record<string, string>;
  resolveName?: (item: DatabaseConfig[number]["items"][number]) =>
    | string
    | undefined;
  locale?: string;
}) {
  const items: Array<{ id: string; name: string }> = [];
  for (const cat of database) {
    const exactMatch = types?.includes(cat.type) ?? false;
    const prefixMatch =
      typePrefixes?.some((p) => cat.type.startsWith(p)) ?? false;
    if (!exactMatch && !prefixMatch) continue;
    const prefix = nameLabelPrefixByType?.[cat.type] ?? "";
    for (const item of cat.items) {
      const fromResolver = resolveName?.(item);
      const dictKey = prefix ? `${prefix}${item.id}` : item.id;
      const name = fromResolver ?? resolveDict(dict, dictKey);
      items.push({ id: item.id, name });
    }
  }

  return (
    <JSONLDScript
      json={collectionPageJsonLd({
        appConfig,
        section,
        sectionLabel,
        description,
        items,
        locale,
      })}
    />
  );
}
