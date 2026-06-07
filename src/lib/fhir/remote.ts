import { fhirGet, fhirPost } from "./client";

/**
 * A unified FHIR client interface used by the agent. Either talks to a remote EHR
 * (e.g. Epic) with a Bearer token, or falls back to the built-in client
 * (mock / HAPI / cookie-SMART) when no token is supplied.
 */
export interface FhirClient {
  search: (resourceType: string, query: string) => Promise<unknown>;
  read: (resourceType: string, id: string) => Promise<unknown>;
  create: (resourceType: string, body: unknown) => Promise<{ id?: string; resourceType?: string }>;
}

export function makeRemoteFhir(baseUrl: string, token: string): FhirClient {
  const base = baseUrl.replace(/\/$/, "");
  const auth = { Authorization: `Bearer ${token}` };
  return {
    async search(resourceType, query) {
      const r = await fetch(`${base}/${resourceType}${query ? `?${query}` : ""}`, {
        headers: { ...auth, Accept: "application/fhir+json" },
        cache: "no-store",
      });
      if (!r.ok) throw new Error(`search ${resourceType} failed: ${r.status}`);
      return r.json();
    },
    async read(resourceType, id) {
      const r = await fetch(`${base}/${resourceType}/${id}`, {
        headers: { ...auth, Accept: "application/fhir+json" },
        cache: "no-store",
      });
      if (!r.ok) throw new Error(`read ${resourceType}/${id} failed: ${r.status}`);
      return r.json();
    },
    async create(resourceType, body) {
      const r = await fetch(`${base}/${resourceType}`, {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/fhir+json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      if (!r.ok) {
        throw new Error(`create ${resourceType} failed: ${r.status} ${(await r.text()).slice(0, 200)}`);
      }
      // Epic may return 201 with a Location header and empty body.
      const loc = r.headers.get("Location") || r.headers.get("Content-Location") || "";
      const idFromLoc = loc.match(new RegExp(`${resourceType}/([^/]+)`))?.[1];
      const json = await r.json().catch(() => null);
      return (json as { id?: string }) ?? { resourceType, id: idFromLoc };
    },
  };
}

/** Built-in client (mock / HAPI / cookie-SMART) for the web app and no-token mode. */
export function makeBuiltinFhir(): FhirClient {
  return {
    search: (rt, q) => fhirGet(`${rt}${q ? `?${q}` : ""}`),
    read: (rt, id) => fhirGet(`${rt}/${id}`),
    create: (rt, body) => fhirPost(rt, body),
  };
}
