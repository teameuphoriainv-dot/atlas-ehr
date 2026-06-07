// Atlas extension config. Loaded into the background service worker.
// The Non-Production Client ID is a sandbox identifier (not a secret) — safe to ship.
self.ATLAS_CONFIG = {
  // The Atlas backend (holds the Anthropic + Azure keys, runs the agent loop).
  // Points at the deployed Vercel backend so the extension works on any computer.
  // For local dev against `npm run dev`, change this to "http://localhost:3000".
  apiBase: "https://ehr-copilot-gilt.vercel.app",

  // Epic R4 sandbox.
  fhirBaseUrl: "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4",
  clientId: "a6534435-15cf-4f76-ab7f-e163ce17c6d8",

  // Explicit per-resource scopes (Epic rejects the patient/*.read wildcard). Must match
  // exactly the APIs registered on the Epic app.
  scope:
    "openid fhirUser launch/patient offline_access " +
    "patient/Patient.read patient/Condition.read patient/Condition.write " +
    "patient/Observation.read patient/Observation.write " +
    "patient/AllergyIntolerance.read patient/AllergyIntolerance.write " +
    "patient/MedicationRequest.read patient/ServiceRequest.read",
};
