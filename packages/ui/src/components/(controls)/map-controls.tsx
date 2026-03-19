"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Home, Minus, Plus, RotateCcw } from "lucide-react";
import { cn } from "@repo/lib";
import { useMap } from "../(interactive-map)/store";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Button } from "../ui/button";

/** Large interactive compass with draggable bearing ring and tilt slider */
function CompassPopover({
  bearing,
  pitch,
  onBearingChange,
  onPitchChange,
  onResetNorth,
}: {
  bearing: number;
  pitch: number;
  onBearingChange: (rad: number) => void;
  onPitchChange: (rad: number) => void;
  onResetNorth: () => void;
}) {
  const ringRef = useRef<SVGCircleElement>(null);
  const draggingRef = useRef(false);

  const getAngleFromEvent = useCallback(
    (e: React.MouseEvent | React.PointerEvent) => {
      const svg = ringRef.current?.closest("svg");
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // atan2 gives angle from positive X axis; we want angle from north (negative Y)
      return Math.atan2(e.clientX - cx, -(e.clientY - cy));
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      draggingRef.current = true;
      (e.target as Element).setPointerCapture(e.pointerId);
      const angle = getAngleFromEvent(e);
      if (angle !== null) onBearingChange(-angle);
    },
    [getAngleFromEvent, onBearingChange],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const angle = getAngleFromEvent(e);
      if (angle !== null) onBearingChange(-angle);
    },
    [getAngleFromEvent, onBearingChange],
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const maxPitch = 1.4;
  const pitchPercent = (pitch / maxPitch) * 100;

  return (
    <div className="flex flex-col gap-3 items-center select-none">
      <div className="flex gap-3 items-center">
        {/* Draggable compass ring */}
        <div className="relative">
          <svg
            viewBox="0 0 120 120"
            className="w-28 h-28 cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Outer ring */}
            <circle
              ref={ringRef}
              cx="60"
              cy="60"
              r="54"
              fill="none"
              className="stroke-border"
              strokeWidth="2"
            />
            {/* Tick marks and labels, rotated with bearing */}
            <g
              style={{ transform: `rotate(${-bearing}rad)` }}
              transform-origin="60 60"
            >
              {/* Cardinal ticks */}
              {[0, 90, 180, 270].map((deg) => (
                <line
                  key={deg}
                  x1="60"
                  y1="8"
                  x2="60"
                  y2="16"
                  className="stroke-muted-foreground"
                  strokeWidth="2"
                  transform={`rotate(${deg} 60 60)`}
                />
              ))}
              {/* Minor ticks */}
              {[45, 135, 225, 315].map((deg) => (
                <line
                  key={deg}
                  x1="60"
                  y1="10"
                  x2="60"
                  y2="15"
                  className="stroke-muted-foreground/50"
                  strokeWidth="1"
                  transform={`rotate(${deg} 60 60)`}
                />
              ))}
              {/* N label */}
              <text
                x="60"
                y="26"
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                className="fill-red-400"
              >
                N
              </text>
              {/* S label */}
              <text
                x="60"
                y="100"
                textAnchor="middle"
                fontSize="9"
                className="fill-muted-foreground"
              >
                S
              </text>
              {/* E label */}
              <text
                x="99"
                y="64"
                textAnchor="middle"
                fontSize="9"
                className="fill-muted-foreground"
              >
                E
              </text>
              {/* W label */}
              <text
                x="21"
                y="64"
                textAnchor="middle"
                fontSize="9"
                className="fill-muted-foreground"
              >
                W
              </text>
              {/* North needle */}
              <polygon points="60,20 56,60 64,60" className="fill-red-500" />
              {/* South needle */}
              <polygon
                points="60,100 56,60 64,60"
                className="fill-zinc-400/60"
              />
            </g>
            {/* Center dot (stationary) */}
            <circle cx="60" cy="60" r="3" className="fill-zinc-300" />
          </svg>
        </div>

        {/* Tilt slider (vertical) */}
        <div className="flex flex-col items-center gap-1 h-28">
          <span className="text-[10px] text-muted-foreground">Tilt</span>
          <div className="flex-1 relative w-6 flex items-center justify-center">
            <input
              type="range"
              min="0"
              max="100"
              value={pitchPercent}
              onChange={(e) =>
                onPitchChange((Number(e.target.value) / 100) * maxPitch)
              }
              className="absolute h-20 w-20 -rotate-90 accent-primary cursor-pointer"
              style={{ appearance: "auto" }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {Math.round((pitch / Math.PI) * 180)}°
          </span>
        </div>
      </div>

      {/* Heading display + reset */}
      <div className="flex items-center gap-2 w-full">
        <span className="text-xs text-muted-foreground tabular-nums flex-1 text-center">
          {Math.round((((-bearing % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / Math.PI * 180)}°
        </span>
        <button
          onClick={onResetNorth}
          className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>
    </div>
  );
}

/** Small compass needle for the button */
function CompassNeedle({ bearing }: { bearing: number }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className="w-full h-full"
      style={{ transform: `rotate(${-bearing}rad)` }}
    >
      <polygon points="20,6 17,20 23,20" className="fill-red-500" />
      <polygon points="20,34 17,20 23,20" className="fill-zinc-400" />
      <circle cx="20" cy="20" r="2" className="fill-zinc-300" />
      <text
        x="20"
        y="5"
        textAnchor="middle"
        fontSize="5"
        fontWeight="bold"
        className="fill-red-400"
      >
        N
      </text>
    </svg>
  );
}

export function MapControls() {
  const map = useMap();
  const [bearing, setBearing] = useState(0);
  const [pitch, setPitch] = useState(0);
  const rafRef = useRef<number>(0);

  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    if (!map) return;
    let active = true;
    const update = () => {
      const m = mapRef.current;
      if (!active || !m) return;
      setBearing(m.getBearing());
      setPitch(m.getPitch());
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [map]);

  const handleBearingChange = useCallback(
    (rad: number) => map?.setBearing(rad),
    [map],
  );
  const handlePitchChange = useCallback(
    (rad: number) => map?.setPitch(rad),
    [map],
  );
  const handleResetNorth = useCallback(() => {
    if (!map) return;
    map.setBearing(0);
    map.setPitch(0);
  }, [map]);
  const handleToggle3D = useCallback(() => {
    if (!map) return;
    map.setPitch(map.getPitch() > 0.05 ? 0 : 0.7);
  }, [map]);
  const handleZoomIn = useCallback(() => map?.zoomIn(), [map]);
  const handleZoomOut = useCallback(() => map?.zoomOut(), [map]);
  const handleResetView = useCallback(() => map?.resetView(), [map]);

  if (!map) return null;

  const is3D = pitch > 0.05;
  const showCompassActive = Math.abs(bearing) > 0.01 || is3D;

  return (
    <>
      {/* Compass */}
      <Popover>
        <Tooltip delayDuration={200} disableHoverableContent>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className={cn(showCompassActive && "ring-1 ring-red-500/40")}
                aria-label="Compass"
              >
                <CompassNeedle bearing={bearing} />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Compass</TooltipContent>
        </Tooltip>
        <PopoverContent side="bottom" className="w-auto p-3">
          <CompassPopover
            bearing={bearing}
            pitch={pitch}
            onBearingChange={handleBearingChange}
            onPitchChange={handlePitchChange}
            onResetNorth={handleResetNorth}
          />
        </PopoverContent>
      </Popover>

      {/* 3D toggle */}
      <Tooltip delayDuration={200} disableHoverableContent>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            onClick={handleToggle3D}
            className={cn("text-xs font-bold", is3D && "text-primary")}
            aria-label={is3D ? "Switch to 2D" : "Switch to 3D"}
          >
            {is3D ? "2D" : "3D"}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {is3D ? "Switch to 2D" : "Switch to 3D"}
        </TooltipContent>
      </Tooltip>

      {/* Zoom in */}
      <Tooltip delayDuration={200} disableHoverableContent>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline" onClick={handleZoomIn} aria-label="Zoom in">
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Zoom in</TooltipContent>
      </Tooltip>

      {/* Zoom out */}
      <Tooltip delayDuration={200} disableHoverableContent>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline" onClick={handleZoomOut} aria-label="Zoom out">
            <Minus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Zoom out</TooltipContent>
      </Tooltip>

      {/* Reset view */}
      <Tooltip delayDuration={200} disableHoverableContent>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline" onClick={handleResetView} aria-label="Reset view">
            <Home className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Reset view</TooltipContent>
      </Tooltip>
    </>
  );
}
