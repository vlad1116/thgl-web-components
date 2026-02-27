export type AudioAlertSound = "chime" | "ping" | "beacon" | "soft";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function playSound(ctx: AudioContext, sound: AudioAlertSound, volume: number) {
  switch (sound) {
    case "chime":
      playChime(ctx, volume);
      break;
    case "ping":
      playPing(ctx, volume);
      break;
    case "beacon":
      playBeacon(ctx, volume);
      break;
    case "soft":
      playSoft(ctx, volume);
      break;
  }
}

export function playAlertSound(
  sound: AudioAlertSound,
  volume: number = 0.5,
): void {
  try {
    const ctx = getAudioContext();

    if (ctx.state === "suspended") {
      // Wait for the context to actually resume before scheduling oscillators,
      // otherwise the sound is lost because nodes are scheduled on a paused clock.
      ctx.resume().then(() => playSound(ctx, sound, volume));
    } else {
      playSound(ctx, sound, volume);
    }
  } catch {
    // Audio not supported
  }
}

// Two-tone chime (original sound)
function playChime(ctx: AudioContext, volume: number): void {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
  oscillator.frequency.setValueAtTime(1108.73, ctx.currentTime + 0.1); // C#6

  gainNode.gain.setValueAtTime(volume * 0.6, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.3);
}

// Simple ping sound
function playPing(ctx: AudioContext, volume: number): void {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);

  gainNode.gain.setValueAtTime(volume * 0.5, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.15);
}

// Beacon sound (repeating pulse)
function playBeacon(ctx: AudioContext, volume: number): void {
  for (let i = 0; i < 2; i++) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = "sine";
    const startTime = ctx.currentTime + i * 0.12;
    oscillator.frequency.setValueAtTime(1000, startTime);

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.5, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.1);
  }
}

// Soft notification (gentle tone)
function playSoft(ctx: AudioContext, volume: number): void {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
  oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5

  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume * 0.4, ctx.currentTime + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.4);
}

export const ALERT_SOUND_OPTIONS: {
  value: AudioAlertSound;
  label: string;
}[] = [
  { value: "chime", label: "Chime" },
  { value: "ping", label: "Ping" },
  { value: "beacon", label: "Beacon" },
  { value: "soft", label: "Soft" },
];
