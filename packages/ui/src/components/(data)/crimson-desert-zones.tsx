"use client";
import { DATA_FORGE_CDN_URL } from "@repo/lib";
import { MapOverlays } from "./map-overlays";

const CDN = `${DATA_FORGE_CDN_URL}/crimson-desert/icons/overlays`;

export function CrimsonDesertZones() {
  return <MapOverlays configUrl={`${CDN}/overlays.json`} basePath={CDN} />;
}
