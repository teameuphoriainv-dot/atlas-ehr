# Product Idea — ChartPilot (working name — rename freely)

## One-liner
A Copilot that lives inside the EHR for clinicians: doctors type or speak orders in plain English ("order a CBC and start metformin 500mg") and the agent drafts the structured, coded orders for one-click confirmation — HIPAA-safe and built on FHIR so it works with any compliant EHR.

## Background
Built at a hackathon (theme: "build a tool for something") by a team with deep, demonstrated clinical-AI experience — including a prior EHR Copilot (Solace) that already solves the hard parts: PHI isolation (the AI plans and narrates over coded metadata and never touches raw PHI, enforced by a leak test as a CI gate), HIPAA posture, clinical triage, ML risk scoring, and a Plan→Execute→Narrate agent loop. This is a focused, demoable slice of that capability: the unfair advantage is that the "HIPAA-compliant clinical AI" claim is real, not hand-waved.

## The problem
Clinicians spend more time fighting their EHR than talking to patients. Order entry — labs, imaging, meds — is a slow, click-heavy, menu-diving chore, and it's a top driver of physician burnout. Today doctors either click through dozens of nested menus per order or dictate to a human scribe. There's no fast, in-context "just tell it what you want" layer that turns intent into correctly structured, coded orders.

## Target user
A practicing physician (start with primary care / hospitalist) using a modern FHIR-capable EHR, who places multiple orders per patient encounter and is fluent in clinical shorthand but tired of the clicking.

## Proposed solution
A browser sidecar/overlay that "sits inside" the EHR and is aware of the open patient's context (read from FHIR). The clinician types or speaks an order in natural language; the agent interprets it against the patient's chart, drafts the corresponding structured FHIR orders (ServiceRequest / MedicationRequest), narrates what it's about to do, and asks for a single confirmation. On confirm, the orders write back to the EHR and appear in the chart.

**Magic moment:** Pick a (synthetic) patient → type *"order a CBC and a chest X-ray, and start metformin 500mg BID"* → the agent reads the chart, drafts three structured/coded orders with a plain-English summary → doctor clicks Confirm → the orders write back to the FHIR sandbox and appear in the patient's chart. Full loop, no real PHI touched.

## Why you
The team has already built a production-grade EHR Copilot with verified PHI isolation and a working agent loop — so the credibility-defining parts (HIPAA safety, clinical reasoning over a chart, structured execution) are backed by real prior work, not slideware.

## Candidates considered
The "candidates" were the four possible magic moments for the same EHR Copilot product. We chose **Natural-language orders** because it is the most visual on stage and maps most directly onto the existing Plan→Execute→Narrate loop.

| Magic moment | Unfair advantage | Pain level | Audience reach | MVP feasibility (hackathon) | Differentiation | Verdict |
|---|---|---|---|---|---|---|
| **Natural-language orders** (chosen) | 🟢 maps to existing agent loop | 🟢 order entry = core burnout source | 🟢 demo on FHIR sandbox | 🟢 cleanest, most visual loop | 🟢 "agent does the clicking" | ✅ Chosen |
| 30-second patient brief | 🟢 reuses triage + ML risk work | 🟢 high clinical value | 🟢 same sandbox | 🟢 feasible | 🟡 less novel | Strong #2 / possible 2nd beat |
| Ambient note-writer | 🟡 partial reuse | 🟢 huge | 🟢 | 🔴 speech adds real build risk | 🔴 crowded (Abridge/Nuance) | Cut for hackathon |
| Inbox / results triage | 🟢 reuses narration | 🟢 #1 inbox burnout | 🟡 | 🟡 | 🟡 hard to make visual | Cut for hackathon |

## Risky assumptions
1. **The agent can reliably map natural-language clinical intent to correctly coded FHIR orders** (right LOINC/RxNorm codes, right resource shapes) well enough to look trustworthy in a live demo. This is the core technical bet.
2. **A public FHIR sandbox (SMART Health IT / HAPI) with synthetic patients supports both reading patient context and writing orders back** smoothly enough for a live, on-stage round trip.
3. **The "sits inside the EHR" feel is convincingly delivered by a browser sidecar/overlay** without real SMART-on-FHIR OAuth — i.e. a mocked login + patient picker reads as authentic to judges.

## Hackathon scope decisions (locked)
- **Magic moment:** Natural-language orders → structured FHIR orders → one-click confirm → write-back.
- **Form factor:** Browser sidecar/overlay (NOT a native desktop app).
- **Data:** Public FHIR sandbox with synthetic patients. No real PHI, ever.
- **Interop claim:** "Any FHIR-compliant EHR." Build on FHIR; skip real Epic/Cerner vendor integration.
- **Auth:** Mocked SMART-on-FHIR login + patient picker for the demo; real SMART OAuth is a stated production next step.
- **PHI safety:** Carry forward the plan/narrate-over-metadata, never-touch-raw-PHI principle as the credibility story.

## Next step
Run `/plaid` to start the Plan intake. This product-idea.md will pre-fill much of the product vision — and given the hackathon clock, we'll move straight toward a buildable PRD + roadmap.
