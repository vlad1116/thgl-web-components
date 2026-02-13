import leaflet, { CircleMarker } from "leaflet";
import gameIcons from "../(controls)/icons.json";
import { Spawns } from "../(providers)";
import { getImageURL } from "@repo/lib";
import type { ColorBlindMode } from "@repo/lib";
import { applyColorBlindTransform } from "./color-blind";

leaflet.Canvas.include({
  updateCanvasImg(layer: CanvasMarker) {
    const layerContext = this._ctx as CanvasRenderingContext2D;
    if (!layerContext) {
      return;
    }
    const {
      icon,
      isHighlighted,
      isDiscovered,
      isCluster,
      fillColor,
      noCache,
      zPos,
    } = layer.options;
    let radius = layer.getRadius();
    if (isHighlighted) {
      radius *= 1.5;
    }
    let imageSize = radius * 2;
    if (imageSize < 1) {
      return;
    }
    const p = layer._point.round();
    const hcPadding = layer.options.highContrastMode ? 2 : 0;
    const dx = p.x - radius - hcPadding;
    const dy = p.y - radius - hcPadding;

    // Track if we drew an icon (to know if we should proceed to text)
    let iconDrawn = false;

    if (icon !== undefined) {
      if (icon === null || layer.imageElement.width === 0) {
        layerContext.beginPath();
        layerContext.arc(p.x, p.y, radius * 0.75, 0, Math.PI * 2);
        layerContext.fillStyle = fillColor || "rgba(255, 255, 255, 0.6)";
        layerContext.fill();
        iconDrawn = true;
      } else {
        const colorBlindMode = layer.options.colorBlindMode || "none";
        const colorBlindSeverity =
          typeof layer.options.colorBlindSeverity === "number"
            ? layer.options.colorBlindSeverity
            : 1;
        const severityKey = Number.isFinite(colorBlindSeverity)
          ? Number(colorBlindSeverity).toFixed(2)
          : "1.00";
        // Optimize cache key generation using array join (faster than string concatenation)
        const keyParts = [
          icon.url,
          "width" in icon ? `${icon.x}${icon.y}` : "",
          radius,
          isHighlighted ? "1" : "0",
          isDiscovered ? "1" : "0",
          isCluster ? "1" : "0",
          fillColor || "",
          zPos || "",
          colorBlindMode,
          severityKey,
          layer.options.highContrastMode ? "hc" : "",
        ];
        const key = keyParts.join(":");
        const cachedCanvas = canvasCache.get(key);
        if (cachedCanvas) {
          layerContext.drawImage(cachedCanvas, dx, dy);
          iconDrawn = true;
        } else {
          const canvas = document.createElement("canvas");
          canvas.width = imageSize + hcPadding * 2;
          canvas.height = imageSize + hcPadding * 2;
          if (isCluster) {
            imageSize /= 1.5;
          }
          const context = canvas.getContext("2d", {
            willReadFrequently: true, // Optimize for frequent getImageData calls
          })!;
          context.shadowOffsetX = 0;
          context.shadowOffsetY = 0;
          if (!layer.options.highContrastMode) {
            context.shadowColor = "black";
            context.shadowBlur = 1;
          }
          if (isDiscovered) {
            context.filter = "grayscale(100%)";
            context.globalAlpha = 0.5;
          }

          const imgX = (canvas.width - imageSize) / 2;
          const imgY = (canvas.height - imageSize) / 2;

          // High contrast mode: draw white silhouette at offsets for a crisp outline
          if (layer.options.highContrastMode) {
            const silhouette = document.createElement("canvas");
            silhouette.width = canvas.width;
            silhouette.height = canvas.height;
            const silCtx = silhouette.getContext("2d")!;
            if ("width" in icon) {
              silCtx.drawImage(
                layer.imageElement,
                icon.x,
                icon.y,
                icon.width || imageSize,
                icon.height || imageSize,
                imgX,
                imgY,
                imageSize,
                imageSize,
              );
            } else {
              silCtx.drawImage(
                layer.imageElement,
                imgX,
                imgY,
                imageSize,
                imageSize,
              );
            }
            // Convert to solid white silhouette
            silCtx.globalCompositeOperation = "source-in";
            silCtx.fillStyle = "white";
            silCtx.fillRect(0, 0, silhouette.width, silhouette.height);
            // Draw at 8 offsets to create a solid outline
            const d = hcPadding;
            for (const [ox, oy] of [
              [-d, 0], [d, 0], [0, -d], [0, d],
              [-d, -d], [d, -d], [-d, d], [d, d],
            ]) {
              context.drawImage(silhouette, ox, oy);
            }
          }

          // Draw the actual icon
          if ("width" in icon) {
            context.drawImage(
              layer.imageElement,
              icon.x,
              icon.y,
              icon.width || imageSize,
              icon.height || imageSize,
              imgX,
              imgY,
              imageSize,
              imageSize,
            );
          } else {
            context.drawImage(
              layer.imageElement,
              imgX,
              imgY,
              imageSize,
              imageSize,
            );
          }

          if (isCluster) {
            context.beginPath();

            const startX = (canvas.width * 1.1) / 4;
            const startY = (canvas.height * 1.1) / 4;
            const length = canvas.width / 6;
            context.lineWidth = 2.5;
            context.strokeStyle = "white";
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
            context.shadowColor = "#000";
            context.shadowBlur = 2;
            context.moveTo(startX + length, startY);
            context.lineTo(startX - length, startY);
            context.moveTo(startX, startY + length);
            context.lineTo(startX, startY - length);
            context.stroke();
          } else if (zPos === "top") {
            context.beginPath();
            const arrowSize = canvas.width / 6;
            const arrowX = canvas.width / 6;
            const arrowY = canvas.height / 6;
            context.moveTo(arrowX, arrowY);
            context.lineTo(arrowX - arrowSize, arrowY + arrowSize);
            context.lineTo(arrowX + arrowSize, arrowY + arrowSize);
            context.closePath();
            context.fillStyle = "white";
            context.strokeStyle = "black";
            context.lineWidth = arrowSize / 10;
            context.fill();
            context.stroke();
          } else if (zPos === "bottom") {
            context.beginPath();
            const arrowSize = canvas.width / 6;
            const arrowX = canvas.width / 6;
            const arrowY = canvas.height / 6;
            context.moveTo(arrowX, arrowY);
            context.lineTo(arrowX - arrowSize, arrowY - arrowSize);
            context.lineTo(arrowX + arrowSize, arrowY - arrowSize);
            context.closePath();
            context.fillStyle = "white";
            context.strokeStyle = "black";
            context.lineWidth = arrowSize / 10;
            context.fill();
            context.stroke();
          }
          // Combined pixel processing: fillColor replacement + color-blind transform
          // Using a single getImageData/putImageData cycle instead of two separate ones
          const needsFillColor = Boolean(fillColor);
          const needsColorBlind =
            !isDiscovered &&
            colorBlindMode &&
            colorBlindMode !== "none" &&
            colorBlindSeverity > 0;

          if (needsFillColor || needsColorBlind) {
            // Single getImageData call for both transforms
            const imageData = context.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            );
            const data = imageData.data;

            // Apply fillColor replacement if needed
            if (needsFillColor) {
              // Parse the target color once
              const r = parseInt(fillColor!.slice(1, 3), 16);
              const g = parseInt(fillColor!.slice(3, 5), 16);
              const b = parseInt(fillColor!.slice(5, 7), 16);
              const a = parseInt(fillColor!.slice(7, 9), 16);

              // Iterate over each pixel
              for (let i = 0; i < data.length; i += 4) {
                const currentR = data[i];
                const currentG = data[i + 1];
                const currentB = data[i + 2];
                const currentA = data[i + 3];

                // Calculate the brightness of the current pixel
                const brightness =
                  0.299 * currentR + 0.587 * currentG + 0.114 * currentB;

                // Check if the brightness is above the threshold
                if (brightness > 150) {
                  // Apply the target color while preserving the alpha channel
                  data[i] = r;
                  data[i + 1] = g;
                  data[i + 2] = b;
                  if (a) {
                    data[i + 3] = Math.min(currentA, a);
                  }
                }
              }
            }

            // Apply color-blind transform if needed (after fillColor, on same data)
            if (needsColorBlind) {
              applyColorBlindTransform(
                data,
                colorBlindMode!,
                colorBlindSeverity,
              );
            }

            // Single putImageData call for both transforms
            context.putImageData(imageData, 0, 0);
          }

          if (!noCache) {
            canvasCache.set(key, canvas);
          }
          layerContext.drawImage(canvas, dx, dy);
          iconDrawn = true;
        }
      }
    }

    // Render text label above the icon (if set)
    if (layer.options.text) {
      layerContext.fillStyle = "#ffffff";
      layerContext.textAlign = "center";
      layerContext.strokeStyle = "#000000";
      const textScale = layer.options.textScale ?? 1;
      layerContext.font = `normal 700 ${radius * textScale}px Arial`;
      layerContext.lineWidth = 3;
      // Position text above the icon
      const textY = p.y - radius - 4;
      layerContext.strokeText(layer.options.text, p.x, textY);
      layerContext.lineWidth = 1;
      layerContext.fillText(layer.options.text, p.x, textY);
    }
  },
});

