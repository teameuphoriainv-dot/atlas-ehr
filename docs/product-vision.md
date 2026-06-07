# Product Vision — Atlas

## 1. Vision & Mission

### Vision Statement
A world where clinicians spend their attention on patients, not on menus — where stating what you want is enough to make the EHR do it, safely.

### Mission Statement
Atlas turns a clinician's plain-English intent into structured, coded orders inside any FHIR-compliant EHR, with every action narrated and confirmed before it touches the chart.

### Founder's Why
This is being built by a team that has already lived the hard part. Their prior platform, Solace, shipped an EHR Copilot with verified PHI isolation — the AI plans and narrates over coded metadata and never handles raw PHI, with a leak test wired in as a CI gate. They've built clinical triage, ML risk scoring, and a working Plan-Execute-Narrate agent loop. So Atlas isn't a team learning clinical AI from scratch under hackathon pressure; it's a team taking the single most hated EHR chore — order entry — and aiming a proven agent pattern directly at it.

The "why now" is real: physician burnout is at crisis levels, and the EHR is consistently named the leading cause. Ambient scribe tools (Abridge, Nuance DAX) proved clinicians will trust AI in the room, but they stop at documentation. Nobody has made the EHR *act* on intent. Atlas does — and because it's built on FHIR rather than a single vendor's API, the "works with any EHR" claim is structurally true, not marketing.

The deeper motivation is trust as a design constraint. The team's instinct from Solace carries over: an AI near patient care must never auto-act, never touch raw PHI, and never hide what it's about to do. That discipline is the moat.

### Core Values
- **Narrate before you act.** Atlas always states, in plain clinical language, exactly what it is about to do before it does it. The clinician confirms with one click. No silent execution, ever — not even for "obvious" orders.
- **PHI never reaches the model.** The agent reasons over coded metadata and chart structure, not raw identifiers. This is enforced in code, not in a policy doc. If a change would route PHI to the LLM, it should fail a test.
- **Standards over integrations.** Build on FHIR resources, not vendor-specific shims. Every feature works against the standard so "any FHIR EHR" stays honest.
- **Seconds, not minutes.** The product exists to give clinicians time back. If a flow doesn't beat the EHR's native click path on speed, it isn't done.
- **Show your reasoning, not your confidence.** When Atlas is unsure (an ambiguous dose, a missing route), it says so and asks — it never guesses to look smart.

### Strategic Pillars
- **The magic moment comes first.** Natural-language order → confirmed coded order → write-back must work end-to-end before anything else is polished.
- **Demo on real FHIR, fake only the login.** Everything that matters (reading the chart, drafting coded orders, writing back) runs against a real FHIR server with synthetic data. Only the OAuth handshake is mocked, and we say so.
- **Clinician speed beats feature count.** One flawless action beats five mediocre ones. Resist scope creep toward "do everything."
- **Trust is the differentiator, so it's never traded for flash.** No auto-execute, no PHI to the model — even when it would make a slicker demo.

### Success Looks Like
Twelve months out, Atlas is a launchable SMART-on-FHIR app that a clinician can open inside a sandboxed EHR, speak an order set into, and watch land in the chart in seconds — with a documented average of several minutes saved per encounter across a small pilot cohort. It has expanded from orders into a second copilot action (the 30-second patient brief), maintains a clean PHI-isolation test suite as a public credibility artifact, and is being actively piloted by a handful of friendly clinicians who would be upset if it went away. The immediate, concrete success: a flawless hackathon demo that makes a judge lean forward and say "wait — it just wrote that back to the chart?"

-----

## 2. User Research

### Primary Persona
**Dr. Asha Patel, 38 — Hospitalist at a 400-bed regional hospital.** Asha rounds on 14–18 inpatients a day. She knows exactly what she wants clinically the moment she finishes examining a patient — a CBC, a chest X-ray, start metformin, hold the home lisinopril — but turning that intent into placed orders means diving through nested menus, order sets, and confirmation dialogs, one click at a time, dozens of times per shift. She's high tech-comfort (uses Epic fluently, dictates notes, has tried an ambient scribe) but EHR fatigue is the thing she complains about most over coffee. She currently absorbs the clicking as the cost of the job and stays late charting. She would switch to anything that lets her *say the order the way she'd say it to a resident* and trust it to land correctly — but she will abandon instantly anything that places an order she didn't explicitly approve, because her license is on the line.

