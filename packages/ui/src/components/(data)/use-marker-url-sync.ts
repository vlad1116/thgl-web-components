"use client";

import { useEffect, useRef } from "react";
import { getNodeId, isOverwolf, Spawn, useUserStore } from "@repo/lib";
import { useCoordinates, useT } from "../(providers)";
import { useMapStore } from "../(interactive-map)";

export function getMarkerDisplayName(
  spawn: { name?: string; id?: string; type: string },
  t: ReturnType<typeof useT>,
): string {
  const termId = (spawn.name ?? spawn.id ?? spawn.type).replace(
    /my_\d+_/,
    "",
  );
  return t(termId, { fallback: spawn.type });
}

/** Find a spawn by selectedNodeId, with fallback for coordinate mismatches from clustering */
function findSpawn(
  selectedNodeId: string,
  spawns: Spawn[],
): Spawn | null {
  // Pass 1: exact match
  for (const s of spawns) {
    if (getNodeId(s) === selectedNodeId) return s;
    if (s.cluster) {
      for (const c of s.cluster) {
        if (getNodeId(c) === selectedNodeId) return c;
      }
    }
  }
  // Pass 2: match by id prefix (before @) — handles coordinate mismatch from clustering
  const atIdx = selectedNodeId.indexOf("@");
  if (atIdx > 0) {
    const idPart = selectedNodeId.slice(0, atIdx);
    for (const s of spawns) {
      const sid = s.id?.includes("@")
        ? s.id.slice(0, s.id.indexOf("@"))
        : s.id || s.type;
      if (sid === idPart) return s;
      if (s.cluster) {
        for (const c of s.cluster) {
          const cid = c.id?.includes("@")
            ? c.id.slice(0, c.id.indexOf("@"))
            : c.id || c.type;
          if (cid === idPart) return c;
        }
      }
    }
  }
  return null;
}

export function useMarkerUrlSync(markerSlug: string | undefined) {
  const { spawns } = useCoordinates();
  const t = useT();
  const selectedNodeId = useUserStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useUserStore((state) => state.setSelectedNodeId);
  const mapName = useUserStore((state) => state.mapName);
  const hasResolved = useRef(false);
  const initialTitle = useRef<string>("");

  // Store the original document title on mount
  useEffect(() => {
    initialTitle.current = document.title;
  }, []);

  // Resolve markerSlug to nodeId on initial load
  useEffect(() => {
    if (!markerSlug || hasResolved.current || !spawns.length) return;

    const findMatch = (): Spawn | null => {
      // Check ?id= query param first (most reliable)
      const searchParams = new URLSearchParams(location.search);
      const idParam = searchParams.get("id");
      if (idParam) {
        const match = findSpawn(idParam, spawns);
        if (match) return match;
      }

      // Try matching slug as a nodeId (e.g., "camp_534@-1648:-4406")
      if (markerSlug.includes("@")) {
        const match = findSpawn(markerSlug, spawns);
        if (match) return match;
      }

      // Fall back to matching by translated name
      for (const spawn of spawns) {
        const name = getMarkerDisplayName(spawn, t);
        if (name === markerSlug) return spawn;
        if (spawn.cluster) {
          for (const c of spawn.cluster) {
            const cName = getMarkerDisplayName(c, t);
            if (cName === markerSlug) return c;
          }
        }
      }
      return null;
    };

    const match = findMatch();
    if (!match) return;

    // Select immediately
    hasResolved.current = true;
    setSelectedNodeId(getNodeId(match));

    // Center map on spawn
    const coords: [number, number] = [match.p[0], match.p[1]];
    const tryCenter = () => {
      const map = useMapStore.getState().map;
      if (!map) return false;
      map.setCenter(coords);
      return true;
    };

    if (!tryCenter()) {
      const unsub = useMapStore.subscribe(() => {
        if (tryCenter()) unsub();
      });
      return unsub;
    }
  }, [markerSlug, spawns, t, setSelectedNodeId]);

  // Sync URL and document.title when selectedNodeId changes
  useEffect(() => {
    if (isOverwolf) return;
    if (typeof window === "undefined") return;
    if (!location.pathname.includes("/maps/")) return;

    const mapsIdx = location.pathname.indexOf("/maps/");
    const afterMaps = location.pathname.slice(mapsIdx + 6);
    const mapSlug = afterMaps.split("/")[0];
    if (!mapSlug) return;
    const basePath = location.pathname.slice(0, mapsIdx + 6) + mapSlug;

    if (selectedNodeId && spawns.length) {
      const spawn = findSpawn(selectedNodeId, spawns);
      if (spawn) {
        const name = getMarkerDisplayName(spawn, t);
        const typeName = t(spawn.type, { fallback: spawn.type });
        const canonicalNodeId = getNodeId(spawn);
        // Use human name in path if the spawn has a translated/readable name
        const rawId = (spawn.name ?? spawn.id ?? spawn.type).replace(/my_\d+_/, "");
        const hasSpecificName = name !== rawId && name !== typeName;
        const slug = hasSpecificName
          ? encodeURIComponent(name)
          : encodeURIComponent(canonicalNodeId);
        const query = hasSpecificName
          ? `?id=${encodeURIComponent(canonicalNodeId)}`
          : "";
        const newPath = `${basePath}/${encodeURIComponent(typeName)}/${slug}${query}`;
        if (
          decodeURIComponent(location.pathname + location.search) !==
          decodeURIComponent(newPath)
        ) {
          history.replaceState({}, "", newPath);
        }
        document.title = `${name} - ${t(mapName)} | ${document.title.split(" | ").pop() ?? ""}`;
      }
    } else if (!selectedNodeId) {
      // Deselected — restore base URL and title
      // But skip if we have a pending slug that hasn't resolved yet
      if (markerSlug && !hasResolved.current) return;
      if (decodeURIComponent(location.pathname) !== decodeURIComponent(basePath)) {
        history.replaceState({}, "", basePath);
      }
      if (initialTitle.current) {
        document.title = initialTitle.current;
      }
    }
  }, [selectedNodeId, spawns, t, mapName]);
}
