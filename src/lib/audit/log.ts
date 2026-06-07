import type { AuditEntry } from "@/lib/types";

/**
 * In-memory audit log (per server instance). Records what Atlas drafted/confirmed/
 * rejected/failed. Capped to the last 100 entries. Production would use a durable,
 * immutable store — see docs/prd.md § Out of Scope.
 */
const entries: AuditEntry[] = [];
const MAX = 100;

export function addAudit(entry: Omit<AuditEntry, "at">): void {
  entries.unshift({ ...entry, at: Date.now() });
  if (entries.length > MAX) entries.length = MAX;
}

export function listAudit(): AuditEntry[] {
  return [...entries];
}
