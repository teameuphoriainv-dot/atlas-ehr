"use client";

import { useCallback, useEffect, useState } from "react";
import type { PatientContext, PatientListItem } from "@/lib/types";

export interface PatientData {
  patients: PatientListItem[];
  selectedId: string | null;
  context: PatientContext | null;
  loading: boolean;
  error: string | null;
  select: (id: string) => Promise<void>;
  refresh: () => void;
  setContext: (ctx: PatientContext) => void;
}

export function usePatientData(): PatientData {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [context, setContext] = useState<PatientContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const select = useCallback(async (id: string) => {
    setSelectedId(id);
    setLoading(true);
    setError(null);
    setContext(null);
    try {
      const r = await fetch(`/api/patient?id=${encodeURIComponent(id)}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed to load patient");
      setContext(d.context);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load patient");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/patients")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !Array.isArray(d.patients)) return;
        setPatients(d.patients);
        // Auto-load the first (pinned demo) patient so the EHR shows a chart immediately.
        if (d.patients[0]) void select(d.patients[0].id);
      })
      .catch(() => {
        /* picker simply stays empty; selection by id still works */
      });
    return () => {
      cancelled = true;
    };
  }, [select]);

  const refresh = useCallback(() => {
    if (selectedId) void select(selectedId);
  }, [selectedId, select]);

  return {
    patients,
    selectedId,
    context,
    loading,
    error,
    select,
    refresh,
    setContext,
  };
}
