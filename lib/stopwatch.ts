// lib/stopwatch.ts
// Simple in-memory stopwatch with subscription API. Pure JS — safe for Expo Go.

type Subscriber = (ms: number, running: boolean) => void;

// Company stopwatch: stop automatically at 7 minutes
const MAX_MS = 7 * 60 * 1000;

let baseElapsed = 0; // ms accumulated while paused
let startAt: number | null = null; // epoch ms when running started
let running = false;
let interval: any = null;
const subs = new Set<Subscriber>();

function getElapsed() {
  return baseElapsed + (running && startAt ? Date.now() - startAt : 0);
}

function stopAtLimitIfNeeded(ms: number) {
  if (MAX_MS && ms >= MAX_MS) {
    baseElapsed = MAX_MS;
    startAt = null;
    running = false;
    if (interval) { clearInterval(interval); interval = null; }
    return true;
  }
  return false;
}

function notify() {
  let ms = getElapsed();
  // enforce limit
  if (stopAtLimitIfNeeded(ms)) {
    ms = MAX_MS;
    for (const s of subs) s(ms, false);
    return;
  }
  for (const s of subs) s(ms, running);
}

export function start() {
  if (running) return;
  // if already reached limit, don't start
  if (baseElapsed >= MAX_MS) return;
  startAt = Date.now();
  running = true;
  // tick
  interval = setInterval(notify, 200);
  notify();
}

export function pause() {
  if (!running) return;
  if (startAt) baseElapsed += Date.now() - startAt;
  startAt = null;
  running = false;
  if (interval) { clearInterval(interval); interval = null; }
  // clamp
  if (baseElapsed >= MAX_MS) baseElapsed = MAX_MS;
  notify();
}

export function reset() {
  baseElapsed = 0;
  startAt = null;
  running = false;
  if (interval) { clearInterval(interval); interval = null; }
  notify();
}

export function subscribe(cb: Subscriber) {
  subs.add(cb);
  // immediately emit current value (clamped)
  const ms = Math.min(getElapsed(), MAX_MS);
  cb(ms, running && ms < MAX_MS);
  return () => { subs.delete(cb); };
}

export function get() { return Math.min(getElapsed(), MAX_MS); }

export default { start, pause, reset, subscribe, get };
