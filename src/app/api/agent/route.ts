import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runAgent } from "@/lib/agent/runAgent";
import { makeBuiltinFhir, makeRemoteFhir } from "@/lib/fhir/remote";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  patientId: z.string().min(1),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .optional(),
  fhir: z.object({ baseUrl: z.string().url(), token: z.string().min(1) }).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 },
    );
  }
  const { message, patientId, history, fhir } = parsed.data;

  const client = fhir ? makeRemoteFhir(fhir.baseUrl, fhir.token) : makeBuiltinFhir();

  try {
    const turn = await runAgent({
      message,
      history,
      patientRef: `Patient/${patientId}`,
      fhir: client,
    });
    return NextResponse.json(turn);
  } catch (e) {
    return NextResponse.json(
      { error: "Agent failed", details: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
