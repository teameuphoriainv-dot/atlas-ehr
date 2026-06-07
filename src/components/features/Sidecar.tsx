"use client";

import { Card } from "@/components/ui/Card";
import { PatientPicker } from "./PatientPicker";
import { OrderPanel } from "./OrderPanel";
import type { PatientContext, PatientListItem } from "@/lib/types";

interface Props {
  patients: PatientListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  patientName: string;
  onChartRefresh: (ctx: PatientContext) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
        {title}
      </h3>
      {children}
    </div>
  );
}

/** The Atlas sidecar that "sits inside" the EHR — patient context + the ordering loop. */
export function Sidecar({
  patients,
  selectedId,
  onSelect,
  patientName,
  onChartRefresh,
}: Props) {
  return (
    <Card className="flex h-full flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-primary">Atlas</span>
        <span className="text-xs text-text-muted">EHR Copilot</span>
      </div>

      <Section title="Patient">
        <PatientPicker patients={patients} selectedId={selectedId} onSelect={onSelect} />
      </Section>

      <Section title="Order">
        <OrderPanel
          patientId={selectedId}
          patientName={patientName}
          onChartRefresh={onChartRefresh}
        />
      </Section>
    </Card>
  );
}
