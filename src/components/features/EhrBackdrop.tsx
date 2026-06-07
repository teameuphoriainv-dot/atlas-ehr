"use client";

import { useEffect, useRef, useState } from "react";
import type { CodedItem, PatientContext } from "@/lib/types";

/**
 * A third-party EHR interface skin, rendered from LIVE FHIR data. New items (orders,
 * problems) the agent writes slide in and flash so the change is visible on screen.
 * Generic clinical slate/blue so Atlas (teal) reads as the copilot on top.
 */
interface Props {
  context: PatientContext | null;
  onContextChange?: (ctx: PatientContext) => void;
}

function ChartCard({
  title,
  items,
  empty,
  newKeys,
}: {
  title: string;
  items: CodedItem[];
  empty: string;
  newKeys?: Set<string>;
}) {
  return (
    <div className="rounded border border-slate-200 bg-white transition-shadow hover:shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <div className="p-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">{empty}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {items.map((it, i) => (
              <li
                key={`${it.code}-${i}`}
                className={`flex items-baseline justify-between gap-2 px-1 ${newKeys?.has(it.code) ? "atlas-new" : ""}`}
              >
                <span className="text-sm text-slate-700">{it.display}</span>
                <span className="font-mono text-[11px] text-slate-400">{it.code}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** A tiny deterministic trend sparkline from a numeric value (demo visual). */
function Sparkline({ value }: { value: string }) {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return null;
  const factors = [0.85, 0.9, 0.93, 0.97, 0.99, 1];
  const pts = factors.map((f, i) => n * f * (1 + (i % 2 ? -0.012 : 0.012)));
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const w = 52;
  const h = 16;
  const d = pts
    .map((p, i) => `${((i / (pts.length - 1)) * w).toFixed(1)},${(h - ((p - min) / range) * h).toFixed(1)}`)
    .join(" ");
  const up = pts[pts.length - 1] >= pts[0];
  return (
    <svg width={w} height={h} className={up ? "text-rose-400" : "text-emerald-500"} aria-hidden>
      <polyline points={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function EhrBackdrop({ context, onContextChange }: Props) {
  const editVital = (idx: number, value: string) => {
    if (!context || !onContextChange) return;
    const vitals = context.vitals.map((v, i) => (i === idx ? { ...v, value } : v));
    onContextChange({ ...context, vitals });
  };
  const seenOrders = useRef<Set<string> | null>(null);
  const seenProblems = useRef<Set<string> | null>(null);
  const [newOrders, setNewOrders] = useState<Set<string>>(new Set());
  const [newProblems, setNewProblems] = useState<Set<string>>(new Set());

  // Detect items added since the last context (refs read in the effect only).
  useEffect(() => {
    const orderIds = (context?.orders ?? []).map((o) => o.id);
    const problemCodes = (context?.problems ?? []).map((p) => p.code);
    if (seenOrders.current !== null) {
      const fo = new Set(orderIds.filter((id) => !seenOrders.current!.has(id)));
      const fp = new Set(problemCodes.filter((c) => !seenProblems.current!.has(c)));
      if (fo.size) setNewOrders(fo);
      if (fp.size) setNewProblems(fp);
    }
    seenOrders.current = new Set(orderIds);
    seenProblems.current = new Set(problemCodes);
  }, [context]);

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <div className="flex items-center justify-between bg-slate-800 px-4 py-2 text-slate-100">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded bg-blue-500 text-xs font-bold">M</span>
          <span className="font-semibold">Meridian Health</span>
          <span className="text-xs text-slate-400">EpicCare · Inpatient</span>
          <span className="ml-1 rounded bg-amber-400/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-900">
            Demo · synthetic data
          </span>
        </div>
        <nav className="hidden gap-5 text-sm text-slate-300 md:flex">
          {["Chart Review", "Orders", "Notes", "Results", "MAR"].map((t, i) => (
            <span key={t} className={i === 0 ? "text-white" : ""}>{t}</span>
          ))}
        </nav>
        <span className="text-xs text-slate-400">Dr. A. Patel</span>
      </div>

      <div className="flex items-center gap-6 border-b border-slate-300 bg-blue-50 px-4 py-2">
        <div>
          <div className="text-sm font-bold text-slate-800">{context?.displayName ?? "—"}</div>
          <div className="text-xs text-slate-500">
            MRN {context ? `00${context.id}`.slice(-8) : "—"} ·{" "}
            {[context?.sex, context?.ageBand && `${context.ageBand} yrs`].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
        <div className="hidden gap-6 text-xs text-slate-500 md:flex">
          <span><span className="font-semibold text-slate-700">{context?.problems.length ?? 0}</span> problems</span>
          <span><span className="font-semibold text-slate-700">{context?.medications.length ?? 0}</span> meds</span>
          <span><span className="font-semibold text-rose-600">{context?.allergies.length ?? 0}</span> allergies</span>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-3 overflow-auto p-4 lg:grid-cols-3">
        <ChartCard title="Problem List" items={context?.problems ?? []} empty="No active problems" newKeys={newProblems} />
        <ChartCard title="Medications" items={context?.medications ?? []} empty="No active medications" />
        <ChartCard title="Allergies" items={context?.allergies ?? []} empty="NKDA" />

        <div className="lg:col-span-3">
          <div className="rounded border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Vitals
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-3 sm:grid-cols-4 lg:grid-cols-8">
              {(context?.vitals ?? []).length === 0 ? (
                <p className="text-sm text-slate-400">No vitals recorded</p>
              ) : (
                context!.vitals.map((v, i) => (
                  <div key={`${v.label}-${i}`} className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wide text-slate-400">{v.label}</span>
                    <input
                      value={v.value}
                      onChange={(e) => editVital(i, e.target.value)}
                      className="w-full rounded border border-transparent bg-transparent text-sm font-semibold text-slate-700 hover:border-slate-200 focus:border-blue-400 focus:bg-white focus:outline-none"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="rounded border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Labs / Results
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-3 sm:grid-cols-4 lg:grid-cols-8">
              {(context?.labs ?? []).length === 0 ? (
                <p className="text-sm text-slate-400">No lab results</p>
              ) : (
                context!.labs.map((l, i) => (
                  <div key={`${l.label}-${i}`} className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wide text-slate-400">{l.label}</span>
                    <span className="text-sm font-semibold text-slate-700">{l.value}</span>
                    <Sparkline value={l.value} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="rounded border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Orders
            </div>
            <div className="p-3">
              {!context || context.orders.length === 0 ? (
                <p className="text-sm text-slate-400">No active orders</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {context.orders.map((o) => (
                    <li
                      key={o.id}
                      className={`flex items-center justify-between gap-2 px-1 ${newOrders.has(o.id) ? "atlas-new" : ""}`}
                    >
                      <span className="text-sm text-slate-700">{o.display}</span>
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[11px] font-medium text-blue-700">
                        {o.resourceType.replace("Request", "")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {context?.notes && context.notes.length > 0 && (
          <div className="lg:col-span-3">
            <div className="rounded border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Notes
              </div>
              <div className="flex flex-col divide-y divide-slate-100">
                {context.notes.map((n, i) => (
                  <div key={i} className={`p-3 ${i === 0 ? "atlas-new" : ""}`}>
                    <div className="text-xs font-semibold text-slate-600">
                      {n.title} · Atlas
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                      {n.text.slice(0, 700)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