### Secondary Personas
- **Dr. Marcus Lee, 45 — Primary care physician, outpatient.** Sees 20+ patients a day in 15-minute slots and batches orders at the end of each visit. Cares most about speed and not breaking flow mid-conversation. Would value voice input more than Asha.
- **Jordan Rivera, NP — Nurse practitioner with ordering privileges.** Faces identical EHR friction but is more likely to want guardrails and confirmation, given scope-of-practice scrutiny. A strong early adopter precisely because Atlas's "narrate and confirm" model fits cautious ordering.
- **Dr. Priya Shah — CMIO / clinical informatics lead.** Doesn't use Atlas to place orders; evaluates it for the health system. Cares about FHIR interoperability, the PHI-isolation story, audit logging, and measurable burnout reduction. The buyer, not the user.

### Jobs To Be Done
- **Functional:** "When I've decided on a plan for a patient, help me get the orders placed correctly and fast, without leaving my train of thought." "When I state an order, make sure the codes and structure are right so it doesn't get kicked back."
- **Emotional:** "I want to feel like the computer is keeping up with me, not fighting me." "I want to trust that nothing happens to my patient that I didn't approve."
- **Social:** "I want to look competent and in-control to my team — not someone fumbling through menus while the patient waits."

### Pain Points
1. **Menu-diving for routine orders (high severity, dozens of times/day).** The single biggest, most frequent friction. Clinicians know the order; the EHR makes placing it slow. Consequence: cumulative hours lost per week, late charting, burnout.
2. **Order errors from wrong codes/structure (medium severity, occasional, high consequence).** A mis-structured order gets rejected or, worse, misinterpreted. Today handled by careful double-checking, which costs more time.
3. **Context-switching cost (medium severity, constant).** Every order placed mid-thought breaks the clinician's reasoning flow. Hard to measure, deeply felt.
4. **Distrust of automation near patient care (the meta-pain).** Clinicians have been burned by alert fatigue and clumsy CDS. Any new tool starts in a deep trust hole. Real, and it shapes adoption more than any feature.

