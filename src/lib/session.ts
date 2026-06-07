/**
 * Mocked SMART-on-FHIR session. NOT real auth — sets a client-side flag only.
 * Real SMART-on-FHIR OAuth is a documented production next step (see docs/prd.md § 10).
 */
const KEY = "atlas.demo.authenticated";

export function setAuthenticated(): void {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, "1");
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "1";
}

export function clearAuthenticated(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
}
