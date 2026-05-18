import { getIconsUrl } from "@repo/lib";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Renders a sprite-sheet icon. **Synchronous** so it can be used inside both
 * Server Components and Client Components (e.g. the build tree, mechanic
 * tooltip terms). The version-busted icons URL is computed inline using
 * `getIconsUrl` — when called without a version hash it falls back to the
 * canonical path, which is fine because the CDN already long-caches the
 * sprite by content hash.
 *
 * If the caller has the version available (e.g. a top-level server layout),
 * pass it as `iconsHash` for proper cache busting; otherwise the icon URL
 * is still correct, just not re-validated until a new version is deployed.
 */
export function SpriteIcon({
  icon,
  appName,
  size = 64,
  className = "",
  iconsHash,
}: {
  icon: IconSprite;
  /** Game name (AppConfig.name) — used to build the CDN URL. */
  appName: string;
  size?: number;
  className?: string;
  iconsHash?: string;
}) {
  const zoom = size / 64;
  // If icon.url is already an absolute URL (some upstream callers resolve it
  // ahead of time, e.g. the detail sidebar), pass it through unchanged.
  // Otherwise build the CDN URL with optional version-busting hash.
  const src =
    icon.url.startsWith("http://") || icon.url.startsWith("https://")
      ? icon.url
      : getIconsUrl(appName, icon.url, iconsHash);
  return (
    <img
      alt=""
      role="presentation"
      className={`shrink-0 object-none ${className}`}
      src={src}
      width={icon.width}
      height={icon.height}
      style={{
        objectPosition: `-${icon.x}px -${icon.y}px`,
        zoom,
      }}
    />
  );
}
