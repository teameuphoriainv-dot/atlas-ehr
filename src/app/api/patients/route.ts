import { NextResponse } from "next/server";
import { listPatients, getPatientListItem } from "@/lib/fhir/read";
import { getFhirEnv, publicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const patients = await listPatients(8);
    // If a demo patient is pinned, surface it first.
    const demoId = publicEnv.useMockFhir ? undefined : getFhirEnv().DEMO_PATIENT_ID;
    if (demoId && !patients.some((p) => p.id === demoId)) {
      const demo = await getPatientListItem(demoId).catch(() => ({
        id: demoId,
        displayName: `Demo patient (${demoId})`,
      }));
      patients.unshift(demo);
    }
    return NextResponse.json({ patients });
  } catch (e) {
    return NextResponse.json(
      { error: "FHIR list failed", details: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
