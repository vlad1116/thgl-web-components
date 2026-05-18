/**
 * Resolve a dict value, following pointer references (values starting with @)
 */
export function resolveDict(
  dict: Record<string, string>,
  key: string,
): string {
  const value = dict[key];
  if (!value) return key;
  if (value[0] === "@") {
    return dict[value] ?? value;
  }
  return value;
}

/**
 * Resolve a dict value with a fallback — tries multiple keys, then capitalizes raw key
 */
export function resolveDictWithFallback(
  dict: Record<string, string>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = dict[key];
    if (value) {
      return value[0] === "@" ? (dict[value] ?? value) : value;
    }
  }
  // Capitalize the last key as fallback
  const lastKey = keys[keys.length - 1] ?? "";
  return lastKey
    .replace(/^faction_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
