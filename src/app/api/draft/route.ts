import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPatientContext } from "@/lib/fhir/read";
import { toModelContext } from "@/lib/phi/isolate";
import { draftOrders, draftOrdersStream } from "@/lib/agent/draftOrders";
import { addAudit } from "@/lib/audit/log";

export const dynamic = "force-dynamic";

const codedItem = z.object({
  code: z.string(),
  system: z.string(),
  display: z.string(),
});

const modelContextSchema = z.object({
  patientRef: z.string(),
  ageBand: z.string().optional(),
  sex: z.string().optional(),
  problems: z.array(codedItem),
  activeMedications: z.array(codedItem),
  allergies: z.array(codedItem),
});

// Either provide a patientId (server reads + isolates FHIR) OR a pre-built coded
// context (used by the extension, so raw PHI never reaches our server).
const bodySchema = z.object({
  patientId: z.string().min(1).optional(),
  context: modelContextSchema.optional(),
  text: z.string().min(1).max(1000),
});

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
      { error: "Empty or invalid request", details: parsed.error.issues },
      { status: 400 },
    );
  }
  const { patientId, context, text } = parsed.data;

  if (!patientId && !context) {
    return NextResponse.json(
      { error: "Provide either patientId or a coded context" },
      { status: 400 },
    );
  }

  // Coded context provided by the client (extension) → use directly, no FHIR read.
  // Otherwise read + PHI-isolate from FHIR server-side. Errors return JSON.
  let modelContext;
  if (context) {
    modelContext = context;
  } else {
    try {
      const ctx = await getPatientContext(patientId!);
      modelContext = toModelContext(ctx);
    } catch (e) {
      return NextResponse.json(
        { error: "FHIR read failed", details: e instanceof Error ? e.message : String(e) },
        { status: 502 },
      );
    }
  }

  // Non-streaming mode (?stream=0) — used by the browser extension / simple clients.
  if (req.nextUrl.searchParams.get("stream") === "0") {
    try {
      const result = await draftOrders(text, modelContext);
      addAudit({
        patientRef: modelContext.patientRef,
        action: "drafted",
        orderSummaries: result.drafts.map((d) => d.display),
      });
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json(
        { error: "Model call failed", details: e instanceof Error ? e.message : String(e) },
        { status: 502 },
      );
    }
  }

  // Stream the model's narration, then send the final structured result.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };
      try {
        const result = await draftOrdersStream(text, modelContext, (narration) =>
          send("narration", { narration }),
        );
        addAudit({
          patientRef: modelContext.patientRef,
          action: "drafted",
          orderSummaries: result.drafts.map((d) => d.display),
        });
        send("result", result);
      } catch (e) {
        send("error", {
          error: "Model call failed",
          details: e instanceof Error ? e.message : String(e),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
