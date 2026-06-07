import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAzureEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  // base64 image (raw or a data URL — the prefix is stripped).
  image: z.string().min(1),
});

const API_VERSION = "2024-11-30";

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const base64 = parsed.data.image.replace(/^data:[^;]+;base64,/, "");

  let endpoint: string, key: string;
  try {
    ({ AZURE_DI_ENDPOINT: endpoint, AZURE_DI_KEY: key } = getAzureEnv());
  } catch (e) {
    return NextResponse.json(
      { error: "Azure not configured", details: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
  const base = endpoint.replace(/\/$/, "");
  const analyzeUrl = `${base}/documentintelligence/documentModels/prebuilt-read:analyze?api-version=${API_VERSION}`;

  // Kick off analysis (retry transient failures like the FHIR client does).
  let opLocation = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(analyzeUrl, {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ base64Source: base64 }),
      cache: "no-store",
    });
    if (res.status === 202) {
      opLocation = res.headers.get("operation-location") || "";
      break;
    }
    if (![429, 500, 502, 503].includes(res.status)) {
      return NextResponse.json(
        { error: "Azure analyze failed", status: res.status, details: (await res.text()).slice(0, 200) },
        { status: 502 },
      );
    }
    await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }
  if (!opLocation) {
    return NextResponse.json({ error: "No operation-location from Azure" }, { status: 502 });
  }

  // Poll until the read operation completes (~max 20s).
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1000));
    const poll = await fetch(opLocation, {
      headers: { "Ocp-Apim-Subscription-Key": key },
      cache: "no-store",
    });
    if (!poll.ok) continue;
    const data = await poll.json();
    if (data.status === "succeeded") {
      return NextResponse.json({ text: data.analyzeResult?.content ?? "" });
    }
    if (data.status === "failed") {
      return NextResponse.json({ error: "Azure read failed" }, { status: 502 });
    }
  }
  return NextResponse.json({ error: "Azure read timed out" }, { status: 504 });
}
