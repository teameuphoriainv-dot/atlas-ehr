import type { ModelContext, PatientContext } from "@/lib/types";

/**
 * The PHI-isolation boundary. Builds the ONLY object that may be sent to the LLM.
 *
 * Includes: opaque patient reference, banded age, sex, and coded clinical items.
 * Excludes (by construction): displayName, MRN, exact date of birth, and any
 * free-text identifier. If you add a field here, add an assertion to isolate.test.ts.
 */
export function toModelContext(ctx: PatientContext): ModelContext {
  return {
    patientRef: `Patient/${ctx.id}`,
    ageBand: ctx.ageBand,
    sex: ctx.sex,
    problems: ctx.problems,
    activeMedications: ctx.medications,
    allergies: ctx.allergies,
  };
}
