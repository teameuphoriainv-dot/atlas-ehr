"use client";

import { Button } from "@/components/ui/Button";
import { OrderInput } from "./OrderInput";
import { DraftOrderCard } from "./DraftOrderCard";
import { ConfirmPanel } from "./ConfirmPanel";
import { AuditLog } from "./AuditLog";
import { useOrdering } from "@/lib/hooks/useOrdering";
import type { PatientContext } from "@/lib/types";

interface Props {
  patientId: string | null;
  patientName: string;
  onChartRefresh: (ctx: PatientContext) => void;
}

export function OrderPanel({ patientId, patientName, onChartRefresh }: Props) {
  const o = useOrdering(patientId, onChartRefresh);

  if (!patientId) {
    return (
      <p className="text-sm text-text-muted">
        Select a patient to start ordering.
      </p>
    );
  }

  const showDrafts = o.drafts.length > 0 && (o.status === "drafted" || o.status === "writing");

  return (
    <div className="flex flex-col gap-4">
      <OrderInput
        value={o.text}
        onChange={o.setText}
        onSubmit={() => o.submit()}
        loading={o.status === "drafting"}
      />

      {o.status === "drafting" && o.narration && (
        <p className="text-sm text-text" aria-live="polite">
          {o.narration}
          <span className="ml-0.5 animate-pulse text-text-muted">▍</span>
        </p>
      )}

      {o.status === "drafted" && o.drafts.length === 0 && (
        <p className="text-sm text-text-muted">
          Atlas couldn&apos;t map that to a known order. Try rephrasing.
        </p>
      )}

      {showDrafts && (
        <div className="flex flex-col gap-2">
          {o.drafts.map((draft, i) => (
            <DraftOrderCard
              key={i}
              draft={draft}
              index={i}
              answer={o.answers[i] ?? ""}
              onAnswerChange={o.setAnswer}
            />
          ))}

          {o.hasClarifications && (
            <Button
              variant="secondary"
              size="sm"
              onClick={o.resolveClarifications}
              className="self-start"
            >
              Update with answers
            </Button>
          )}

          <ConfirmPanel
            narration={o.narration}
            patientName={patientName}
            confirmableCount={o.confirmableCount}
            hasClarifications={o.hasClarifications}
            status={o.status}
            error={o.error}
            writtenCount={o.writtenCount}
            onConfirm={o.confirm}
            onReject={o.reject}
          />
        </div>
      )}

      {(o.status === "success" || o.status === "error") && (
        <ConfirmPanel
          narration={o.narration}
          patientName={patientName}
          confirmableCount={o.confirmableCount}
          hasClarifications={o.hasClarifications}
          status={o.status}
          error={o.error}
          writtenCount={o.writtenCount}
          onConfirm={o.confirm}
          onReject={o.reject}
        />
      )}

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Activity
        </h3>
        <AuditLog version={o.auditVersion} />
      </div>
    </div>
  );
}
