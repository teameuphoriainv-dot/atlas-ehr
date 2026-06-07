import { describe, it, expect } from "vitest";
import { toModelContext } from "./isolate";
import type { PatientContext } from "@/lib/types";

const RAW_NAME = "John Q. Public";
const RAW_MRN = "MRN-99887766";
const RAW_DOB = "1981-07-14";

const ctx: PatientContext = {
  id: "demo-123",
  displayName: RAW_NAME,
  ageBand: "40-49",
  sex: "male",
  problems: [{ code: "44054006", system: "snomed", display: "Type 2 diabetes" }],
  medications: [{ code: "860975", system: "rxnorm", display: "metformin" }],
  allergies: [{ code: "7980", system: "rxnorm", display: "penicillin" }],
  vitals: [],
  labs: [],
  orders: [],
};

describe("PHI isolation boundary", () => {
  const model = toModelContext(ctx);
  const serialized = JSON.stringify(model);

  it("never leaks the patient name to the model payload", () => {
    expect(serialized).not.toContain(RAW_NAME);
    expect(serialized).not.toContain("John");
    expect(serialized).not.toContain("Public");
  });

  it("never leaks MRN or exact date of birth", () => {
    expect(serialized).not.toContain(RAW_MRN);
    expect(serialized).not.toContain(RAW_DOB);
    expect(serialized).not.toContain("birthDate");
  });

  it("has no displayName field", () => {
    expect("displayName" in model).toBe(false);
  });

  it("uses an opaque patient reference, not a raw identifier", () => {
    expect(model.patientRef).toBe("Patient/demo-123");
  });

  it("passes through banded age, not exact age or DOB", () => {
    expect(model.ageBand).toBe("40-49");
  });

  it("preserves coded clinical context the model needs", () => {
    expect(model.problems).toHaveLength(1);
    expect(model.activeMedications[0].display).toBe("metformin");
    expect(model.allergies[0].display).toBe("penicillin");
  });
});
