import { createDwellTracker } from "./dwell-tracker";

describe("createDwellTracker first position", () => {
  it("returns the position at which an actor was first seen, not later ones", () => {
    const t = createDwellTracker({ dwellMs: 5000, graceMs: 1500 });
    t.observe([{ address: 1, x: 100, y: 200, z: 0 }], 0);
    // Same actor reported at a drifted position later (a wandering bug).
    t.observe([{ address: 1, x: 999, y: 888, z: 7 }], 1000);
    expect(t.getFirstPosition(1)).toEqual({ x: 100, y: 200, z: 0 });
  });

  it("returns undefined for an unknown address or when no position was given", () => {
    const t = createDwellTracker();
    expect(t.getFirstPosition(42)).toBeUndefined();
    t.observe([{ address: 1 }], 0); // no coords
    expect(t.getFirstPosition(1)).toBeUndefined();
  });

  it("re-anchors the first position when the actor resets past the grace window", () => {
    const t = createDwellTracker({ dwellMs: 5000, graceMs: 1500 });
    t.observe([{ address: 1, x: 100, y: 100, z: 0 }], 0);
    // Gone for >grace, reappears elsewhere: anchor moves to the new position.
    t.observe([{ address: 1, x: 500, y: 500, z: 0 }], 3000);
    expect(t.getFirstPosition(1)).toEqual({ x: 500, y: 500, z: 0 });
  });
});

describe("createDwellTracker", () => {
  it("is not stable before the dwell threshold elapses", () => {
    const t = createDwellTracker({ dwellMs: 5000, graceMs: 1500 });
    t.observe([{ address: 1 }], 0);
    expect(t.isStable(1, 0)).toBe(false);
    t.observe([{ address: 1 }], 4000);
    expect(t.isStable(1, 4000)).toBe(false);
  });

  it("becomes stable once continuously visible for the dwell threshold", () => {
    const t = createDwellTracker({ dwellMs: 5000, graceMs: 1500 });
    for (let now = 0; now <= 5000; now += 100) {
      t.observe([{ address: 1 }], now);
    }
    expect(t.isStable(1, 5000)).toBe(true);
  });

  it("returns false for an address that was never observed", () => {
    const t = createDwellTracker();
    expect(t.isStable(999, 0)).toBe(false);
  });

  it("resets the dwell timer when an actor blinks out beyond the grace window", () => {
    const t = createDwellTracker({ dwellMs: 5000, graceMs: 1500 });
    // Seen briefly (a blink) around t=0, then gone for ~2.5s (> grace).
    t.observe([{ address: 1 }], 0);
    t.observe([{ address: 1 }], 200);
    // Reappears at t=3000 and is now observed continuously: the dwell timer
    // restarts here, so it must earn another full 5s.
    for (let now = 3000; now <= 7000; now += 100) {
      t.observe([{ address: 1 }], now);
    }
    expect(t.isStable(1, 7000)).toBe(false); // only 4s since reappearing
    for (let now = 7000; now <= 8000; now += 100) {
      t.observe([{ address: 1 }], now);
    }
    expect(t.isStable(1, 8000)).toBe(true); // now 5s since reappearing
  });

  it("tolerates brief gaps within the grace window without resetting", () => {
    const t = createDwellTracker({ dwellMs: 5000, graceMs: 1500 });
    // Observe with 1.2s spacing — each gap is < grace, so the timer never
    // resets even though some frames are "missed".
    for (const now of [0, 1200, 2400, 3600, 4800, 5200]) {
      t.observe([{ address: 1 }], now);
    }
    expect(t.isStable(1, 5200)).toBe(true);
  });

  it("is no longer stable if the actor has disappeared past the grace window", () => {
    const t = createDwellTracker({ dwellMs: 5000, graceMs: 1500 });
    for (let now = 0; now <= 5000; now += 100) {
      t.observe([{ address: 1 }], now);
    }
    expect(t.isStable(1, 5000)).toBe(true);
    // No observation; 2s later (> grace) it is treated as gone.
    expect(t.isStable(1, 7000)).toBe(false);
  });

  it("prunes entries that have not been seen for longer than pruneMs", () => {
    const t = createDwellTracker({
      dwellMs: 5000,
      graceMs: 1500,
      pruneMs: 10000,
    });
    // Address 1 makes it to stable, then leaves entirely.
    for (let now = 0; now <= 5000; now += 100) {
      t.observe([{ address: 1 }], now);
    }
    expect(t.isStable(1, 5000)).toBe(true);
    // A much later frame without address 1 (past pruneMs) evicts its entry,
    // so re-observing it starts the dwell timer from scratch rather than
    // immediately reporting it as stable from the stale firstSeen.
    t.observe([{ address: 2 }], 20000);
    for (let now = 20000; now <= 23000; now += 100) {
      t.observe([{ address: 1 }], now);
    }
    expect(t.isStable(1, 23000)).toBe(false); // only 3s since reappearing
    for (let now = 23000; now <= 25000; now += 100) {
      t.observe([{ address: 1 }], now);
    }
    expect(t.isStable(1, 25000)).toBe(true); // now 5s since reappearing
  });
});
