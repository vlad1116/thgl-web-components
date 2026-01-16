/**
 * Shared image cache for marker icons.
 * Used by both markers.tsx and private-node.tsx to avoid reloading icons.
 */

// Cache for source images (original icons before processing)
const sourceImageCache = new Map<string, HTMLImageElement>();

// Cache for processed images (icons with glow/color effects applied)
// Stores both the image and its dimensions since img.naturalWidth may not be reliable
interface ProcessedImageEntry {
  img: HTMLImageElement;
  width: number;
  height: number;
}
const processedImageCache = new Map<string, ProcessedImageEntry>();

export function getSourceImage(url: string): HTMLImageElement | undefined {
  const img = sourceImageCache.get(url);
  if (img?.complete && img.naturalWidth > 0) {
    return img;
  }
  return undefined;
}

export function setSourceImage(url: string, img: HTMLImageElement): void {
  sourceImageCache.set(url, img);
}

export function getProcessedImage(cacheKey: string): ProcessedImageEntry | undefined {
  const entry = processedImageCache.get(cacheKey);
  if (entry?.img?.complete) {
    return entry;
  }
  return undefined;
}

export function setProcessedImage(cacheKey: string, img: HTMLImageElement, width: number, height: number): void {
  processedImageCache.set(cacheKey, { img, width, height });
}

// Helper to create a cache key for processed images
// Includes sprite rect coordinates since different icons on the same sprite sheet need different cache entries
export function createProcessedImageKey(
  url: string,
  color: string,
  rect?: { x: number; y: number; width: number; height: number } | null
): string {
  const rectKey = rect ? `_${rect.x}_${rect.y}_${rect.width}_${rect.height}` : "";
  return `__processed_${url}_${color}${rectKey}__`;
}
