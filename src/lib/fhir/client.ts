import { getFhirEnv, publicEnv } from "@/lib/env";
import { mockGet, mockPost } from "@/mock/fhirServer";

/**
 * Thin server-side FHIR client over fetch. JSON in/out, clear errors.
 * Server-only — do not import from client components.
 */

export class FhirError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "FhirError";
  }
}

function base(): string {
  return getFhirEnv().FHIR_BASE_URL.replace(/\/$/, "");
}

/** GET a FHIR resource or search query. `path` is relative, e.g. "Patient/123" or "Condition?subject=Patient/123". */
export async function fhirGet<T>(path: string): Promise<T> {
  if (publicEnv.useMockFhir) return mockGet<T>(path);
  const res = await fetch(`${base()}/${path}`, {
    headers: { Accept: "application/fhir+json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new FhirError(`FHIR GET ${path} failed: ${res.status}`, res.status);
  }
  return (await res.json()) as T;
}

/** POST a new FHIR resource. Returns the created resource (with server-assigned id). */
export async function fhirPost<T>(resourceType: string, body: unknown): Promise<T> {
  if (publicEnv.useMockFhir) return mockPost<T>(resourceType, body);

  // The shared HAPI public server intermittently returns 412/5xx on writes — retry a few times.
  let lastDetail = "";
  let lastStatus = 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${base()}/${resourceType}`, {
      method: "POST",
      headers: { "Content-Type": "application/fhir+json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (res.ok) return (await res.json()) as T;
    lastStatus = res.status;
    lastDetail = (await res.text().catch(() => "")).slice(0, 200);
    if (![412, 429, 500, 502, 503].includes(res.status)) break; // non-retryable
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
  }
  throw new FhirError(
    `FHIR POST ${resourceType} failed after retries: ${lastStatus} ${lastDetail}`,
    lastStatus,
  );
}
