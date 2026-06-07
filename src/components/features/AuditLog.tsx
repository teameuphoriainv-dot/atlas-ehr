"use client";

import { useEffect, useState } from "react";
import type { AuditEntry } from "@/lib/types";

const actionTone: Record<AuditEntry["action"], string> = {
  drafted: "text-text-muted",
  confirmed: "text-success",
  rejected: "text-text-muted",
  write_failed: "text-error",
};

const actionLabel: Record<AuditEntry["action"], string> = {
  drafted: "Drafted",
  confirmed: "Placed",
  rejected: "Rejected",
  write_failed: "Write failed",
};

interface Props {
  /** Bump to trigger a refetch (after draft/confirm/reject). */
  version: number;
}

export function AuditLog({ version }: Props) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/audit")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && Array.isArray(d.entries)) setEntries(d.entries);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [version]);

  if (entries.length === 0) {
    return <p className="text-sm text-text-muted">No activity yet.</p>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mb-2 text-xs text-text-muted hover:text-primary"
      >
        {open ? "Hide" : "Show"} activity ({entries.length})
      </button>
      {open && (
        <ul className="flex flex-col gap-1.5">
          {entries.slice(0, 8).map((e, i) => (
            <li key={`${e.at}-${i}`} className="text-xs">
              <span className={`font-medium ${actionTone[e.action]}`}>
                {actionLabel[e.action]}
              </span>{" "}
              <span className="text-text-muted">
                {e.orderSummaries.slice(0, 3).join(", ") || "—"}
                {e.orderSummaries.length > 3 ? "…" : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
