import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPatientContext } from "@/lib/fhir/read";
import { writeOrder } from "@/lib/fhir/write";
import { findByCode } from "@/lib/codes/vocabulary";
import { addAudit } from "@/lib/audit/log";
import type { DraftOrder, OrderSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

const draftSchema = z.object({
  kind: z.enum(["lab", "imaging", "medication"]),
  display: z.string().min(1),
  fhirResourceType: z.enum(["ServiceRequest", "MedicationRequest"]),
  code: z.object({
    system: z.string().min(1),
    code: z.string().min(1),
    display: z.string().min(1),
  }),
  dose: z.string().optional(),
  route: z.string().optional(),
  frequency: z.string().optional(),
  needsClarification: z.string().optional(),
});

const bodySchema = z.object({
  patientId: z.string().min(1),
  drafts: z.array(draftSchema).min(1),
});

/** Server-side re-validation: only confirmable, vocabulary-backed orders may be written. */
function isConfirmable(d: DraftOrder): boolean {
  if (d.needsClarification) return false;
  if (!d.code || !findByCode(d.code.code)) return false;
  if (d.fhirResourceType === "MedicationRequest" && (!d.dose || !d.frequency)) {
    return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 },
    );
  }
  const { patientId, drafts } = parsed.data;

  // Reject any draft that isn't a known, confirmable shape (never write unconfirmed orders).
  if (!drafts.every(isConfirmable)) {
    return NextResponse.json(
      { error: "Drafts do not match a known confirmable shape" },
      { status: 409 },
    );
  }

  const written: OrderSummary[] = [];
  try {
    for (const draft of drafts) {
      written.push(await writeOrder(patientId, draft));
    }
  } catch (e) {
    addAudit({
      patientRef: `Patient/${patientId}`,
      action: "write_failed",
      orderSummaries: drafts.map((d) => d.display),
    });
    return NextResponse.json(
      {
        error: "FHIR write failed",
        details: e instanceof Error ? e.message : String(e),
        partial: written,
      },
      { status: 502 },
    );
  }

  addAudit({
    patientRef: `Patient/${patientId}`,
    action: "confirmed",
    orderSummaries: written.map((w) => w.display),
  });

  // Re-fetch the chart so the UI shows the new orders.
  try {
    const context = await getPatientContext(patientId);
    return NextResponse.json({ written, context }, { status: 201 });
  } catch {
    // Orders were written; chart refresh failed. Return what we have.
    return NextResponse.json({ written, context: null }, { status: 201 });
  }
}
