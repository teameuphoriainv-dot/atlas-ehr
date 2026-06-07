# Atlas — EHR Copilot

> Say the order. Atlas places it — after you confirm.

Atlas is a browser sidecar that sits inside an EHR and turns a clinician's plain-English
intent into structured, correctly-coded FHIR orders. It reads the patient's chart, drafts
orders (labs, imaging, meds) with the right codes, narrates what it's about to do, and
writes them back **only after a one-click confirm**. The AI reasons over coded metadata and
**never receives raw PHI**.

Built at a hackathon with PLAID. Planning docs live in [`docs/`](docs/).

## The magic moment
Pick a patient → type *"order a CBC and a chest X-ray, and start metformin 500mg BID"* →
Atlas drafts three coded FHIR orders → confirm once → they write back and appear in the chart.

## Stack
- **Next.js 16** (App Router) + **Tailwind v4** (`@theme` design tokens)
- **Claude** via the Anthropic API (server-side, tool-use for structured drafts)
- **FHIR R4** against the public **HAPI** sandbox (synthetic patients, no real PHI)
- Next.js API routes only — no database (in-memory audit log); mocked SMART-on-FHIR login

## Setup
```bash
npm install
cp .env.example .env.local   # then fill in ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

### Environment (`.env.local`)
| Var | Purpose |
|-----|---------|
| `ANTHROPIC_API_KEY` | Required for drafting (server-side only) |
| `ANTHROPIC_MODEL` | Defaults to `claude-sonnet-4-6` |
| `FHIR_BASE_URL` | Defaults to `https://hapi.fhir.org/baseR4` |
| `DEMO_PATIENT_ID` | Pinned demo patient (default `123836453`, Michael Kihn) |
| `NEXT_PUBLIC_USE_MOCK_FHIR` | `true` → use the local mock FHIR server (demo-safe fallback) |

## Scripts
```bash
npm run dev      # dev server
npm run build    # production build + typecheck
npm run lint     # eslint
npm test         # vitest (incl. the PHI-isolation test)

# Live agent success-rate check (hits the API):
ANTHROPIC_API_KEY=sk-ant-... npx vitest run draftOrders
```

## Safety model
- **Confirm-before-write** — nothing reaches the chart without an explicit click.
- **PHI isolation** — only coded context (codes, banded age) is sent to the model; names/MRN/DOB
  stay server-side. Enforced by `src/lib/phi/isolate.test.ts`.
- **No guessed doses** — ambiguous medication orders become clarifying questions.

## Demo
See [`docs/demo-script.md`](docs/demo-script.md) for the rehearsed 2-minute walkthrough,
including the mock-FHIR fallback if the public sandbox is flaky.
