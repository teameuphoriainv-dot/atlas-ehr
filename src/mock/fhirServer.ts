/**
 * In-process mock FHIR server. Enabled with NEXT_PUBLIC_USE_MOCK_FHIR=true so the
 * demo survives a flaky/unreachable public sandbox. Serves one demo patient and
 * accepts order writes into an in-memory store. See docs/prd.md § Reliability.
 */
import type {
  Bundle,
  FhirAllergyIntolerance,
  FhirCondition,
  FhirMedication,
  FhirMedicationRequest,
  FhirObservation,
  FhirPatient,
  FhirServiceRequest,
} from "@/lib/fhir/types";

const DEMO_ID = "mock-demo-1";

const patient: FhirPatient = {
  resourceType: "Patient",
  id: DEMO_ID,
  name: [{ text: "Riley Demo" }],
  gender: "female",
  birthDate: "1978-04-12",
};

const conditions: FhirCondition[] = [
  cc("Condition", "44054006", "http://snomed.info/sct", "Type 2 diabetes mellitus"),
  cc("Condition", "38341003", "http://snomed.info/sct", "Hypertension"),
  cc("Condition", "195967001", "http://snomed.info/sct", "Asthma"),
];

const medications: FhirMedication[] = [
  med("860975", "metformin 1000 mg oral tablet"),
  med("314076", "lisinopril 20 mg oral tablet"),
];

const allergies: FhirAllergyIntolerance[] = [
  {
    resourceType: "AllergyIntolerance",
    id: "a1",
    code: {
      coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "7980", display: "Penicillin" }],
      text: "Penicillin",
    },
  },
];

function vital(display: string, value: number, unit: string): FhirObservation {
  return {
    resourceType: "Observation",
    id: `v-${display.replace(/\s+/g, "")}`,
    status: "final",
    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "vital-signs" }] }],
    code: { text: display },
    valueQuantity: { value, unit },
  };
}

function lab(display: string, value: number, unit: string): FhirObservation {
  return {
    resourceType: "Observation",
    id: `l-${display.replace(/\s+/g, "")}`,
    status: "final",
    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "laboratory" }] }],
    code: { text: display },
    valueQuantity: { value, unit },
  };
}

const labObservations: FhirObservation[] = [
  lab("Hemoglobin A1c", 7.2, "%"),
  lab("Glucose", 142, "mg/dL"),
  lab("Creatinine", 0.9, "mg/dL"),
  lab("eGFR", 88, "mL/min"),
  lab("LDL cholesterol", 110, "mg/dL"),
  lab("Hemoglobin", 13.5, "g/dL"),
  lab("WBC", 6.2, "10³/µL"),
  lab("Potassium", 4.1, "mmol/L"),
];

const observations: FhirObservation[] = [
  { resourceType: "Observation", id: "v-bp", status: "final", category: [{ coding: [{ code: "vital-signs" }] }], code: { text: "Blood pressure" }, valueString: "128/82 mmHg" },
  vital("Heart rate", 76, "bpm"),
  vital("Temperature", 98.6, "°F"),
  vital("Respiratory rate", 16, "/min"),
  vital("O2 saturation", 98, "%"),
  vital("Weight", 72, "kg"),
  vital("Height", 168, "cm"),
  vital("BMI", 25.5, "kg/m²"),
];

// Resources written during the session live here, by type.
const orders: (FhirServiceRequest | FhirMedicationRequest)[] = [];
const sessionConditions: FhirCondition[] = [];
const sessionAllergies: FhirAllergyIntolerance[] = [];
const sessionObservations: FhirObservation[] = [];
let seq = 1000;

export function isMockId(id: string): boolean {
  return id === DEMO_ID;
}
export const MOCK_DEMO_ID = DEMO_ID;

export function mockGet<T>(path: string): T {
  const [resource, query] = path.split("?");

  if (resource === `Patient/${DEMO_ID}`) return patient as T;
  if (resource === "Patient") return listBundle([patient]) as T;

  if (resource === "Condition") return listBundle([...conditions, ...sessionConditions]) as T;
  if (resource === "MedicationStatement") return listBundle(medications) as T;
  if (resource === "Observation") {
    const isLab = (o: FhirObservation) =>
      o.category?.some((c) => c.coding?.some((cc) => cc.code === "laboratory"));
    const all = [...observations, ...labObservations, ...sessionObservations];
    if (query?.includes("category=laboratory")) return listBundle(all.filter(isLab)) as T;
    if (query?.includes("category=vital-signs")) return listBundle(all.filter((o) => !isLab(o))) as T;
    return listBundle(all) as T;
  }
  if (resource === "AllergyIntolerance") return listBundle([...allergies, ...sessionAllergies]) as T;
  if (resource === "ServiceRequest")
    return listBundle(orders.filter((o) => o.resourceType === "ServiceRequest")) as T;
  if (resource === "MedicationRequest")
    return listBundle(orders.filter((o) => o.resourceType === "MedicationRequest")) as T;

  void query;
  return listBundle([]) as T;
}

export function mockPost<T>(resourceType: string, body: unknown): T {
  const resource = { ...(body as object), id: `mock-${seq++}` } as Record<string, unknown>;
  if (resourceType === "Condition") sessionConditions.push(resource as unknown as FhirCondition);
  else if (resourceType === "AllergyIntolerance") sessionAllergies.push(resource as unknown as FhirAllergyIntolerance);
  else if (resourceType === "Observation") sessionObservations.push(resource as unknown as FhirObservation);
  else orders.push(resource as unknown as FhirServiceRequest);
  return resource as T;
}

function listBundle<T>(items: T[]): Bundle<T> {
  return { resourceType: "Bundle", entry: items.map((resource) => ({ resource })), total: items.length };
}

function cc(
  resourceType: "Condition",
  code: string,
  system: string,
  display: string,
): FhirCondition {
  return {
    resourceType,
    id: `c-${code}`,
    code: { coding: [{ system, code, display }], text: display },
  };
}

function med(code: string, display: string): FhirMedication {
  return {
    resourceType: "MedicationStatement",
    id: `m-${code}`,
    status: "active",
    medicationCodeableConcept: {
      coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code, display }],
      text: display,
    },
  };
}
