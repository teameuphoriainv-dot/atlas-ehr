import { NextRequest, NextResponse } from "next/server";
import { getPatientContext } from "@/lib/fhir/read";
import { FhirError } from "@/lib/fhir/client";

// Always run fresh against the FHIR server.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }
  try {
    const context = await getPatientContext(id);
    return NextResponse.json({ context });
  } catch (e) {
    if (e instanceof FhirError && e.status === 404) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "FHIR read failed", details: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