export type CanvasMarkerIcon =
  | {
      url: string;
    }
  | {
      name: string;
      url: string;
      x: number;
      y: number;
      width: number;
      height: number;
    };

export type CanvasMarkerOptions = {
  id: string;
  baseRadius: number;
  typeId?: string;
  address?: number;
  isHighlighted?: boolean;
  isDiscovered?: boolean;
  isCluster?: boolean;
  cluster?: Omit<Spawns[number], "cluster">[];
  noCache?: boolean;
  icon?: CanvasMarkerIcon | null;
  text?: string;
  textScale?: number;
  zPos?: "top" | "bottom" | null;
  colorBlindMode?: ColorBlindMode;
  colorBlindSeverity?: number;
  highContrastMode?: boolean;
};

export const canvasMarkerImgs: Record<string, HTMLImageElement> = {};

const canvasCache: Map<string, HTMLCanvasElement> = new Map();

export function clearCanvasCache() {
  canvasCache.clear();
}

let flatGameIcons:
  | {
      name: string;
      url: string;
      author: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }[]
  | null = null;
function findIcon(name: string) {
  if (!flatGameIcons) {
    flatGameIcons = gameIcons.flat().flatMap((g) => g.icons);
  }
  return flatGameIcons.find((icon) => icon.name === name);
}

