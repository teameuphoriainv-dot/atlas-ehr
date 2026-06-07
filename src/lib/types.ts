/**
 * Shared app types. See docs/prd.md § Data Model.
 * No database in the MVP — these are in-memory shapes + FHIR projections.
 */

/** A coded clinical item (problem, med, allergy) — display label is coded, not PHI. */
export interface CodedItem {
  code: string;
  system: string;
  display: string;
}

/** Display context — UI only. MAY include the patient's name for the clinician's screen. */
export interface PatientContext {
  id: string;
  displayName: string; // shown in UI only — NEVER sent to the model
  ageBand?: string; // banded, e.g. "40-49"
  sex?: string;
  problems: CodedItem[];
  medications: CodedItem[];
  allergies: CodedItem[];
  vitals: VitalSign[]; // vital signs read from Observations
  labs: VitalSign[]; // lab results read from Observations
  orders: OrderSummary[]; // live orders read back from the chart
  notes?: ClinicalNote[]; // notes the agent saved into the chart
}

/** A vital sign / lab result for the chart panels. */
export interface VitalSign {
  label: string;
  value: string;
}

/** A clinical note saved into the chart by the agent. */
export interface ClinicalNote {
  title: string;
  text: string;
  at: number;
}

/** A placed order, summarized for the chart's Orders list. */
export interface OrderSummary {
  id: string;
  resourceType: "ServiceRequest" | "MedicationRequest";
  display: string;
  code?: string;
}

/** The ONLY thing sent to Claude — no raw PHI (no name, MRN, exact DOB). */
export interface ModelContext {
  patientRef: string; // opaque, e.g. "Patient/123"
  ageBand?: string;
  sex?: string;
  problems: CodedItem[];
  activeMedications: CodedItem[];
  allergies: CodedItem[];
}

/** A drafted order from the agent, pre-confirmation (Phase 2). */
export interface DraftOrder {
  kind: "lab" | "imaging" | "medication";
  display: string;
  fhirResourceType?: "ServiceRequest" | "MedicationRequest";
  // Absent when the draft only carries a clarifying question (needsClarification).
  code?: { system: string; code: string; display: string };
  dose?: string;
  route?: string;
  frequency?: string;
  needsClarification?: string;
}

/** In-memory audit entry (Phase 2). */
export interface AuditEntry {
  at: number;
  patientRef: string;
  action: "drafted" | "confirmed" | "rejected" | "write_failed";
  orderSummaries: string[];
}

/** Lightweight patient list item for the picker. */
export interface PatientListItem {
  id: string;
  displayName: string;
}
