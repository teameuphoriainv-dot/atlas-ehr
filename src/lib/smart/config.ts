/**
 * SMART-on-FHIR client config for the Mock.health sandbox.
 * Atlas is a public client (no secret) using the authorization-code + PKCE flow.
 */
export const SMART = {
  fhirBaseUrl: (process.env.MOCKHEALTH_FHIR_BASE || "https://api.mock.health/fhir").replace(/\/$/, ""),
  clientId: process.env.MOCKHEALTH_CLIENT_ID || "",
  appBaseUrl: (process.env.APP_BASE_URL || "http://localhost:3000").replace(/\/$/, ""),
  scope:
    process.env.MOCKHEALTH_SCOPE ||
    "openid fhirUser launch/patient offline_access patient/*.read patient/*.write",
  get redirectUri() {
    return `${this.appBaseUrl}/callback`;
  },
};

export interface SmartEndpoints {
  authorize: string;
  token: string;
}

/** Discover the live authorize/token endpoints from Mock.health's SMART configuration. */
export async function discoverSmart(): Promise<SmartEndpoints> {
  const r = await fetch(`${SMART.fhirBaseUrl}/.well-known/smart-configuration`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`SMART discovery failed: ${r.status}`);
  const c = await r.json();
  if (!c.authorization_endpoint || !c.token_endpoint) {
    throw new Error("SMART configuration missing authorize/token endpoints");
  }
  return { authorize: c.authorization_endpoint, token: c.token_endpoint };
}