let lastZoomLevel = -1;
let cachedZoomFactor = 1;
let radiusCache: Record<number, number> = {};
let radiusCacheZoom = -1;

function getZoomFactor(map: leaflet.Map): number {
  const zoom = map.getZoom();
  if (zoom === lastZoomLevel) return cachedZoomFactor;

  const minZoom = map.getMinZoom();
  const maxZoom = map.getMaxZoom();
  const factor = 1 / (maxZoom - minZoom);
  const normalizedZoom = zoom - minZoom;
  cachedZoomFactor = normalizedZoom * factor;
  lastZoomLevel = zoom;
  return cachedZoomFactor;
}

class CanvasMarker extends CircleMarker {
  declare options: leaflet.CircleMarkerOptions & CanvasMarkerOptions;
  declare _point: leaflet.Point;
  declare _radius: number;
  declare _latlng: leaflet.LatLngExpression;
  declare _latLngTuple: leaflet.LatLngTuple;
  declare _updateBounds: () => void;
  declare imageElement: HTMLImageElement;
  private _onImageLoad: (() => void) | undefined = undefined;

  constructor(
    latLng: leaflet.LatLngTuple,
    options: leaflet.CircleMarkerOptions & CanvasMarkerOptions,
  ) {
    super(latLng, options);
    this._latLngTuple = latLng;

    if ("icon" in options && options.icon) {
      let url = options.icon.url;
      if ("name" in options.icon && !options.icon.x) {
        const icon = findIcon(options.icon.name);
        if (icon) {
          this.options.icon = icon;
          url = icon.url;
        }
      }
      if (!canvasMarkerImgs[url]) {
        canvasMarkerImgs[url] = document.createElement("img");
        canvasMarkerImgs[url].crossOrigin = "anonymous";
        // Set decoding hint for better performance
        canvasMarkerImgs[url].decoding = "async";
        if (!url.startsWith("/") && !url.startsWith("http")) {
          canvasMarkerImgs[url].src = `/icons/${url}`;
        } else {
          canvasMarkerImgs[url].src = getImageURL(url);
        }
      }
      this.imageElement = canvasMarkerImgs[url];
    }
  }

  // Override setLatLng to keep _latLngTuple in sync for audio alert detection
  setLatLng(latLng: leaflet.LatLngExpression): this {
    if (Array.isArray(latLng)) {
      this._latLngTuple = latLng as leaflet.LatLngTuple;
    } else if ("lat" in latLng && "lng" in latLng) {
      this._latLngTuple = [latLng.lat, latLng.lng];
    }
    return super.setLatLng(latLng);
  }

