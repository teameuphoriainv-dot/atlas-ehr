"use client";

/**
 * Client-side telemetry bus for the Live System Console.
 *
 * Atlas does its real work behind the APIs (FHIR reads/writes, agent reasoning,
 * OCR). This bus surfaces that activity so a demo viewer can SEE the system work:
 *  - a global `fetch` interceptor logs every /api/* call (method, path, latency)
 *  - the agent backend returns a structured `events` trace that we replay here
 *
 * Nothing here is fabricated — labels, durations and token counts are the real
 * values produced by the request; backend events are only *staggered* on arrival
 * so the cascade is legible to the human eye.
 */

export type TelemetryKind =
  | "http" // a raw HTTP call to one of our API routes
  | "fhir" // a FHIR read/search executed server-side by the agent
  | "reason" // a model reasoning round
  | "propose" // the agent proposed a write (pending confirmation)
  | "write" // a confirmed write committed to the chart
  | "info"; // a summary / annotation line

export type TelemetryStatus = "ok" | "error" | "pending";

export interface TelemetryEvent {
  id: number;
  at: number; // epoch ms
  kind: TelemetryKind;
  method?: string; // HTTP verb for http/write rows
  label: string; // primary text, e.g. "Patient/123", "reasoning round 1"
  detail?: string; // secondary text, e.g. a query string
  ms?: number; // duration in ms
  status?: TelemetryStatus;
}

/** Shape the agent backend returns for each step (no id/timestamp — added here). */
export interface BackendEvent {
  kind: TelemetryKind;
  method?: string;
  label: string;
  detail?: string;
  ms?: number;
  status?: TelemetryStatus;
}

type Listener = (events: TelemetryEvent[]) => void;

const MAX_EVENTS = 240;
let events: TelemetryEvent[] = [];
let seq = 0;
const listeners = new Set<Listener>();

function notify() {
  for (const l of listeners) l(events);
}

/** Push a new event onto the feed and return it (so callers can update it later). */
export function emit(input: BackendEvent & { at?: number }): TelemetryEvent {
  const { at, ...rest } = input;
  const ev: TelemetryEvent = { id: ++seq, at: at ?? Date.now(), ...rest };
  events = [...events, ev].slice(-MAX_EVENTS);
  notify();
  return ev;
}

/** Patch an existing event in place (used to resolve a pending HTTP row). */
export function update(id: number, patch: Partial<TelemetryEvent>) {
  let changed = false;
  events = events.map((e) => {
    if (e.id !== id) return e;
    changed = true;
    return { ...e, ...patch };
  });
  if (changed) notify();
}

/** Replay server-side agent events with a small stagger so they read live. */
export function streamBackendEvents(evs: BackendEvent[], gapMs = 100) {
  if (typeof window === "undefined") return;
  evs.forEach((e, i) => {
    window.setTimeout(() => emit(e), i * gapMs);
  });
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  fn(events);
  return () => {
    listeners.delete(fn);
  };
}

export function clearTelemetry() {
  events = [];
  notify();
}

export function getTelemetry(): TelemetryEvent[] {
  return events;
}

/** Turn a full URL into a short label, e.g. "/api/agent/execute" -> "agent/execute". */
function shortPath(url: string): string {
  try {
    const u = new URL(url, window.location.origin);
    return u.pathname.replace(/^\/+api\/+/, "");
  } catch {
    return url;
  }
}

let installed = false;

/** Monkeypatch window.fetch once to log every API call to the bus. Idempotent. */
export function installTelemetry() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const orig = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    if (!url.includes("/api/")) return orig(input, init);

    const method = (init?.method ?? "GET").toUpperCase();
    const start = Date.now();
    const pending = emit({ kind: "http", method, label: shortPath(url), status: "pending" });
    try {
      const res = await orig(input, init);
      update(pending.id, { ms: Date.now() - start, status: res.ok ? "ok" : "error" });
      return res;
    } catch (err) {
      update(pending.id, { ms: Date.now() - start, status: "error" });
      throw err;
    }
  };
}

// Install as early as the module is imported in the browser, before component
// effects fire — so the very first patient/list fetches are captured too.
if (typeof window !== "undefined") installTelemetry();
