import { fhirGet } from "./client";
import type {
  Bundle,
  CodeableConcept,
  FhirAllergyIntolerance,
  FhirCondition,
  FhirMedication,
  FhirMedicationRequest,
  FhirObservation,
  FhirPatient,
  FhirServiceRequest,
} from "./types";
import type {
  CodedItem,
  OrderSummary,
  PatientContext,
  PatientListItem,
  VitalSign,
} from "@/lib/types";

function conceptToCoded(concept?: CodeableConcept): CodedItem | null {
  if (!concept) return null;
  const coding = concept.coding?.[0];
  const display = coding?.display ?? concept.text;
  if (!coding?.code && !display) return null;
  return {
    code: coding?.code ?? "",
    system: coding?.system ?? "",
    display: display ?? coding?.code ?? "unknown",
  };
}

function patientName(p: FhirPatient): string {
  const n = p.name?.[0];
  if (!n) return `Patient ${p.id ?? ""}`.trim();
  if (n.text) return n.text;
  return [n.given?.join(" "), n.family].filter(Boolean).join(" ") || `Patient ${p.id}`;
}

/** Band a birthDate to a privacy-preserving decade band, e.g. "40-49". */
function ageBandFromBirthDate(birthDate?: string): string | undefined {
  if (!birthDate) return undefined;
  const year = Number(birthDate.slice(0, 4));
  if (!year) return undefined;
  const age = new Date().getFullYear() - year;
  if (age < 0 || age > 130) return undefined;
  const lo = Math.floor(age / 10) * 10;
  return `${lo}-${lo + 9}`;
}

function bundleResources<T>(b: Bundle<T>): T[] {
  return (b.entry ?? []).map((e) => e.resource).filter((r): r is T => Boolean(r));
}

/** Read a patient's full chart and assemble the display PatientContext. */
export async function getPatientContext(id: string): Promise<PatientContext> {
  const patient = await fhirGet<FhirPatient>(`Patient/${id}`);

  const [conditions, meds, allergies, serviceReqs, medReqs, observations, labObs] = await Promise.all([
    fhirGet<Bundle<FhirCondition>>(`Condition?subject=Patient/${id}&_count=50`).catch(
      emptyBundle<FhirCondition>,
    ),
    fhirGet<Bundle<FhirMedication>>(
      `MedicationStatement?subject=Patient/${id}&_count=50`,
    ).catch(emptyBundle<FhirMedication>),
    fhirGet<Bundle<FhirAllergyIntolerance>>(
      `AllergyIntolerance?patient=Patient/${id}&_count=50`,
    ).catch(emptyBundle<FhirAllergyIntolerance>),
    fhirGet<Bundle<FhirServiceRequest>>(
      `ServiceRequest?subject=Patient/${id}&_count=50`,
    ).catch(emptyBundle<FhirServiceRequest>),
    fhirGet<Bundle<FhirMedicationRequest>>(
      `MedicationRequest?subject=Patient/${id}&_count=50`,
    ).catch(emptyBundle<FhirMedicationRequest>),
    fhirGet<Bundle<FhirObservation>>(
      `Observation?patient=Patient/${id}&category=vital-signs&_count=50`,
    ).catch(emptyBundle<FhirObservation>),
    fhirGet<Bundle<FhirObservation>>(
      `Observation?patient=Patient/${id}&category=laboratory&_count=50`,
    ).catch(emptyBundle<FhirObservation>),
  ]);

  const problems = bundleResources(conditions)
    .map((c) => conceptToCoded(c.code))
    .filter((x): x is CodedItem => Boolean(x));

  const medications = bundleResources(meds)
    .map((m) => conceptToCoded(m.medicationCodeableConcept))
    .filter((x): x is CodedItem => Boolean(x));

  const allergyItems = bundleResources(allergies)
    .map((a) => conceptToCoded(a.code))
    .filter((x): x is CodedItem => Boolean(x));

  const orders: OrderSummary[] = [
    ...bundleResources(serviceReqs).map((s) => ({
      id: s.id ?? "",
      resourceType: "ServiceRequest" as const,
      display: conceptToCoded(s.code)?.display ?? "Service request",
      code: conceptToCoded(s.code)?.code,
    })),
    ...bundleResources(medReqs).map((m) => ({
      id: m.id ?? "",
      resourceType: "MedicationRequest" as const,
      display: conceptToCoded(m.medicationCodeableConcept)?.display ?? "Medication request",
      code: conceptToCoded(m.medicationCodeableConcept)?.code,
    })),
  ];

  const mapObs = (bundle: Bundle<FhirObservation>): VitalSign[] =>
    bundleResources(bundle)
      .map((o) => {
        const label = conceptToCoded(o.code)?.display ?? "Result";
        let value = "";
        if (o.valueQuantity?.value != null) value = `${o.valueQuantity.value}${o.valueQuantity.unit ? " " + o.valueQuantity.unit : ""}`;
        else if (o.valueString) value = o.valueString;
        else if (o.component?.length) {
          value = o.component
            .map((c) => (c.valueQuantity?.value != null ? `${c.valueQuantity.value}` : ""))
            .filter(Boolean)
            .join("/");
        }
        return value ? { label, value } : null;
      })
      .filter((v): v is VitalSign => Boolean(v));

  const vitals = mapObs(observations);
  const labs = mapObs(labObs);

  return {
    id,
    displayName: patientName(patient),
    ageBand: ageBandFromBirthDate(patient.birthDate),
    sex: patient.gender,
    problems,
    medications,
    allergies: allergyItems,
    vitals,
    labs,
    orders,
  };
}

/** Fetch a single patient as a list item (id + real display name). */
export async function getPatientListItem(id: string): Promise<PatientListItem> {
  const p = await fhirGet<FhirPatient>(`Patient/${id}`);
  return { id, displayName: patientName(p) };
}

/** List a few synthetic patients (those with names) for the picker. */
export async function listPatients(count = 8): Promise<PatientListItem[]> {
  const bundle = await fhirGet<Bundle<FhirPatient>>(`Patient?_count=${count}`);
  return bundleResources(bundle)
    .filter((p) => p.id)
    .map((p) => ({ id: p.id as string, displayName: patientName(p) }));
}

function emptyBundle<T>(): Bundle<T> {
  return { resourceType: "Bundle", entry: [] };
}
