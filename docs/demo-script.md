# Atlas — Demo Script

A tight, rehearsed walkthrough for judges. Total run time: ~2 minutes.

## Setup (before you present)
- `npm run dev` running, browser at `http://localhost:3000`.
- `ANTHROPIC_API_KEY` set in `.env.local`.
- Demo patient pinned: **Michael Kihn** (`DEMO_PATIENT_ID=123836453`) — 12 problems, 18 meds (incl. metformin + lisinopril), 2 allergies.
- Fallback ready: if HAPI is flaky, set `NEXT_PUBLIC_USE_MOCK_FHIR=true` and restart — the full loop runs on a local mock patient (Riley Demo), zero external dependency.

## The 30-second hook
> "Doctors spend more time fighting their EHR than talking to patients — and order entry is the worst of it: endless menu-diving, dozens of times a day. Atlas fixes that. You just say what you want."

## The walkthrough

1. **Open the workspace.** "This is Atlas sitting inside the EHR — patient chart on the left, the Atlas copilot on the right."

2. **Pick Michael Kihn.** The chart loads live from a FHIR server: problems, meds, allergies. "This is real FHIR data — Atlas reads the chart so it understands the patient."

3. **Type the order (or use the mic):**
   > `order a CBC and a chest X-ray, and start metformin 500mg BID`

4. **Watch it draft.** Atlas returns three correctly-coded orders — CBC (LOINC 58410-2), chest X-ray (LOINC 36643-5), metformin (RxNorm 860975) — with a plain-English summary.
   - **The wow line:** "Notice it flagged that he's *already* on metformin 1000mg and asked me to confirm the dose change — it reasoned over his chart. And it did that without the AI ever seeing his name, MRN, or date of birth."

5. **Confirm once.** The orders write back to the chart and appear in the Orders list. "One click. Seconds, not minutes."

6. **Show the safety (pick one):**
   - Type `start lisinopril` (no dose) → Atlas **asks** instead of guessing. "It will never invent a dose."
   - Mention the Activity log: every draft, confirm, and reject is recorded.

## The close
> "Atlas is built on FHIR, so it works with any compliant EHR. The AI plans and narrates over coded metadata and never touches raw PHI — that's enforced by a test in our CI. It's the first copilot that doesn't just document the visit — it acts on the chart, safely."

## Talking points if asked
- **"Is it touching patient data?"** — The model only sees coded context (codes, banded age). Names/MRN/DOB never leave the server. There's a passing test that fails the build if that ever changes.
- **"Does it work with Epic?"** — It speaks FHIR, the standard Epic/Cerner expose. The demo runs on a public FHIR sandbox; the login is a mocked SMART-on-FHIR launch — real SMART OAuth is the production step.
- **"What if it's wrong?"** — Nothing is written without an explicit confirm, and ambiguous orders become questions, not guesses.
