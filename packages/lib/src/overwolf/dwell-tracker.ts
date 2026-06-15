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
// Usage (per high-frequency `onActors` frame):
//   tracker.observe(actors);              // record every visible actor
//   const stable = candidates.filter((a) => tracker.isStable(a.address));

export type DwellTrackerOptions = {
  /** Continuous visibility required before an actor is "stable". Default 5000ms. */
  dwellMs?: number;
  /** Tolerated gap before the dwell timer restarts. Default 1500ms. */
  graceMs?: number;
  /** Drop entries unseen for this long to bound memory. Default 60000ms. */
  pruneMs?: number;
};

export type DwellTracker = {
  /** Record the full set of currently-visible actors for this frame. */
  observe: (actors: { address: number }[], now?: number) => void;
  /** True once the address has been continuously visible for `dwellMs`. */
  isStable: (address: number, now?: number) => boolean;
};

export function createDwellTracker(
  options: DwellTrackerOptions = {},
): DwellTracker {
  const dwellMs = options.dwellMs ?? 5000;
  const graceMs = options.graceMs ?? 1500;
  const pruneMs = options.pruneMs ?? 60000;

  const seen = new Map<number, { firstSeen: number; lastSeen: number }>();

  function observe(actors: { address: number }[], now = Date.now()): void {
    for (const actor of actors) {
      const entry = seen.get(actor.address);
      if (!entry) {
        seen.set(actor.address, { firstSeen: now, lastSeen: now });
      } else {
        // Vanished for longer than the grace window before qualifying: restart
        // the dwell timer so a blink can never accumulate toward the threshold.
        if (now - entry.lastSeen > graceMs) {
          entry.firstSeen = now;
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

  return { observe, isStable };
}
