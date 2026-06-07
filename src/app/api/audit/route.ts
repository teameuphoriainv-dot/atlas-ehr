import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addAudit, listAudit } from "@/lib/audit/log";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ entries: listAudit() });
}

const rejectSchema = z.object({
  patientRef: z.string().min(1),
  orderSummaries: z.array(z.string()).default([]),
});

/** Record a clinician rejection (drafts discarded, nothing written). */
export async function POST(req: NextRequest) {
  const parsed = rejectSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid audit entry" }, { status: 400 });
  }
  addAudit({
    patientRef: parsed.data.patientRef,
    action: "rejected",
    orderSummaries: parsed.data.orderSummaries,
  });
  return NextResponse.json({ ok: true });
}
