/**
 * Curated demo order vocabulary. Constrains the agent to correct, valid codes
 * (LOINC for labs/imaging, RxNorm for meds) so drafts are trustworthy on stage.
 * See docs/prd.md § Functional Requirements (FR-003).
 */

export type OrderKind = "lab" | "imaging" | "medication";

export interface VocabularyEntry {
  key: string; // stable id used by the agent
  kind: OrderKind;
  display: string;
  system: string; // code system URI
  code: string;
  aliases: string[]; // natural-language phrases that map here
}

const LOINC = "http://loinc.org";
const RXNORM = "http://www.nlm.nih.gov/research/umls/rxnorm";

export const VOCABULARY: VocabularyEntry[] = [
  // --- Labs ---
  { key: "cbc", kind: "lab", display: "CBC with differential", system: LOINC, code: "58410-2", aliases: ["cbc", "complete blood count", "blood count"] },
  { key: "bmp", kind: "lab", display: "Basic metabolic panel", system: LOINC, code: "24323-8", aliases: ["bmp", "basic metabolic panel", "chem 7"] },
  { key: "cmp", kind: "lab", display: "Comprehensive metabolic panel", system: LOINC, code: "24322-0", aliases: ["cmp", "comprehensive metabolic panel", "chem 14"] },
  { key: "lipid", kind: "lab", display: "Lipid panel", system: LOINC, code: "57698-3", aliases: ["lipid panel", "lipids", "cholesterol panel"] },
  { key: "a1c", kind: "lab", display: "Hemoglobin A1c", system: LOINC, code: "4548-4", aliases: ["a1c", "hba1c", "hemoglobin a1c", "glycated hemoglobin"] },
  { key: "tsh", kind: "lab", display: "TSH", system: LOINC, code: "3016-3", aliases: ["tsh", "thyroid stimulating hormone", "thyroid"] },
  { key: "ua", kind: "lab", display: "Urinalysis", system: LOINC, code: "24356-8", aliases: ["urinalysis", "ua", "urine analysis"] },
  { key: "troponin", kind: "lab", display: "Troponin I", system: LOINC, code: "10839-9", aliases: ["troponin", "trop"] },
  { key: "inr", kind: "lab", display: "INR (PT)", system: LOINC, code: "34714-6", aliases: ["inr", "pt/inr", "prothrombin"] },

  // --- Imaging ---
  { key: "cxr", kind: "imaging", display: "Chest X-ray (PA/lateral)", system: LOINC, code: "36643-5", aliases: ["chest x-ray", "chest xray", "cxr", "chest radiograph"] },
  { key: "ecg", kind: "imaging", display: "ECG 12-lead", system: LOINC, code: "11524-6", aliases: ["ecg", "ekg", "electrocardiogram", "12 lead"] },
  { key: "ct_head", kind: "imaging", display: "CT head without contrast", system: LOINC, code: "30799-1", aliases: ["ct head", "head ct", "ct brain"] },

  // --- Medications (require dose/route/frequency) ---
  { key: "metformin", kind: "medication", display: "metformin 500 mg oral tablet", system: RXNORM, code: "860975", aliases: ["metformin"] },
  { key: "lisinopril", kind: "medication", display: "lisinopril 10 mg oral tablet", system: RXNORM, code: "314076", aliases: ["lisinopril"] },
  { key: "atorvastatin", kind: "medication", display: "atorvastatin 20 mg oral tablet", system: RXNORM, code: "617311", aliases: ["atorvastatin", "lipitor"] },
  { key: "amlodipine", kind: "medication", display: "amlodipine 5 mg oral tablet", system: RXNORM, code: "197361", aliases: ["amlodipine", "norvasc"] },
  { key: "amoxicillin", kind: "medication", display: "amoxicillin 500 mg oral capsule", system: RXNORM, code: "308191", aliases: ["amoxicillin"] },
  { key: "albuterol", kind: "medication", display: "albuterol inhaler", system: RXNORM, code: "745679", aliases: ["albuterol", "ventolin", "salbutamol"] },
  { key: "omeprazole", kind: "medication", display: "omeprazole 20 mg oral capsule", system: RXNORM, code: "402014", aliases: ["omeprazole", "prilosec"] },
  { key: "aspirin", kind: "medication", display: "aspirin 81 mg oral tablet", system: RXNORM, code: "243670", aliases: ["aspirin", "asa", "baby aspirin"] },
];

/** Compact catalog string for the agent prompt. */
export function vocabularyForPrompt(): string {
  return VOCABULARY.map(
    (v) => `- [${v.kind}] key="${v.key}" code=${v.code} system=${shortSystem(v.system)} display="${v.display}" aliases=${v.aliases.join("|")}`,
  ).join("\n");
}

/** Look up a vocabulary entry by code (used for server-side re-validation). */
export function findByCode(code: string): VocabularyEntry | undefined {
  return VOCABULARY.find((v) => v.code === code);
}

function shortSystem(system: string): string {
  if (system === LOINC) return "LOINC";
  if (system === RXNORM) return "RxNorm";
  return system;
}

export { LOINC, RXNORM };
