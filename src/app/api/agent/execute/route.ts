import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { makeBuiltinFhir, makeRemoteFhir } from "@/lib/fhir/remote";
import { addAudit } from "@/lib/audit/log";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const WRITABLE = ["ServiceRequest", "Condition", "Observation", "AllergyIntolerance", "MedicationRequest"] as const;

const actionSchema = z.object({
  resourceType: z.enum(WRITABLE),
  summary: z.string().default(""),
  resource: z.record(z.string(), z.unknown()),
});

const bodySchema = z.object({
  patientId: z.string().min(1),
  actions: z.array(actionSchema).min(1),
  fhir: z.object({ baseUrl: z.string().url(), token: z.string().min(1) }).optional(),
});

/** Attach the patient subject to a resource (AllergyIntolerance uses `patient`). */
function withSubject(resourceType: string, resource: Record<string, unknown>, patientId: string) {
  const ref = { reference: `Patient/${patientId}` };
  const r: Record<string, unknown> = { ...resource, resourceType };
  if (resourceType === "AllergyIntolerance") r.patient = ref;
  else r.subject = ref;
  return r;
}

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 },
    );
  }
  const { patientId, actions, fhir } = parsed.data;
  const client = fhir ? makeRemoteFhir(fhir.baseUrl, fhir.token) : makeBuiltinFhir();

  const written: { resourceType: string; id?: string; summary: string }[] = [];
  const errors: { resourceType: string; summary: string; error: string }[] = [];

  for (const a of actions) {
    try {
      const body = withSubject(a.resourceType, a.resource, patientId);
      const created = await client.create(a.resourceType, body);
      written.push({ resourceType: a.resourceType, id: created.id, summary: a.summary });
    } catch (e) {
      errors.push({
        resourceType: a.resourceType,
        summary: a.summary,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  addAudit({
    patientRef: `Patient/${patientId}`,
    action: errors.length && !written.length ? "write_failed" : "confirmed",
    orderSummaries: [...written, ...errors].map((x) => x.summary).filter(Boolean),
  });

  const status = written.length ? 201 : 502;
  return NextResponse.json({ written, errors }, { status });
}