### Current Alternatives & Competitive Landscape
- **Native EHR order entry (Epic, Cerner):** Does it does comprehensively and is billing-complete, but it's slow, click-heavy, and optimized for the institution, not the clinician's speed. Switching cost is zero (it's already there), so Atlas must be *obviously* faster to earn the extra step.
- **Human scribes:** Fast and flexible, but expensive, don't scale, and add a person to every encounter. Atlas is the scalable version of "tell someone what you want."
- **Ambient AI scribes (Abridge, Nuance DAX, Suki):** Proven clinicians-trust-AI-in-the-room, well-funded, but they *draft notes* — they do not place orders. This is the key gap: documentation is solved, action is not. Atlas is adjacent, not competitive, and could even be complementary.
- **"Do nothing" / absorb the clicking:** The real default. The competitor isn't another product; it's inertia. Atlas must overcome "the EHR is just like this."

### Key Assumptions to Validate
1. **We assume the agent can map natural-language clinical intent to correctly coded FHIR orders reliably enough to be trusted.** This is the core technical bet. *To validate:* build the NL→FHIR mapping against a fixed set of ~20 common orders and measure correct-code rate. Target high-90s% on the demo set before trusting it live.
2. **We assume a public FHIR sandbox supports a smooth read-then-write round trip on stage.** *To validate:* end-to-end test against HAPI FHIR (read Patient/Condition/Medication, POST ServiceRequest/MedicationRequest) early in the build, not the night before.
3. **We assume a browser sidecar reads as "inside the EHR" without real SMART OAuth.** *To validate:* show the mocked-login + patient-picker flow to one clinician and ask "does this feel like it's part of the chart?"
4. **We assume clinicians want speed enough to add a tool alongside the EHR.** *To validate:* the "would you use this daily?" question to 3 clinicians after the demo.
5. **We assume confirmation-per-action is acceptable, not annoying, friction.** Risk: clinicians find one-click-per-order-set too slow. *To validate:* test single-confirm-for-a-batch vs per-order.
6. **We assume "any FHIR EHR" is a meaningful buyer claim despite zero real Epic integration.** *To validate:* the CMIO reaction — does the FHIR story land, or do they only care about Epic specifically?
7. **We assume PHI-isolation is a decisive trust factor, not table stakes nobody asks about.** *To validate:* see whether judges/clinicians react to the "PHI never reaches the model" point.

### User Journey Map
- **Awareness:** Asha sees Atlas at the hackathon demo (or later, via an informatics community / a colleague). Reaction: skeptical interest — "another AI tool."
- **Consideration:** She watches the order-entry demo. The hook is speed plus the visible confirm step. Friction: "is this safe? does it touch real data?" — answered immediately by the narrate-and-confirm flow and the PHI-isolation claim.
- **First use:** She picks a (synthetic) patient and types an order set the way she'd say it. Slight nervousness.
- **Magic moment:** Atlas drafts three correctly coded orders with a plain-English summary; she clicks Confirm; they appear in the chart. Emotion: surprise, then relief. "It just *did* that, and I controlled it."
- **Habit formation:** She uses it for routine order sets first, expands as trust grows. The confirm step is what lets trust build safely.
- **Advocacy:** She tells a colleague "you have to see this," and flags it to her CMIO. The PHI story is what makes her comfortable advocating internally.

-----

## 3. Product Strategy

### Product Principles
- **Intent in, confirmation out.** The whole interaction model is: clinician states intent → Atlas drafts + narrates → clinician confirms → Atlas executes. Every feature fits this loop.
- **The chart is read context, never model input.** Atlas reads the chart to ground its suggestions but routes only coded metadata to the LLM. Raw PHI stays server-side.
- **Coded-correctness is a feature, not an afterthought.** Drafting an order means producing valid, correctly-coded FHIR — LOINC for labs, RxNorm for meds — not free text.
- **Fail loud, fail safe.** Ambiguity (missing dose, unclear route) triggers a question, never a guess. A refused order is a success, not a failure.
- **Speed is sacred.** The flow must visibly beat native click-paths. Latency in the draft step is the enemy.

### Market Differentiation
Native EHR order entry is comprehensive but slow; ambient scribes are fast but only document. Atlas occupies the empty quadrant: **fast AND acts on the chart.** It turns intent into confirmable, coded orders and writes them back — the step every other tool stops short of. Because it's built on FHIR, it isn't tied to one vendor's roadmap or approval process; "works with any FHIR EHR" is a structural property, not a sales promise. And its trust model — narrate-before-act, PHI-never-to-model, enforced in code — directly answers the objection that kills most clinical AI ("is this safe near my patients?"). The differentiation matters because the target user's deepest barrier isn't capability, it's trust; Atlas is designed so the trust-building mechanism (visible confirmation) is the same mechanism that makes it usable.

### Magic Moment Design
**The moment:** clinician picks a patient, types *"order a CBC and a chest X-ray, and start metformin 500mg BID,"* Atlas reads the chart and drafts three correctly coded orders with a plain-English summary, clinician clicks Confirm once, and the orders write back and appear in the chart — seconds after one sentence, with no real PHI touched.

**What must be true for it to fire reliably:**
- A patient must be selected and their chart readable from FHIR (so suggestions are grounded).
- The NL→FHIR mapping must produce valid, correctly-coded resources for the demo's order vocabulary.
- The narration must be accurate and instantly scannable (the clinician reads it in ~2 seconds before confirming).
- The write-back must succeed and be visibly reflected (re-fetch and show the new orders).

**Shortest path to the moment:** mocked login → patient picker (or pre-selected demo patient) → order input box → draft preview with confirm → write-back + chart refresh. That's the entire MVP. The magic moment IS the MVP — anything not on this path is out of scope for v1.

### MVP Definition — In Scope
- **FHIR patient context (read).** Connect to HAPI FHIR sandbox; load a selected synthetic patient's demographics, problems, active meds, allergies. *Done when:* selecting a patient shows a real chart summary pulled from FHIR.
- **Natural-language order input.** Text box (voice optional/stretch) where the clinician types an order or order set. *Done when:* free text is captured and sent to the agent.
- **NL→FHIR order drafting (the agent).** Claude (server-side) maps intent to structured FHIR `ServiceRequest`/`MedicationRequest` resources with correct codes, grounded in the patient's chart, routing only coded metadata to the model. *Done when:* a typed order set produces valid draft FHIR resources for the demo vocabulary.
- **Narrate + confirm UI.** Show each drafted order in plain English with codes visible on demand; one-click Confirm / Reject; ambiguity surfaces a clarifying question. *Done when:* the clinician can read what will happen and approve/decline before anything is written.
- **Order write-back.** On confirm, POST the resources to FHIR; re-fetch and show them in the chart. *Done when:* confirmed orders appear in the synthetic patient's chart, live.
- **PHI-isolation boundary.** Server-side proxy that strips/avoids raw PHI before any LLM call; a test asserting no raw identifiers leave to the model. *Done when:* the isolation test passes and is runnable.

### Explicitly Out of Scope
- **Real SMART-on-FHIR OAuth / real Epic-Cerner integration.** Tempting because it's the "real" version. Deferred because it costs days/months for zero demo payoff; mocked login conveys the same idea. *Reconsider:* immediately post-hackathon, for a real pilot.
- **Persistent database / real accounts.** Tempting for an audit trail. Deferred to in-memory log for the hackathon. *Reconsider:* when a pilot needs a real immutable audit store.
- **Voice input.** Tempting for wow-factor. Deferred because text proves the concept and speech adds real build risk. *Reconsider:* as a fast follow if text lands.
- **Note generation / ambient scribing.** Out of lane — that's the crowded space Atlas deliberately avoids. *Reconsider:* never as primary; possibly as an integration.
- **Order sets / templates, CDS alerts, drug-interaction checking.** Valuable but scope-expanding. Deferred. *Reconsider:* post-MVP, once the core loop is trusted.
- **Broad order vocabulary.** v1 handles a curated set of common labs/imaging/meds reliably rather than everything badly. *Reconsider:* expand after the demo set is rock-solid.

### Feature Priority (MoSCoW)
- **Must Have:** FHIR read context; NL order input; NL→FHIR drafting with correct codes; narrate + confirm; write-back; PHI-isolation boundary + test; one polished demo patient + order vocabulary.
- **Should Have:** Patient picker (vs hardcoded); codes-visible-on-demand UI; clarifying-question flow for ambiguous orders; in-memory audit log view; mocked login screen.
- **Could Have:** Voice input; batch-vs-per-order confirm toggle; the 30-second patient brief as a second action; basic drug-allergy sanity check using chart allergies.
- **Won't Have (this time):** Real OAuth; real EHR vendor integration; persistent DB; CDS/interaction engine; multi-user/orgs; billing.

### Core User Flows
1. **Place an order set (the magic-moment flow).** Trigger: clinician finishes assessing a patient. Steps: select patient → chart loads from FHIR → type "order CBC, chest X-ray, start metformin 500mg BID" → Atlas drafts 3 coded orders + plain-English summary → clinician reviews → clicks Confirm → orders POST to FHIR → chart refreshes showing new orders. Outcome: orders placed in seconds. Success: all 3 orders correctly coded and visible in chart; zero unconfirmed writes.
2. **Handle an ambiguous order.** Trigger: clinician types "start metformin" (no dose). Steps: Atlas detects missing dose → surfaces "What dose and frequency?" instead of drafting → clinician answers → Atlas drafts. Outcome: no guessed dose ever written. Success: ambiguous input never produces a silently-completed order.
3. **Reject a draft.** Trigger: Atlas drafts something the clinician didn't intend. Steps: draft preview shown → clinician clicks Reject (or edits) → nothing is written. Outcome: clinician stays in control. Success: rejected drafts never reach FHIR.

### Success Metrics
- **Primary metric:** End-to-end magic-moment success rate in the demo — % of natural-language order sets that produce correctly-coded, chart-visible orders after one confirm. *Good:* 90%. *Great:* 100% on the curated demo vocabulary.
- **Secondary metrics:** Time from sentence to confirmed write (target < 10s); NL→FHIR correct-code rate on the test set; zero unconfirmed writes (must be 0); zero raw-PHI-to-model events (must be 0).
- **Leading indicators (post-hackathon):** Number of clinicians who say "I'd use this daily"; CMIO interest in a pilot; per-encounter time-saved estimate.

### Risks
1. **NL→FHIR mapping is unreliable (likelihood: medium, impact: high).** Wrong codes kill trust and the demo. *Mitigation:* constrain v1 to a curated order vocabulary; build a test set; use structured output / tool-calling with a validation pass before showing a draft.
2. **FHIR sandbox flakiness or write rejection live (medium, high).** *Mitigation:* test the full round-trip early; have a local mock FHIR fallback ready; cache the demo patient.
3. **Latency makes the demo feel slow (medium, medium).** *Mitigation:* stream the narration; pre-warm the patient context; keep the model prompt tight.
4. **Trust objection ("it could place a wrong order") (high, high).** *Mitigation:* the confirm step IS the answer — lead the demo with it; show the reject and ambiguous-order flows explicitly.
5. **Scope creep toward "do everything" (high, medium).** *Mitigation:* the magic moment is the MVP; everything else is Could/Won't. Enforce ruthlessly given the clock.
6. **Judges read "mocked login" as "faked product" (medium, medium).** *Mitigation:* be explicit that everything real (chart read, coded drafting, write-back) runs on real FHIR; only OAuth is stubbed, and that's a known production step.
7. **PHI-isolation claim is hand-waved under time pressure (medium, high to credibility).** *Mitigation:* make the isolation boundary a real, testable code path — a passing test is the proof.

-----

## 4. Brand Strategy

### Positioning Statement
For clinicians who know exactly what they want but lose minutes fighting their EHR's order entry, Atlas is the in-chart copilot that turns plain-English intent into confirmed, correctly-coded orders. Unlike native order entry (slow, click-heavy) and ambient scribes (which only document), Atlas acts on the chart — safely, on any FHIR EHR, with every action narrated and confirmed before it happens.

### Brand Personality
Atlas is the unflappable senior colleague. Precise, calm, and quietly competent — the attending who's seen everything and never raises their voice. They speak in clean clinical language, never hype, and always tell you what they're about to do before they do it. They'd wear a well-pressed coat, not a hoodie with a logo. They would never crack a joke while you're deciding a patient's care, never act without your say-so, and never pretend to be certain when they aren't. You trust them because they're consistent, transparent, and they make you faster without making you nervous.

### Voice & Tone Guide
**Voice (constant):** Clear, precise, reassuring, never hyped. Plain clinical language. States intent before action.

| Context | DO | DON'T |
|---|---|---|
| Onboarding | "Pick a patient and tell Atlas what you'd like to order — in plain English." | "Welcome to the future of healthcare AI! 🚀" |
| Confirm prompt | "Ready to place 3 orders for John Doe: CBC, chest X-ray (PA/lateral), metformin 500mg BID. Confirm?" | "Looks good! Sending it!" |
| Ambiguity | "I can't confirm a dose from that. What dose and frequency for the metformin?" | "I'll assume a standard dose." |
| Error state | "Couldn't reach the chart for John Doe. Nothing was placed. Retry?" | "Oops! Something went wrong 😬" |
| Success | "Done. 3 orders placed and now showing in the chart." | "Boom! Nailed it!" |
| Marketing copy | "Say the order. Atlas places it — after you confirm." | "Revolutionary AI that transforms clinical workflows." |

### Messaging Framework
- **Tagline:** "Say it. Confirm it. Done."
- **Homepage headline:** "The EHR copilot that turns what you say into orders — safely."
- **Value propositions:** (1) *Faster than the menus* — state an order set in plain English, place it in seconds. (2) *Safe by design* — every action is narrated and confirmed; raw PHI never reaches the model. (3) *Works with any FHIR EHR* — built on the standard, not one vendor.
- **Feature descriptions:** "Natural-language orders" → "Type or say it the way you'd tell a resident." "Confirm-before-write" → "Nothing reaches the chart until you approve it." "Coded-correct" → "Valid FHIR with the right LOINC and RxNorm codes."
- **Objection handlers:** *"Could it place a wrong order?"* → "It can't place anything you didn't confirm — every order is previewed first." *"Is it touching patient data?"* → "The model reasons over coded metadata; raw PHI stays server-side and is never sent to it." *"Does it work with our EHR?"* → "If it speaks FHIR, Atlas works with it."

### Elevator Pitches
- **5-second:** "Atlas turns plain-English clinical intent into confirmed orders inside any FHIR EHR."
- **30-second:** "Doctors hate their EHR mostly because placing orders means endless menu-diving. Atlas is a copilot that sits in the chart: you say 'order a CBC and start metformin 500mg,' it drafts the correctly-coded orders, you confirm with one click, and it writes them back. It's built on FHIR so it works with any EHR, and it never touches raw patient data or acts without your approval."
- **2-minute:** "Physician burnout is at a crisis, and the EHR is the number-one cause — specifically the click-heavy grind of order entry. Ambient AI scribes proved doctors will trust AI in the room, but they only draft notes; nobody made the EHR actually *do* what the doctor wants. That's Atlas. It's an in-chart copilot: the clinician states an order or order set in plain English, Atlas reads the patient's chart from FHIR, drafts structured, correctly-coded orders, narrates exactly what it'll do, and waits for one confirming click before writing them back. Why us: we've already built a production EHR Copilot with verified PHI isolation — the AI reasons over coded metadata, never raw PHI, enforced by a test. Why now: FHIR is finally universal and clinicians have crossed the AI-trust threshold. We're built on the standard, so 'works with any EHR' is structural, not a promise. The ask: [funding / pilot site / judges' vote] to put seconds-not-minutes order entry in front of real clinicians."

### Competitive Differentiation Narrative
Every clinical workflow tool today sits on one side of a gap. On one side, the EHR's own order entry: complete, billing-accurate, and agonizingly slow. On the other, the new wave of ambient AI scribes — Abridge, Nuance DAX, Suki — which are fast, well-funded, and genuinely loved, but which stop at the note. They listen and they write *about* the visit; they don't act *within* the chart. Atlas closes that gap. It's the first tool to take the clinician's stated intent and turn it into confirmable, correctly-coded orders that write back to the EHR. Crucially, it does this on FHIR — so it isn't hostage to a single vendor's integration timeline — and it does it under a trust model borrowed from hard-won clinical-AI experience: narrate before acting, confirm before writing, and never route raw PHI to the model. Competitors who try to follow will discover that bolting "act on the chart" onto a note-taker is a different, harder problem — one that lives or dies on coded correctness and clinician trust, which is exactly where Atlas starts.

### Brand Anti-Patterns
- **Never auto-execute.** No order, however routine, reaches the chart without an explicit confirm. The confirm step is non-negotiable, not a setting.
- **Never send raw PHI to the model.** No names, MRNs, or raw identifiers in any LLM prompt. If a feature needs it, the feature is wrong.
- **Never use hype or emoji near clinical actions.** No "🚀", no "revolutionary," no "Boom!" Clinical surfaces stay sober.
- **Never feign certainty.** No guessed doses, no "I'll assume." Ambiguity becomes a question.
- **Never hide what it's about to do.** No vague phrasing like "processing your request" — always the specific, named action.
- **Never look like a consumer chatbot bolted onto medicine.** No chat-bubble avatar, no playful mascot, no gamification.

-----

## 5. Design Direction

### Design Philosophy
- **Clinical calm over flash.** The UI should lower the clinician's blood pressure, not raise it. Restraint, whitespace, and legibility beat density and color for a tool used near patient care.
- **The confirm step is the hero UI.** The most important screen real estate is the draft-preview-and-confirm moment. It must be instantly scannable and unmistakable — the clinician reads it in two seconds and knows exactly what will happen.
- **Sit inside, don't shout.** As a sidecar, Atlas should feel like a native, trustworthy extension of the chart, not a flashy overlay competing for attention.
- **Legible under pressure.** Type, contrast, and spacing tuned for fast reading by a busy, possibly tired clinician — never tiny dense tables.

### Visual Mood
Reuse the Solace design language: a teal-led palette with clean, Cruise-inspired restraint, generous whitespace, and the Solace foundation tokens as the source of truth. The aesthetic is "well-run hospital, not startup demo" — think Linear's precision and Notion's calm, dressed in clinical teal. The app UI stays entirely in a clean sans system; the serif (Fraunces) is reserved for marketing surfaces only, never in the clinical app. The overall energy is quiet confidence: nothing pulses, nothing glows, nothing demands attention except the one thing that should — the action awaiting your confirmation.

> **Note for implementation:** the hex values below define a coherent clinical-teal system so the PRD and roadmap are immediately buildable. Where Solace's actual foundation tokens differ, prefer the Solace token values and reconcile — these are the fallback/source defaults.

### Color Palette
| Role | Hex | CSS Variable | Tailwind | When to use |
|---|---|---|---|---|
| Primary (teal) | `#0F766E` | `--color-primary` | `primary` | Primary actions, brand accents, active states |
| Primary hover | `#0E6B63` | `--color-primary-hover` | `primary-hover` | Hover/pressed on primary |
| Primary subtle | `#CCFBF1` | `--color-primary-subtle` | `primary-subtle` | Selected rows, subtle highlights, chips |
| Secondary (slate) | `#334155` | `--color-secondary` | `secondary` | Secondary buttons, strong text accents |
| Background | `#F8FAFC` | `--color-background` | `background` | App canvas |
| Surface | `#FFFFFF` | `--color-surface` | `surface` | Cards, panels, the sidecar body |
| Surface alt | `#F1F5F9` | `--color-surface-alt` | `surface-alt` | Nested panels, table headers |
| Text | `#0F172A` | `--color-text` | `text` | Primary text |
| Text muted | `#64748B` | `--color-text-muted` | `text-muted` | Secondary text, labels, codes |
| Border | `#E2E8F0` | `--color-border` | `border` | Dividers, input borders |
| Success | `#15803D` | `--color-success` | `success` | Confirmed/placed orders |
| Warning | `#B45309` | `--color-warning` | `warning` | Ambiguity, needs-input |
| Error | `#B91C1C` | `--color-error` | `error` | Failures, rejected writes |
| Info | `#0E7490` | `--color-info` | `info` | Neutral notices, narration accents |

**Dark mode:** secondary priority for the hackathon. If added: background `#0B1220`, surface `#111827`, text `#E2E8F0`, primary lightened to `#2DD4BF`. Maintain the same contrast commitments.

### Typography
- **Headings & body (app):** `Inter` (Google Fonts). Weights: 400, 500, 600, 700. Clean, neutral, excellent at small sizes — right for clinical legibility. `--font-heading` and `--font-body` both Inter for the app.
- **Marketing display only:** `Fraunces` (Google Fonts), weights 400/600 — used on the landing/marketing page only, never in the clinical app.
- **Mono:** `JetBrains Mono` (Google Fonts), weight 400/500 — for FHIR codes (LOINC/RxNorm), JSON previews, and any technical detail. `--font-mono`.

**Size scale (rem):** `--text-xs` 0.75 / `--text-sm` 0.875 / `--text-base` 1 / `--text-lg` 1.125 / `--text-xl` 1.25 / `--text-2xl` 1.5 / `--text-3xl` 1.875. **Line heights:** body 1.6, headings 1.25, dense data 1.45.

### Spacing & Layout
- **Base unit 4px.** Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- **Sidecar width:** 380–420px fixed panel (the "inside the EHR" sidebar). Main demo workspace max content width 1200px.
- **Minimums:** ≥ 24px between major sections; ≥ 16px card padding; ≥ 12px between stacked list items.
- **Grid:** single-column inside the sidecar; the demo "EHR" view uses a two-pane layout (chart on left, sidecar on right).
- **Breakpoints:** sm 640, md 768, lg 1024, xl 1280. The sidecar collapses to a full-width sheet below md.

### Component Philosophy
- **Border radius:** 8px default (`--radius-md`); 6px for inputs/chips; 12px for cards/panels. Calm, not pill-shaped.
- **Shadows:** subtle and sparing. `--shadow-sm` for cards (`0 1px 2px rgba(15,23,42,0.06)`); a slightly stronger `--shadow-md` only for the confirm panel to lift it as the focal element.
- **Borders:** prefer 1px `--color-border` over heavy shadows for structure.
- **Buttons:** Primary = solid teal, white text, 600 weight. Secondary = slate outline. Destructive/Reject = error outline, never solid red (avoid alarm). Confirm = the single most prominent button on screen.
- **Inputs:** generous (44px min height), clear focus ring in primary teal, mono font for any code field.
- Components should feel sturdy and quiet — reflecting the "unflappable senior colleague" personality.

### Iconography & Imagery
- **Icons:** outline style, `lucide-react`. Consistent 1.5px stroke. Clinical-neutral (stethoscope, clipboard, vial, pill, check, alert-triangle) — no cute or rounded "friendly" icon sets.
- **Imagery:** minimal. No stock photos of smiling doctors. If illustration is used (marketing only), favor clean line-art in the teal system.
- **Avoid:** emoji in-app, mascot/avatar for the agent, gradients-as-decoration, glassmorphism.

### Accessibility Commitments
- **WCAG 2.1 AA.** Text contrast ≥ 4.5:1 (verified for teal `#0F766E` on white and on `#F8FAFC`); large text ≥ 3:1.
- **Keyboard:** fully navigable. The confirm/reject actions are reachable and operable by keyboard; `Enter` confirms only when the draft panel is focused (never a global accidental-confirm).
- **Focus:** visible 2px primary focus ring on all interactive elements; never removed.
- **Screen readers:** the narration text is the accessible label for each drafted order; confirm/reject buttons have explicit aria-labels naming the patient and orders.
- **Touch targets:** ≥ 44×44px.
- **Motion:** respect `prefers-reduced-motion`.

### Motion & Interaction
- **Durations:** 150ms for hovers/small state changes, 200–250ms for panel transitions. Nothing slower than 300ms.
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (standard ease-in-out) for most; ease-out for entrances.
- **What animates:** draft cards fade/slide in (≤ 200ms) as Atlas drafts; narration text can stream. The chart-refresh-after-write gets a brief success highlight on new orders.
- **What doesn't:** the confirm button never animates in a way that could be mis-clicked; no pulsing, no attention-grabbing loops near clinical actions.
- **Loading:** skeleton for chart load; inline "Atlas is drafting…" with streamed text rather than a spinner where possible. Reduced-motion users get instant state changes.

### Design Tokens
| Token | CSS Variable | Tailwind | Value |
|---|---|---|---|
| Primary | `--color-primary` | `primary` | `#0F766E` |
| Primary hover | `--color-primary-hover` | `primary-hover` | `#0E6B63` |
| Primary subtle | `--color-primary-subtle` | `primary-subtle` | `#CCFBF1` |
| Secondary | `--color-secondary` | `secondary` | `#334155` |
| Background | `--color-background` | `background` | `#F8FAFC` |
| Surface | `--color-surface` | `surface` | `#FFFFFF` |
| Surface alt | `--color-surface-alt` | `surface-alt` | `#F1F5F9` |
| Text | `--color-text` | `text` | `#0F172A` |
| Text muted | `--color-text-muted` | `text-muted` | `#64748B` |
| Border | `--color-border` | `border` | `#E2E8F0` |
| Success | `--color-success` | `success` | `#15803D` |
| Warning | `--color-warning` | `warning` | `#B45309` |
| Error | `--color-error` | `error` | `#B91C1C` |
| Info | `--color-info` | `info` | `#0E7490` |
| Font heading | `--font-heading` | `font-heading` | `'Inter', sans-serif` |
| Font body | `--font-body` | `font-body` | `'Inter', sans-serif` |
| Font mono | `--font-mono` | `font-mono` | `'JetBrains Mono', monospace` |
| Radius sm | `--radius-sm` | `rounded-sm` | `6px` |
| Radius md | `--radius-md` | `rounded-md` | `8px` |
| Radius lg | `--radius-lg` | `rounded-lg` | `12px` |
| Shadow sm | `--shadow-sm` | `shadow-sm` | `0 1px 2px rgba(15,23,42,0.06)` |
| Shadow md | `--shadow-md` | `shadow-md` | `0 4px 12px rgba(15,23,42,0.10)` |
| Transition base | `--transition-base` | — | `150ms cubic-bezier(0.4,0,0.2,1)` |
| Space unit | `--space-unit` | — | `4px` |

> Spacing tokens follow the 4px scale (4/8/12/16/24/32/48/64/96) mapped to Tailwind's default spacing plus a `18`=`72px` extension if needed. Reconcile all values against the Solace foundation token set where it exists.
