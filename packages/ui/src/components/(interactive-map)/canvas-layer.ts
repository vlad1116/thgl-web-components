import type { Coords, TileLayer, TileLayerOptions } from "leaflet";
import leaflet from "leaflet";
import type { ColorBlindMode } from "@repo/lib";
import { applyColorBlindTransform } from "./color-blind";
import { isStateError, useNitroState } from "../(ads)";

type Tile = HTMLCanvasElement & { complete: boolean };

let isNitroError = false;

// Track all active canvas layer instances
const activeLayerInstances = new Set<TileLayer>();

useNitroState.subscribe(() => {
  const wasError = isNitroError;
  isNitroError = isStateError();

  // If state changed to ERROR, add watermark to existing tiles
  if (!wasError && isNitroError) {
    activeLayerInstances.forEach((layer) => {
      try {
        // Find all canvas tiles in the layer
        const container = (layer as any)._container;
        if (!container) return;

        const canvasTiles = container.querySelectorAll("canvas");
        canvasTiles.forEach((canvas: HTMLCanvasElement) => {
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          const width = canvas.width;
          const height = canvas.height;

          // Draw watermark on existing tile
          ctx.save();
          ctx.translate(width / 2, height / 2);
          ctx.rotate(-Math.PI / 4);
          ctx.font = "bold 24px sans-serif";
          ctx.fillStyle = "rgba(255, 0, 0, 0.15)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.fillText("Ad-Blocker Detected", 0, 0);
          ctx.restore();
        });
      } catch (e) {
        //console.error("Failed to add watermark to tiles:", e);
      }
    });
  }
});

const CanvasLayer = leaflet.TileLayer.extend({
  onAdd(map: any) {
    // Track this layer instance
    activeLayerInstances.add(this);
    // Call parent onAdd
    return leaflet.TileLayer.prototype.onAdd.call(this, map);
  },
  onRemove(map: any) {
    // Remove this layer instance from tracking
    activeLayerInstances.delete(this);
    // Call parent onRemove
    return leaflet.TileLayer.prototype.onRemove.call(this, map);
  },
  createCanvas(
    tile: Tile,
    coords: Coords,
    done: (err: unknown, tile: Tile) => void,
  ) {
    let err: unknown;
    const ctx = tile.getContext("2d");
    const { x: width, y: height } = this.getTileSize();
    tile.width = width;
    tile.height = height;

    const img = new Image();
    img.onload = () => {
      try {
        if (
          this.options.filter === "greyscale" ||
          this.options.filter === "colorful"
        ) {
          const threshold = this.options.threshold || 150;
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d")!;
          context.drawImage(img, 0, 0);

          const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          );
          const pixels = imageData.data;
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            if (gray >= threshold) {
              // Make grey
              if (this.options.filter === "greyscale") {
                pixels[i] = pixels[i + 1] = pixels[i + 2] = 100;
              }
              pixels[i + 3] = 180;
            } else {
              // Make transparent
              pixels[i + 3] = 1;
            }
          }

          // Apply color-blind simulation after overlay processing
          const mode = this.options.colorBlindMode || "none";
          const severity =
            typeof this.options.colorBlindSeverity === "number"
              ? this.options.colorBlindSeverity
              : 1;
          if (mode !== "none" && severity > 0) {
            applyColorBlindTransform(imageData.data, mode, severity);
          }
          ctx?.putImageData(imageData, 0, 0);
        } else {
          ctx?.drawImage(img, 0, 0);
          // Apply color-blind simulation on normal tiles
          const mode = this.options.colorBlindMode || "none";
          const severity =
            typeof this.options.colorBlindSeverity === "number"
              ? this.options.colorBlindSeverity
              : 1;
          if (mode !== "none" && severity > 0) {
            const imageData = ctx!.getImageData(0, 0, width, height);
            applyColorBlindTransform(imageData.data, mode, severity);
            ctx?.putImageData(imageData, 0, 0);
          }
        }

        // Draw watermark if ad-blocker detected
        if (ctx && isNitroError) {
          ctx.save();

          // Move to center and rotate
          ctx.translate(width / 2, height / 2);
          ctx.rotate(-Math.PI / 4); // -45 degrees

          // Configure text
          ctx.font = "bold 24px sans-serif";
          ctx.fillStyle = "rgba(255, 0, 0, 0.15)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          // Draw text shadow for better visibility
          ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          ctx.fillText("Ad-Blocker Detected", 0, 0);

          ctx.restore();
        }

        tile.complete = true;
      } catch (e) {
        err = e;
      } finally {
        done(err, tile);
      }
    };
    const tileZoom = this._getZoomForUrl();
    img.src = isNaN(tileZoom) ? "" : this.getTileUrl(coords);
    img.crossOrigin = "anonymous";
  },
  createTile(coords: Coords, done: () => void) {
    const { timeout } = this.options;
    const { z: zoom } = coords;
    const tile = document.createElement("canvas");

    if (timeout) {
      if (zoom !== this._delaysForZoom) {
        this._clearDelaysForZoom();
        this._delaysForZoom = zoom;
      }

      if (!this._delays[zoom]) this._delays[zoom] = [];

      this._delays[zoom].push(
        setTimeout(() => {
          this.createCanvas(tile, coords, done);
        }, timeout),
      );
    } else {
      this.createCanvas(tile, coords, done);
    }

    // Double-check watermark after a short delay (catches race condition with cached images)
    setTimeout(() => {
      // @ts-ignore
      if (isNitroError && tile.complete) {
        const ctx = tile.getContext("2d");
        if (!ctx) return;

        const { x: width, y: height } = this.getTileSize();

        // Check if watermark already exists by sampling center pixel
        const imageData = ctx.getImageData(width / 2, height / 2, 1, 1);
        const hasWatermark = imageData.data[3] > 0; // Alpha channel check

        if (!hasWatermark || imageData.data[0] < 200) {
          // Draw watermark
          ctx.save();
          ctx.translate(width / 2, height / 2);
          ctx.rotate(-Math.PI / 4);
          ctx.font = "bold 24px sans-serif";
          ctx.fillStyle = "rgba(255, 0, 0, 0.15)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.fillText("Ad-Blocker Detected", 0, 0);
          ctx.restore();
        }
      }
    }, 9);

    return tile;
  },
  _clearDelaysForZoom() {
    const prevZoom = this._delaysForZoom;
    const delays = this._delays[prevZoom];

    if (!delays) return;

    delays.forEach((delay: number, index: number) => {
      clearTimeout(delay);
      delete delays[index];
    });

    delete this._delays[prevZoom];
  },
}) as new (url: string, options: TileLayerOptions) => TileLayer;

export const createCanvasLayer = function (
  url: string,
  options: TileLayerOptions & {
    filter: string;
    threshold?: number;
    colorBlindMode?: ColorBlindMode;
    colorBlindSeverity?: number;
    rotation?: {
      angle: number;
      center: [number, number];
    };
    bounds?: [[number, number], [number, number]];
  },
) {
  return new CanvasLayer(url, options);
};
