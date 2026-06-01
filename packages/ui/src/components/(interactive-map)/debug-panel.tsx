"use client";

import { isDebug } from "@repo/lib";
import { useEffect, useRef, useState } from "react";
import { useMapStore } from "./store";

interface DebugStats {
  fps: number;
  frameTime: string;
  memoryUsed: string;
  memoryTotal: string;
  totalMarkers: number;
  visibleMarkers: number;
  culledMarkers: number;
  drawCalls: number;
  sheetGroups: number;
  cullSkipped: boolean;
  zoom: string;
}

export function DebugPanel() {
  if (!isDebug()) return null;
  return <DebugPanelInner />;
}

function DebugPanelInner() {
  const [stats, setStats] = useState<DebugStats | null>(null);
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameRef = useRef(performance.now());
  const map = useMapStore((s) => s.map);

  useEffect(() => {
    let rafId: number;

    const tick = () => {
      const now = performance.now();
      const dt = now - lastFrameRef.current;
      lastFrameRef.current = now;

      const frameTimes = frameTimesRef.current;
      frameTimes.push(dt);
      // Keep last 60 samples
      if (frameTimes.length > 60) frameTimes.shift();

      // Update stats every 30 frames to avoid excessive re-renders
      if (frameTimes.length % 30 === 0) {
        const avgFrameTime =
          frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        const fps = 1000 / avgFrameTime;

        const mem = (performance as any).memory;
        const memUsed = mem
          ? (mem.usedJSHeapSize / 1024 / 1024).toFixed(0)
          : "?";
        const memTotal = mem
          ? (mem.totalJSHeapSize / 1024 / 1024).toFixed(0)
          : "?";

        const markerLayer = map?.markerLayer;
        const liveMarkerLayer = map?.liveMarkerLayer;
        const markerStats = markerLayer?.stats;
        const liveStats = liveMarkerLayer?.stats;

        const totalMarkers =
          (markerStats?.totalInstances ?? 0) + (liveStats?.totalInstances ?? 0);
        const visibleMarkers =
          (markerStats?.visibleInstances ?? 0) +
          (liveStats?.visibleInstances ?? 0);
        const culledMarkers =
          (markerStats?.culledInstances ?? 0) +
          (liveStats?.culledInstances ?? 0);
        const drawCalls =
          (markerStats?.drawCalls ?? 0) + (liveStats?.drawCalls ?? 0);
        const sheetGroups =
          (markerStats?.sheetGroups ?? 0) + (liveStats?.sheetGroups ?? 0);
        const cullSkipped =
          (markerStats?.cullSkipped ?? false) ||
          (liveStats?.cullSkipped ?? false);

        const zoom = map ? map.getZoom().toFixed(2) : "?";

        setStats({
          fps: Math.round(fps),
          frameTime: avgFrameTime.toFixed(1),
          memoryUsed: memUsed,
          memoryTotal: memTotal,
          totalMarkers,
          visibleMarkers,
          culledMarkers,
          drawCalls,
          sheetGroups,
          cullSkipped,
          zoom,
        });
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [map]);

  if (!stats) return null;

  const culledPct =
    stats.totalMarkers > 0
      ? Math.round((stats.culledMarkers / stats.totalMarkers) * 100)
      : 0;

  return (
    <div
      className="fixed bottom-2 right-2 z-9999 rounded bg-black/80 px-3 py-2 font-mono text-xs text-green-400 pointer-events-none select-none"
      style={{ minWidth: 220 }}
    >
      <div className="mb-1 text-green-300 font-bold">Debug</div>
      <div>
        FPS: {stats.fps} ({stats.frameTime}ms)
      </div>
      <div>
        Memory: {stats.memoryUsed} / {stats.memoryTotal} MB
      </div>
      <div>Zoom: {stats.zoom}</div>
      <div className="mt-1 border-t border-green-800 pt-1">
        <div>
          Markers: {stats.visibleMarkers} / {stats.totalMarkers} visible
        </div>
        <div>
          Culled: {stats.culledMarkers} ({culledPct}%)
          {stats.cullSkipped && " [skipped]"}
        </div>
        <div>Draw calls: {stats.drawCalls}</div>
        <div>Sheet groups: {stats.sheetGroups}</div>
      </div>
    </div>
  );
}
