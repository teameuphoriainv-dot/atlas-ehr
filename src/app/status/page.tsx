"use client";

import { useEffect, useState } from "react";
import { Play, CheckCircle2, XCircle, Loader2, Upload } from "lucide-react";

interface Result {
  status: number | null;
  ms: number | null;
  body: string;
  ok: boolean;
  running: boolean;
}

const empty: Result = { status: null, ms: null, body: "", ok: false, running: false };

async function call(method: string, path: string, body?: unknown): Promise<Result> {
  const t0 = performance.now();
  try {
    const r = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await r.text();
    let pretty = text;
    try {
      pretty = JSON.stringify(JSON.parse(text), null, 2);
    } catch {}
    return {
      status: r.status,
      ms: Math.round(performance.now() - t0),
      body: pretty.slice(0, 1400),
      ok: r.ok,
      running: false,
    };
  } catch (e) {
    return { status: 0, ms: Math.round(performance.now() - t0), body: String(e), ok: false, running: false };
  }
}

interface Endpoint {
  key: string;
  method: string;
  path: string;
  desc: string;
  body?: unknown;
  auto?: boolean;
}

const ENDPOINTS: Endpoint[] = [
  { key: "patients", method: "GET", path: "/api/patients", desc: "List patients from the FHIR layer", auto: true },
  { key: "patient", method: "GET", path: "/api/patient?id=mock-demo-1", desc: "Read a patient's coded chart", auto: true },
  {
    key: "agent",
    method: "POST",
    path: "/api/agent",
    desc: "Agent: searches FHIR, reasons, proposes (confirm-gated) writes",
    body: { patientId: "mock-demo-1", message: "Summarize this patient in 2 lines." },
    auto: true,
  },
  {
    key: "execute",
    method: "POST",
    path: "/api/agent/execute",
    desc: "Execute a confirmed write (add a problem)",
    body: {
      patientId: "mock-demo-1",
      actions: [
        {
          resourceType: "Condition",
          summary: "Add essential hypertension",
          resource: {
            clinicalStatus: { coding: [{ code: "active" }] },
            code: { coding: [{ system: "http://snomed.info/sct", code: "59621000", display: "Essential hypertension" }], text: "Essential hypertension" },
          },
        },
      ],
    },
  },
];

function StatusPill({ r }: { r: Result }) {
  if (r.running) return <span className="flex items-center gap-1 text-xs text-text-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> running…</span>;
  if (r.status === null) return <span className="text-xs text-text-muted">idle</span>;
  const good = r.ok;
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${good ? "text-success" : "text-error"}`}>
      {good ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {r.status} · {r.ms}ms
    </span>
  );
}

export default function StatusPage() {
  const [results, setResults] = useState<Record<string, Result>>({});
  const [visionResult, setVisionResult] = useState<Result>(empty);

  const run = async (e: Endpoint) => {
    setResults((s) => ({ ...s, [e.key]: { ...empty, running: true } }));
    const r = await call(e.method, e.path, e.body);
    setResults((s) => ({ ...s, [e.key]: r }));
  };

  useEffect(() => {
    ENDPOINTS.filter((e) => e.auto).forEach((e, i) => setTimeout(() => run(e), i * 400));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onImage = async (file: File) => {
    setVisionResult({ ...empty, running: true });
    const reader = new FileReader();
    reader.onload = async () => {
      const r = await call("POST", "/api/vision", { image: String(reader.result) });
      setVisionResult(r);
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-2xl font-bold text-primary">Atlas API</span>
          <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">live</span>
        </div>
        <p className="text-sm text-text-muted">
          Every Atlas endpoint, firing live against this deployment. Agentic FHIR tool-loop, confirm-gated writes, and Azure Document Intelligence OCR.
        </p>
        <button
          onClick={() => ENDPOINTS.forEach((e, i) => setTimeout(() => run(e), i * 300))}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-surface hover:bg-primary-hover"
        >
          <Play className="h-4 w-4" /> Run all
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {ENDPOINTS.map((e) => {
          const r = results[e.key] ?? empty;
          return (
            <div key={e.key} className="rounded-lg border border-border bg-surface p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary-subtle px-2 py-0.5 font-mono text-xs font-semibold text-primary">{e.method}</span>
                  <span className="font-mono text-sm text-text">{e.path}</span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill r={r} />
                  <button onClick={() => run(e)} className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text hover:border-primary hover:text-primary">
                    Run
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-xs text-text-muted">{e.desc}</p>
              {r.body && (
                <pre className="mt-3 max-h-56 overflow-auto rounded-md bg-surface-alt p-3 font-mono text-xs text-text">{r.body}</pre>
              )}
            </div>
          );
        })}

        {/* Vision / OCR card with image upload */}
        <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="rounded bg-primary-subtle px-2 py-0.5 font-mono text-xs font-semibold text-primary">POST</span>
              <span className="font-mono text-sm text-text">/api/vision</span>
            </div>
            <div className="flex items-center gap-3">
              <StatusPill r={visionResult} />
              <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text hover:border-primary hover:text-primary">
                <Upload className="h-3.5 w-3.5" /> Upload image
                <input type="file" accept="image/*" className="hidden" onChange={(ev) => ev.target.files?.[0] && onImage(ev.target.files[0])} />
              </label>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-text-muted">Azure Document Intelligence OCR — upload a screenshot of an EHR screen to extract its text.</p>
          {visionResult.body && (
            <pre className="mt-3 max-h-56 overflow-auto rounded-md bg-surface-alt p-3 font-mono text-xs text-text">{visionResult.body}</pre>
          )}
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-text-muted">Atlas — agentic EHR copilot · SMART-on-FHIR · Azure DI OCR</p>
    </main>
  );
}
