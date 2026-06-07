"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, ChevronDown, Radio, Trash2, Terminal } from "lucide-react";
import {
  subscribe,
  clearTelemetry,
  type TelemetryEvent,
  type TelemetryKind,
} from "@/lib/telemetry";

/**
 * Live System Console — a streaming, dev-tools-style overlay that makes Atlas's
 * behind-the-API work visible during a demo: every FHIR read/write, every model
 * reasoning round, every proposed and committed change, with real latencies.
 */

const KIND_STYLE: Record<TelemetryKind, { tag: string; cls: string }> = {
  http: { tag: "HTTP", cls: "text-sky-300" },
  fhir: { tag: "FHIR", cls: "text-emerald-300" },
  reason: { tag: "THINK", cls: "text-violet-300" },
  propose: { tag: "PROPOSE", cls: "text-amber-300" },
  write: { tag: "WRITE", cls: "text-emerald-200" },
  info: { tag: "INFO", cls: "text-slate-400" },
};

function clock(at: number): string {
  const d = new Date(at);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function Row({ e }: { e: TelemetryEvent }) {
  const k = KIND_STYLE[e.kind];
  const dur =
    e.status === "pending" ? "···" : e.ms != null ? `${e.ms}ms` : "";
  const durCls =
    e.status === "error"
      ? "text-rose-400"
      : e.status === "pending"
        ? "text-slate-500 animate-pulse"
        : "text-slate-500";
  return (
    <div className="atlas-fade-in flex items-baseline gap-2 px-3 py-[3px] leading-snug hover:bg-white/5">
      <span className="shrink-0 tabular-nums text-slate-600">{clock(e.at)}</span>
      <span className={`shrink-0 w-[58px] font-semibold ${k.cls}`}>
        {e.method && (e.kind === "http" || e.kind === "write")
          ? e.method
          : k.tag}
      </span>
      <span className="min-w-0 flex-1 truncate text-slate-200">
        {e.label}
        {e.detail && <span className="text-slate-500"> · {e.detail}</span>}
      </span>
      <span className={`shrink-0 tabular-nums ${durCls}`}>
        {e.status === "ok" || e.status === "error" ? (
          <span className={e.status === "error" ? "text-rose-400" : "text-emerald-500"}>
            {e.status === "error" ? "✕ " : "✓ "}
          </span>
        ) : null}
        {dur}
      </span>
    </div>
  );
}

export function LiveConsole() {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [open, setOpen] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  useEffect(() => subscribe(setEvents), []);

  // Auto-scroll to the newest row unless the user has scrolled up to read history.
  useEffect(() => {
    const el = feedRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [events, open]);

  function onScroll() {
    const el = feedRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  }

  const calls = events.filter((e) => e.kind === "http").length;
  const rounds = events.filter((e) => e.kind === "reason").length;
  const writes = events.filter((e) => e.kind === "write").length;
  const live = events.some((e) => e.status === "pending");

  return (
    <div
      className="fixed bottom-4 left-4 z-40 w-[400px] max-w-[92vw] overflow-hidden rounded-xl border border-emerald-500/20 bg-[#0c1416] font-mono text-[11px] shadow-2xl ring-1 ring-black/40"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {/* Title bar */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 border-b border-white/10 bg-[#0a1012] px-3 py-2 text-left"
      >
        <Terminal className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
        <span className="font-semibold tracking-wide text-slate-200">
          ATLAS · LIVE SYSTEM
        </span>
        <span className="flex items-center gap-1 text-[10px] text-emerald-400">
          <Radio
            className={`h-3 w-3 ${live ? "animate-pulse text-emerald-400" : "text-slate-600"}`}
            aria-hidden
          />
          {live ? "live" : "idle"}
        </span>
        <span className="ml-auto flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3" aria-hidden /> {events.length}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${open ? "" : "-rotate-90"}`}
            aria-hidden
          />
        </span>
      </button>

      {open && (
        <>
          <div
            ref={feedRef}
            onScroll={onScroll}
            className="h-[230px] overflow-y-auto py-1"
          >
            {events.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center text-slate-600">
                <Activity className="h-4 w-4" aria-hidden />
                <p>Waiting for activity…</p>
                <p className="text-slate-700">
                  Ask Atlas something — every FHIR call, reasoning round, and
                  write appears here in real time.
                </p>
              </div>
            ) : (
              events.map((e) => <Row key={e.id} e={e} />)
            )}
          </div>

          {/* Footer summary */}
          <div className="flex items-center gap-3 border-t border-white/10 bg-[#0a1012] px-3 py-1.5 text-[10px] text-slate-500">
            <span>
              <span className="text-sky-300">{calls}</span> calls
            </span>
            <span>
              <span className="text-violet-300">{rounds}</span> rounds
            </span>
            <span>
              <span className="text-emerald-300">{writes}</span> writes
            </span>
            <button
              type="button"
              onClick={(ev) => {
                ev.stopPropagation();
                clearTelemetry();
              }}
              className="ml-auto flex items-center gap-1 text-slate-500 transition-colors hover:text-rose-400"
            >
              <Trash2 className="h-3 w-3" aria-hidden /> clear
            </button>
          </div>
        </>
      )}
    </div>
  );
}
