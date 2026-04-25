import { fetchVersion } from "@repo/lib";
import { getIconsUrl } from "@repo/lib";
import { APP_CONFIG } from "@/config";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export async function SpriteIcon({
  icon,
  size = 64,
  className = "",
}: {
  icon: IconSprite;
  size?: number;
  className?: string;
}) {
  const version = await fetchVersion(APP_CONFIG.name);
  const zoom = size / 64;

  return (
    <img
      alt=""
      role="presentation"
      className={`shrink-0 object-none ${className}`}
      src={getIconsUrl(APP_CONFIG.name, icon.url, version.more.icons)}
      width={icon.width}
      height={icon.height}
      style={{
        objectPosition: `-${icon.x}px -${icon.y}px`,
        zoom,
      }}
    />
  );
}
