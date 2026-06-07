"use client";

import type { PatientListItem } from "@/lib/types";

interface Props {
  patients: PatientListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function PatientPicker({ patients, selectedId, onSelect }: Props) {
  return (
    <label className="block">
      <span className="sr-only">Select a patient</span>
      <select
        className="h-11 w-full rounded-md border border-border bg-surface px-3 text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        value={selectedId ?? ""}
        onChange={(e) => e.target.value && onSelect(e.target.value)}
      >
        <option value="" disabled>
          {patients.length ? "Select a patient…" : "Loading patients…"}
        </option>
        {patients.map((p) => (
          <option key={p.id} value={p.id}>
            {p.displayName}
          </option>
        ))}
      </select>
    </label>
  );
}
