"use client";

import { useState } from "react";
import { FlaskConical, ScanLine, Pill, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import type { DraftOrder } from "@/lib/types";

interface Props {
  draft: DraftOrder;
  index: number;
  answer: string;
  onAnswerChange: (index: number, value: string) => void;
}

function KindIcon({ kind }: { kind: DraftOrder["kind"] }) {
  const cls = "h-4 w-4 text-text-muted shrink-0";
  if (kind === "lab") return <FlaskConical className={cls} aria-hidden />;
  if (kind === "imaging") return <ScanLine className={cls} aria-hidden />;
  return <Pill className={cls} aria-hidden />;
}

export function DraftOrderCard({ draft, index, answer, onAnswerChange }: Props) {
  const [showCodes, setShowCodes] = useState(false);

  if (draft.needsClarification) {
    return (
      <div className="rounded-md border border-warning/40 bg-warning/5 p-3">
        <div className="flex items-start gap-2">
          <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <div className="flex-1">
            <p className="text-sm font-medium text-text">{draft.display}</p>
            <p className="mb-2 text-sm text-warning">{draft.needsClarification}</p>
            <Input
              value={answer}
              onChange={(e) => onAnswerChange(index, e.target.value)}
              placeholder="Answer…"
              aria-label={`Answer: ${draft.needsClarification}`}
              className="h-9"
            />
          </div>
        </div>
      </div>
    );
  }

  const meta = [draft.dose, draft.route, draft.frequency].filter(Boolean).join(" · ");

  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <KindIcon kind={draft.kind} />
          <span className="text-sm font-medium text-text">{draft.display}</span>
        </div>
        {draft.code && (
          <button
            type="button"
            onClick={() => setShowCodes((s) => !s)}
            className={cn(
              "text-xs text-text-muted hover:text-primary",
              showCodes && "text-primary",
            )}
          >
            {showCodes ? "hide code" : "show code"}
          </button>
        )}
      </div>
      {meta && <p className="mt-1 pl-6 text-xs text-text-muted">{meta}</p>}
      {showCodes && draft.code && (
        <div className="mt-2 pl-6">
          <Badge tone="code">
            {draft.code.system.includes("loinc") ? "LOINC" : "RxNorm"} {draft.code.code}
          </Badge>
        </div>
      )}
    </div>
  );
}
