/**
 * Strict coded-only PHI sanitizer. The ONLY data shape allowed to reach the model.
 * Drops direct identifiers and free text; keeps codes, structured values, statuses,
 * and dates so the agent can still reason clinically. See docs/prd.md § Security.
 */

// Keys removed everywhere (direct identifiers / free narrative).
const DENY_KEYS = new Set([
  "identifier",
  "name",
  "address",
  "telecom",
  "photo",
  "contact",
  "note",
  "text", // resource + element narrative
  "div",
  "comment",
  "patientInstruction",
  "maritalStatus",
  "communication",
  "generalPractitioner",
  "managingOrganization",
]);

function ageBand(birthDate: string): string | undefined {
  const year = Number(String(birthDate).slice(0, 4));
  if (!year) return undefined;
  const age = new Date().getFullYear() - year;
  if (age < 0 || age > 130) return undefined;
  const lo = Math.floor(age / 10) * 10;
  return `${lo}-${lo + 9}`;
}

export function sanitize(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(sanitize);
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (DENY_KEYS.has(k)) continue;
      if (k === "birthDate" && typeof v === "string") {
        const band = ageBand(v);
        if (band) out.ageBand = band;
        continue;
      }
      out[k] = sanitize(v);
    }
    // A reference's display often carries the patient's name — drop it.
    if (out.reference && "display" in out) delete out.display;
    return out;
  }
  return node;
}

/** Sanitize a Bundle and trim to the essentials to keep the model payload small. */
export function sanitizeBundle(bundle: unknown): unknown {
  const b = bundle as { entry?: { resource?: unknown }[]; total?: number };
  if (!b || !Array.isArray(b.entry)) return sanitize(bundle);
  return {
    resourceType: "Bundle",
    total: b.total ?? b.entry.length,
    entry: b.entry.slice(0, 25).map((e) => ({ resource: sanitize(e.resource) })),
  };
}
