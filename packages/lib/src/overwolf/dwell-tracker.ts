// Dwell-time gating for actor reporting.
//
// Memory reading occasionally surfaces an actor for only a frame or two — a
// "blink" — because of a transient bad read or an in-game loading state. Those
// blinks reach the actors-api as real spawns and become permanent false
// positives. A dwell tracker suppresses them: an actor is only considered
// "stable" once it has been continuously visible for `dwellMs`. A short grace
// window tolerates brief disappearances (level streaming / LOD flicker) without
// restarting the timer, so genuinely persistent actors are not penalised.
//
// The tracker also remembers the FIRST position at which each actor was seen.
// For a moving actor (a wandering bug), the position drifts between first
// detection and the throttled send tick — reporting the live position scatters
// a mover's sightings across the map so server-side consensus can never
// corroborate them. Reporting the first-seen position instead concentrates
// sightings near the spawn point, where consensus works.
//
// Usage (per high-frequency `onActors` frame):
//   tracker.observe(actors);              // record every visible actor + position
//   const stable = candidates.filter((a) => tracker.isStable(a.address));
//   const pos = tracker.getFirstPosition(a.address) ?? a;  // send first-seen pos

export type DwellTrackerOptions = {
  /** Continuous visibility required before an actor is "stable". Default 5000ms. */
  dwellMs?: number;
  /** Tolerated gap before the dwell timer restarts. Default 1500ms. */
  graceMs?: number;
  /** Drop entries unseen for this long to bound memory. Default 60000ms. */
  pruneMs?: number;
};

/** Minimal shape the tracker needs: an address and (optionally) a position. */
export type TrackedActor = {
  address: number;
  x?: number;
  y?: number;
  z?: number;
};

export type Position = { x: number; y: number; z: number };

export type DwellTracker = {
  /** Record the full set of currently-visible actors (+ positions) this frame. */
  observe: (actors: TrackedActor[], now?: number) => void;
  /** True once the address has been continuously visible for `dwellMs`. */
  isStable: (address: number, now?: number) => boolean;
  /** The position at which the address was first seen (since its last reset). */
  getFirstPosition: (address: number) => Position | undefined;
};

type Entry = {
  firstSeen: number;
  lastSeen: number;
  firstPos?: Position;
};

export function createDwellTracker(
  options: DwellTrackerOptions = {},
): DwellTracker {
  const dwellMs = options.dwellMs ?? 5000;
  const graceMs = options.graceMs ?? 1500;
  const pruneMs = options.pruneMs ?? 60000;

  const seen = new Map<number, Entry>();

  const posOf = (actor: TrackedActor): Position | undefined =>
    actor.x !== undefined && actor.y !== undefined && actor.z !== undefined
      ? { x: actor.x, y: actor.y, z: actor.z }
      : undefined;

  function observe(actors: TrackedActor[], now = Date.now()): void {
    for (const actor of actors) {
      const entry = seen.get(actor.address);
      if (!entry) {
        seen.set(actor.address, {
          firstSeen: now,
          lastSeen: now,
          firstPos: posOf(actor),
        });
      } else {
        // Vanished for longer than the grace window before qualifying: restart
        // the dwell timer (and the anchor position) so a blink can never
        // accumulate toward the threshold.
        if (now - entry.lastSeen > graceMs) {
          entry.firstSeen = now;
          entry.firstPos = posOf(actor);
        }
        entry.lastSeen = now;
      }
    }

    // Prune entries we have not seen in a while to keep the map bounded.
    for (const [address, entry] of seen) {
      if (now - entry.lastSeen > pruneMs) {
        seen.delete(address);
      }
    }
  }

  function isStable(address: number, now = Date.now()): boolean {
    const entry = seen.get(address);
    if (!entry) {
      return false;
    }
    // Must still be currently visible (within the grace window) AND have been
    // visible for at least the dwell threshold.
    if (now - entry.lastSeen > graceMs) {
      return false;
    }
    return now - entry.firstSeen >= dwellMs;
  }

  function getFirstPosition(address: number): Position | undefined {
    return seen.get(address)?.firstPos;
  }

  return { observe, isStable, getFirstPosition };
}
