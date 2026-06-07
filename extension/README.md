# Atlas — Agentic EHR Copilot (Chrome Extension)

A draggable AI **agent** that injects on top of any EHR page (e.g. Epic) and can do
**anything with the chart**: ask questions, summarize, analyze trends, and — with a
confirm gate — write problems, observations, allergies, and orders. Real **SMART-on-FHIR**
auth against the **Epic sandbox**.

## Architecture
```
content.js  (draggable chat overlay on the EHR page)
   └─ background.js  (SMART-on-FHIR auth via chrome.identity + fetch proxy)
        ├─ Epic R4 sandbox   (reads/writes with the user's OAuth token)
        └─ Atlas backend (localhost:3000)  → /api/agent  (Claude tool-loop; Anthropic key stays server-side)
```
- The **extension** holds the Epic token and runs the OAuth (PKCE) flow.
- The **backend** runs the Claude agent loop, calling Epic FHIR with the token, and
  **strips PHI to coded-only** before anything reaches the model.
- **Writes are confirm-gated** — the agent proposes, you click Confirm, then it writes.

## One-time setup
1. **Epic app** (already registered): `Atlas EHR Copilot`, audience *Clinicians or Administrative Users*,
   redirect URI `https://bikjdngpgpelghcjfejdfgbaehgjplag.chromiumapp.org/`,
   Non-Production Client ID in `config.js`.
2. **Run the Atlas backend:** from the repo root, `npm run dev` (must be on `http://localhost:3000`,
   with `ANTHROPIC_API_KEY` set in `.env.local`).
3. **Load the extension:** `chrome://extensions` → Developer mode → **Load unpacked** → select this `extension/` folder.
   - The stable Extension ID is `bikjdngpgpelghcjfejdfgbaehgjplag` (fixed via the manifest `key`), which is why the Epic redirect URI matches.

## Use it
1. On any page, click the teal **A** button (bottom-right) → **Connect to Epic**.
2. Log in with Epic **sandbox** credentials and pick a patient.
3. Ask anything:
   - *"Summarize this patient."*
   - *"What's their A1c trend?"*
   - *"Add essential hypertension to the problem list."* → review → **Confirm** → writes to real Epic.
   - *"Order a CBC."* → proposed; note Epic sandbox blocks order (ServiceRequest) creation, so the agent will say so. Problems/observations/allergies **do** write to real Epic.
3. Drag the panel by its title bar; minimize with **–**, close with **×**.

## Notes
- Epic sandbox **write support**: `Condition`, `Observation`, `AllergyIntolerance` create are available;
  `ServiceRequest`/`MedicationRequest` create are not (production-access gated).
- Points at `http://localhost:3000` (`apiBase` in `config.js`) and the Epic R4 sandbox (`fhirBaseUrl`).
- Public client + PKCE — no secret ships in the extension.
