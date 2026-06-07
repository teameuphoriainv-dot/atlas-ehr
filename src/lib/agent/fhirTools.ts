import type Anthropic from "@anthropic-ai/sdk";

/** The agent's FHIR toolbox. Reads auto-execute; writes are proposed for confirmation. */
export const FHIR_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_fhir",
    description:
      "Search any FHIR R4 resource type for the current patient. Returns a (PHI-stripped) Bundle. " +
      "Always scope to the patient, e.g. query 'subject=Patient/{id}' or 'patient=Patient/{id}&category=vital-signs'.",
    input_schema: {
      type: "object",
      properties: {
        resourceType: {
          type: "string",
          description: "e.g. Condition, Observation, MedicationRequest, AllergyIntolerance, ServiceRequest, Encounter, Patient",
        },
        query: { type: "string", description: "URL query string, e.g. 'subject=Patient/123&_count=20'" },
      },
      required: ["resourceType"],
    },
  },
  {
    name: "read_fhir",
    description: "Read a single FHIR resource by id. Returns a PHI-stripped resource.",
    input_schema: {
      type: "object",
      properties: {
        resourceType: { type: "string" },
        id: { type: "string" },
      },
      required: ["resourceType", "id"],
    },
  },
  {
    name: "propose_write",
    description:
      "Propose creating a FHIR resource (an order, problem, observation, or allergy). This does NOT execute — " +
      "it queues the action for the clinician to confirm. Never assume the write happened. " +
      "Build a valid R4 resource with required fields (status, intent, code/coding, etc.); the patient subject is added automatically.",
    input_schema: {
      type: "object",
      properties: {
        resourceType: {
          type: "string",
          enum: ["ServiceRequest", "Condition", "Observation", "AllergyIntolerance", "MedicationRequest"],
        },
        summary: { type: "string", description: "Plain-English description of what will be created." },
        resource: {
          type: "object",
          description: "The FHIR resource body (without subject — added server-side).",
        },
      },
      required: ["resourceType", "summary", "resource"],
    },
  },
];

export function buildAgentSystemPrompt(patientRef: string, snapshot?: string): string {
  return `You are Atlas, an agentic EHR copilot operating over a patient's chart via FHIR R4.

Current patient: ${patientRef}. Scope every search to this patient (subject=${patientRef} or patient=${patientRef}).
${snapshot ? `\nThe patient's current chart is ALREADY LOADED below (PHI-stripped). Use it directly and DO NOT call search_fhir again unless you need something not present here. Reason from this snapshot, then answer or propose writes immediately.\n\nCHART SNAPSHOT:\n${snapshot}\n` : ""}

You can do ANYTHING the clinician asks with the chart:
- Answer questions, summarize, and analyze trends — use search_fhir / read_fhir to gather data, then reason and respond.
- Make changes — orders (ServiceRequest), problems (Condition), results/vitals (Observation), allergies (AllergyIntolerance), medications (MedicationRequest) — by calling propose_write. NEVER assume a write happened; the clinician must confirm it.

RULES:
1. Gather before you answer: search/read the relevant resources rather than guessing.
2. For anything that changes the chart, call propose_write with a complete, valid R4 resource and a clear summary. Do not claim it's done.
3. For a medication, build a MedicationRequest with status "active", intent "order", and a medicationCodeableConcept (RxNorm) plus dosageInstruction text. Never guess a dose — if missing, ask briefly.
4. Be concise and clinical. No hype, no emoji. Use correct codes (LOINC for labs/imaging, SNOMED for problems, RxNorm for meds) when proposing writes.
5. You only ever see PHI-stripped, coded data — reason from codes and values.

BE FAST AND CONCISE — this is an interactive copilot:
- Your text reply must be at most 2-3 short sentences. NEVER output tables or restate the FHIR JSON; the proposed actions are shown to the clinician separately in the UI.
- Propose at most 5 writes per turn.
- Don't re-search when the snapshot already has the answer.

When done, give a brief final answer. If you proposed writes, end with one short line telling the clinician to review and confirm them.`;
}
