# WebMap Migration Plan

This document tracks the incremental migration from Leaflet to the custom WebGL2 WebMap engine.

## Background

- **Goal**: Replace Leaflet with custom WebGL2 map engine for better performance (10k-100k markers)
- **Strategy**: Migrate incrementally, starting with simple maps

## PR Breakdown

### PR #1: WebMap Core + SimpleMap Migration
**Status**: ✅ Complete
**Risk**: Low (only affects 2 apps with simple maps)

**Scope**:
1. Add WebMap engine (`packages/lib/src/web-map/*`)
   - `webmap.ts` - Core engine with camera, pan/zoom, rotation, touch gestures
   - `layers/tiles.ts` - WebGL2 tile rendering
   - `layers/icon-markers.ts` - Instanced marker rendering
   - `layers/grid.ts` - Grid overlay with labels
   - Utils: shaders, color-blind simulation, GL helpers

2. Add SimpleWebMap components (`packages/ui/src/components/(interactive-map)/`)
   - `simple-webmap.tsx` - WebMap wrapper component
   - `simple-webmap-markers.tsx` - Marker layer with tooltips
   - `simple-webmap-grid.tsx` - Grid layer component

3. Migrate simple map pages:
   - `palia-web` - pile map (rummage piles)
   - `once-human-web` - echoes-of-stardust page

**Implemented features**:
- [x] Tiles render correctly with color-blind support
- [x] Pan/zoom (mouse wheel, drag)
- [x] Pinch-to-zoom on mobile
- [x] Double-tap to zoom on mobile
- [x] Markers with tooltips
- [x] Grid overlay with labels
- [x] DPR-aware rendering (consistent across devices)

---

### PR #2: Migrate Main InteractiveMap
**Status**: Blocked by PR #1
**Risk**: Medium (affects all game maps)

**Scope**:
1. Update `interactive-map.tsx`
2. Migrate marker system:
   - `markers.tsx`
   - `simple-markers.tsx`
   - `player-marker.ts`
   - `teammate.tsx`
   - `private-node.tsx`

3. Add WebMap adapters:
   - `webmap-marker.ts`
   - `webmap-portal-container.ts`

**Testing checklist**:
- [ ] Markers render and are clickable
- [ ] Tooltips work
- [ ] Player position tracking works
- [ ] Teammate markers work
- [ ] Icon sprites load correctly
- [ ] Highlighting works

---

### PR #3: Migrate Drawing System
**Status**: Blocked by PR #2
**Risk**: Medium

**Scope**:
1. Update `private-drawing.tsx` - Replace Geoman with WebMap DrawingManager
2. Add `webmap-drawing-adapter.ts` - Compatibility layer

**Features to verify**:
- [ ] Line drawing
- [ ] Rectangle drawing
- [ ] Polygon drawing
- [ ] Circle drawing
- [ ] Text markers
- [ ] Edit existing shapes
- [ ] Delete shapes
- [ ] Save/load drawings

---

### PR #4: Cleanup & Remove Leaflet
**Status**: Blocked by PR #3
**Risk**: Low (after all migrations complete)

**Scope**:
1. Remove from `packages/ui/package.json`:
   - `leaflet`
   - `@geoman-io/leaflet-geoman-free`
   - `@types/leaflet`

2. Remove CSS imports:
   - `leaflet/dist/leaflet.css`
   - `@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css`

3. Remove any Leaflet compatibility shims

**Result**: Reduced bundle size (~500KB+)

---

## Source Reference

The original WebMap implementation exists in `feat/thgl-map` branch:
- Commit `6ac708c32` - "Prepare map rework (replace leaflet)"
- Files to cherry-pick from: `packages/lib/src/web-map/*`

## WebMap Features

**Implemented**:
- Cursor-anchored zoom with smooth pan
- Pan inertia with soft bounds
- Rotation controls (RMB drag)
- Cross-fade LOD tile transitions
- Tile cache with LRU eviction
- Instanced markers with highlighting
- Icon atlas/spritesheets
- Color-blind simulation shaders
- Touch gestures (pinch-to-zoom, double-tap zoom)
- Grid overlay with labels

**TODO** (can be added later):
- Drawing tools (line, rect, polygon, circle, text)
- Keyboard shortcuts
- GPU color picking
- SDF text rendering
- Vector layers

## Commands

```bash
# Start fresh branch from main
git checkout main
git pull
git checkout -b feat/webmap-pr1

# Cherry-pick WebMap core from old branch
git checkout feat/thgl-map -- packages/lib/src/web-map/

# Development
bun run dev:web

# Type check
bun run typecheck

# Build
bun run build
```