  update() {
    try {
      if (this.options.isHighlighted) {
        this.bringToFront();
      }
      this.redraw();
    } catch (err) {
      //
    }
  }

  setZPos(zPos: CanvasMarkerOptions["zPos"]) {
    this.options.zPos = zPos;
    this.update();
  }

  setIcon(newIcon: CanvasMarkerIcon | null | undefined) {
    this.options.icon = newIcon;
    if (newIcon) {
      let url = newIcon.url;
      if ("name" in newIcon) {
        const icon = findIcon(newIcon.name);
        if (icon) {
          this.options.icon = icon;
          url = icon.url;
        }
      }
      if (!canvasMarkerImgs[url]) {
        canvasMarkerImgs[url] = document.createElement("img");
        canvasMarkerImgs[url].crossOrigin = "anonymous";
        canvasMarkerImgs[url].decoding = "async";
        canvasMarkerImgs[url].src = getImageURL(url);
        this._onImageLoad = undefined;
      }
      this.imageElement = canvasMarkerImgs[url];
    }
    this.update();
  }

  setHighlight(isHighlighted: boolean) {
    this.options.isHighlighted = isHighlighted;
    this.update();
  }

  setText(text: string | undefined, textScale?: number) {
    this.options.text = text;
    if (textScale !== undefined) {
      this.options.textScale = textScale;
    }
    this.update();
  }

  setColorBlindMode(mode: ColorBlindMode, skipUpdate = false) {
    if (this.options.colorBlindMode === mode) return;
    this.options.colorBlindMode = mode;
    if (!skipUpdate) this.update();
  }

  setHighContrastMode(enabled: boolean, skipUpdate = false) {
    if (this.options.highContrastMode === enabled) return;
    this.options.highContrastMode = enabled;
    if (!skipUpdate) this.update();
  }

  setColorBlindSeverity(severity: number, skipUpdate = false) {
    const s = Math.max(0, Math.min(1, severity));
    if (this.options.colorBlindSeverity === s) return;
    this.options.colorBlindSeverity = s;
    if (!skipUpdate) this.update();
  }

  // Batch update color blind settings to avoid double redraw
  setColorBlindSettings(mode: ColorBlindMode, severity: number) {
    const s = Math.max(0, Math.min(1, severity));
    const modeChanged = this.options.colorBlindMode !== mode;
    const severityChanged = this.options.colorBlindSeverity !== s;

    if (!modeChanged && !severityChanged) return;

    this.options.colorBlindMode = mode;
    this.options.colorBlindSeverity = s;
    this.update();
  }

  _project(): void {
    const zoom = this._map.getZoom();

    if (radiusCacheZoom !== zoom) {
      radiusCacheZoom = zoom;
      radiusCache = {};
    }

    const baseRadius = this.options.radius!;
    if (!(baseRadius in radiusCache)) {
      const zoomFactor = getZoomFactor(this._map);
      radiusCache[baseRadius] = baseRadius / 2 + baseRadius * 2 * zoomFactor;
    }

    this._radius = radiusCache[baseRadius];
    this._point = this._map.latLngToLayerPoint(this._latlng);
  }

  _updatePath(): void {
    if (!this.imageElement || this.imageElement.complete) {
      if (this._onImageLoad) {
        this.imageElement.removeEventListener("load", this._onImageLoad);
        this.imageElement.removeEventListener("error", this._onImageLoad);
      }
      // @ts-expect-error updateCanvasImg is a custom method
      this._renderer.updateCanvasImg(this);
    } else if (!this._onImageLoad) {
      this._onImageLoad = () => {
        this.imageElement.removeEventListener("load", this._onImageLoad!);
        this.imageElement.removeEventListener("error", this._onImageLoad!);
        this._onImageLoad = undefined;
        // @ts-expect-error updateCanvasImg is a custom method
        this._renderer.updateCanvasImg(this);
      };
      this.imageElement.addEventListener("load", this._onImageLoad);
      this.imageElement.addEventListener("error", this._onImageLoad);
    }
  }

  toggleDiscovered() {
    this.options.isDiscovered = !this.options.isDiscovered;
    this.update();
  }
}

export default CanvasMarker;
