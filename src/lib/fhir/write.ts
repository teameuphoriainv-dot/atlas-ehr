import { fhirPost } from "./client";
import type { FhirMedicationRequest, FhirServiceRequest } from "./types";
import type { DraftOrder, OrderSummary } from "@/lib/types";

/**
 * Build and POST a confirmed DraftOrder to FHIR. Returns an OrderSummary.
 * Required R4 fields per docs/prd.md § Technical Architecture > Stack Integration.
 */
export async function writeOrder(
  patientId: string,
  draft: DraftOrder,
): Promise<OrderSummary> {
  if (!draft.code) {
    throw new Error(`Cannot write order without a code: ${draft.display}`);
  }
  const subject = { reference: `Patient/${patientId}` };
  const coding = [
    { system: draft.code.system, code: draft.code.code, display: draft.code.display },
  ];

  if (draft.fhirResourceType === "MedicationRequest") {
    const dosageText = [draft.dose, draft.route, draft.frequency]
      .filter(Boolean)
      .join(" ");
    const body: FhirMedicationRequest = {
      resourceType: "MedicationRequest",
      status: "active",
      intent: "order",
      subject,
      medicationCodeableConcept: { coding, text: draft.code.display },
      ...(dosageText ? { dosageInstruction: [{ text: dosageText }] } : {}),
    };
    const created = await fhirPost<FhirMedicationRequest>("MedicationRequest", body);
    return {
      id: created.id ?? "",
      resourceType: "MedicationRequest",
      display: draft.display,
      code: draft.code.code,
    };
  }

  const body: FhirServiceRequest = {
    resourceType: "ServiceRequest",
    status: "active",
    intent: "order",
    subject,
    code: { coding, text: draft.code.display },
  };
  const created = await fhirPost<FhirServiceRequest>("ServiceRequest", body);
  return {
    id: created.id ?? "",
    resourceType: "ServiceRequest",
    display: draft.display,
    code: draft.code.code,
  };
}
