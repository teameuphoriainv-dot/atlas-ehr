"use client";

import { useRef } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { OrderingStatus } from "@/lib/hooks/useOrdering";

interface Props {
  narration: string;
  patientName: string;
  confirmableCount: number;
  hasClarifications: boolean;
  status: OrderingStatus;
  error: string | null;
  writtenCount: number;
  onConfirm: () => void;
  onReject: () => void;
}

export function ConfirmPanel({
  narration,
  patientName,
  confirmableCount,
  hasClarifications,
  status,
  error,
  writtenCount,
  onConfirm,
  onReject,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  if (status === "success") {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-4 shadow-md">
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 className="h-5 w-5" aria-hidden />
          <span className="font-semibold">
            Done — {writtenCount} order{writtenCount === 1 ? "" : "s"} placed
          </span>
        </div>
        <p className="mt-1 text-sm text-text-muted">They now appear in the chart.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-lg border border-error/30 bg-error/5 p-4 shadow-md">
        <div className="flex items-center gap-2 text-error">
          <AlertTriangle className="h-5 w-5" aria-hidden />
          <span className="font-semibold">Something went wrong</span>
        </div>
        <p className="mt-1 text-sm text-text-muted">{error}</p>
        <p className="mt-1 text-sm text-text-muted">Nothing was placed. Try again.</p>
      </div>
    );
  }

  const writing = status === "writing";
  const blocked = hasClarifications || confirmableCount === 0;
  const summary =
    narration ||
    `Ready to place ${confirmableCount} order${confirmableCount === 1 ? "" : "s"} for ${patientName}.`;

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    // Enter confirms ONLY when the panel itself is focused (no global accidental confirm).
    if (e.key === "Enter" && !blocked && !writing && e.target === panelRef.current) {
      e.preventDefault();
      onConfirm();
    }
  }

  return (
    <div
      ref={panelRef}
      tabIndex={blocked ? -1 : 0}
      onKeyDown={onKeyDown}
      className="rounded-lg border border-border bg-surface p-4 shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
      aria-label={`Confirm orders for ${patientName}: ${summary}`}
    >
      <p className="mb-3 text-sm text-text">{summary}</p>
      {hasClarifications && (
        <p className="mb-3 flex items-center gap-1.5 text-xs text-warning">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
          Answer the question above, then update before confirming.
        </p>
      )}
      <div className="flex items-center gap-2">
        <Button
          size="lg"
          onClick={onConfirm}
          disabled={blocked || writing}
          aria-label={`Confirm and place ${confirmableCount} orders for ${patientName}`}
        >
          {writing ? "Placing…" : `Confirm ${confirmableCount} order${confirmableCount === 1 ? "" : "s"}`}
        </Button>
        <Button variant="destructive" onClick={onReject} disabled={writing}>
          Reject
        </Button>
      </div>
    </div>
  );
}
