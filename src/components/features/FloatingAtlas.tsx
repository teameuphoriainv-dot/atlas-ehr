"use client";

import { useState } from "react";
import { GripVertical, Minus, Plus, Stethoscope } from "lucide-react";
import { PatientPicker } from "./PatientPicker";
import { AgentChat } from "./AgentChat";
import { useDrag } from "@/lib/hooks/useDrag";
import type { PatientContext, PatientListItem } from "@/lib/types";

interface Props {
  patients: PatientListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  patientName: string;
  context: PatientContext | null;
  onChartRefresh: (ctx: PatientContext) => void;
}

/** The Atlas agent as a draggable, minimizable window floating over the EHR. */
export function FloatingAtlas({
  patients,
  selectedId,
  onSelect,
  patientName,
  context,
  onChartRefresh,
}: Props) {
  const { pos, dragging, onPointerDown } = useDrag({ x: 0, y: 0 });
  const [minimized, setMinimized] = useState(false);

  const style: React.CSSProperties =
    pos.x === 0 && pos.y === 0 ? { right: 24, top: 76 } : { left: pos.x, top: pos.y };

  return (
    <div
      className="fixed z-50 flex w-[400px] max-w-[92vw] flex-col overflow-hidden rounded-xl border border-primary/20 bg-surface shadow-lg"
      style={{ ...style, height: minimized ? "auto" : "min(640px, 86vh)" }}
    >
      <div
        onPointerDown={onPointerDown}
        className={`flex items-center justify-between bg-primary px-3 py-2 text-white select-none ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 opacity-50" aria-hidden />
          <Stethoscope className="h-4 w-4" aria-hidden />
          <span className="font-semibold">Atlas</span>
          <span className="text-xs text-white/60">EHR Agent</span>
        </div>
        <button
          type="button"
          onClick={() => setMinimized((m) => !m)}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={minimized ? "Expand" : "Minimize"}
          className="rounded p-1 hover:bg-white/15"
        >
          {minimized ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
        </button>
      </div>

      {!minimized && (
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
          <PatientPicker patients={patients} selectedId={selectedId} onSelect={onSelect} />
          <div className="min-h-0 flex-1">
            <AgentChat
              patientId={selectedId}
              patientName={patientName}
              context={context}
              onWriteComplete={onChartRefresh}
            />
          </div>
        </div>
      )}
    </div>
  );
}
