"use client";

import { usePatientData } from "@/lib/hooks/usePatientData";
import { EhrBackdrop } from "./EhrBackdrop";
import { FloatingAtlas } from "./FloatingAtlas";
import { LiveConsole } from "./LiveConsole";
import { InfoModal } from "./InfoModal";

/**
 * The demo surface: a real-FHIR-backed EHR view filling the screen, with the Atlas
 * copilot as a draggable panel floating over it. Reads come live from the FHIR server;
 * orders Atlas writes are real FHIR writes that appear in the EHR view on refresh.
 */
export function Workspace() {
  const { patients, selectedId, context, select, setContext } = usePatientData();

  return (
    <div className="relative h-screen overflow-hidden">
      <EhrBackdrop context={context} onContextChange={setContext} />
      <FloatingAtlas
        patients={patients}
        selectedId={selectedId}
        onSelect={select}
        patientName={context?.displayName ?? "this patient"}
        context={context}
        onChartRefresh={setContext}
      />
      <LiveConsole />
      <InfoModal />
    </div>
  );
}
