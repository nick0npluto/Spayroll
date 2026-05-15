import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Employee,
  LocationProfile,
  ProminenceMetrics,
} from '@/types/payroll';
import { createDefaultProminenceMetrics } from '@/utils/prominenceCalculations';

export type AppStep = 'location' | 'count' | 'payroll';

export interface PayrollDraft {
  step: AppStep;
  selectedLocation: LocationProfile | null;
  employees: Employee[];
  expenses: number;
  weekLabel: string;
  cashForWeek: string;
  prominenceMetrics: ProminenceMetrics;
  savedAt: string;
}

const DRAFT_KEY = 'payroll-draft';

function getDefaultWeekLabel(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `WeekOf_${year}-${month}-${day}`;
}

export function createEmptyDraft(): PayrollDraft {
  return {
    step: 'location',
    selectedLocation: null,
    employees: [],
    expenses: 0,
    weekLabel: getDefaultWeekLabel(),
    cashForWeek: '',
    prominenceMetrics: createDefaultProminenceMetrics(),
    savedAt: new Date().toISOString(),
  };
}

function readDraft(): PayrollDraft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PayrollDraft;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      ...createEmptyDraft(),
      ...parsed,
      prominenceMetrics: {
        ...createDefaultProminenceMetrics(),
        ...parsed.prominenceMetrics,
        dailyCashByDay: {
          ...createDefaultProminenceMetrics().dailyCashByDay,
          ...parsed.prominenceMetrics?.dailyCashByDay,
        },
      },
    };
  } catch {
    return null;
  }
}

export function clearPayrollDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

interface UsePayrollDraftOptions {
  debounceMs?: number;
}

export function usePayrollDraft({ debounceMs = 300 }: UsePayrollDraftOptions = {}) {
  const [draft, setDraft] = useState<PayrollDraft>(() => createEmptyDraft());
  const [pendingResume, setPendingResume] = useState<PayrollDraft | null>(null);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = readDraft();
    if (stored && stored.step !== 'location' && stored.selectedLocation) {
      setPendingResume(stored);
    }
    setHasCheckedStorage(true);
  }, []);

  const persistDraft = useCallback((next: PayrollDraft) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      try {
        const payload: PayrollDraft = {
          ...next,
          savedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      } catch {
        /* ignore quota errors */
      }
    }, debounceMs);
  }, [debounceMs]);

  const updateDraft = useCallback(
    (updater: PayrollDraft | ((prev: PayrollDraft) => PayrollDraft)) => {
      setDraft((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (next.step !== 'location' && next.selectedLocation) {
          persistDraft(next);
        }
        return next;
      });
    },
    [persistDraft]
  );

  const resumeDraft = useCallback(() => {
    if (!pendingResume) return;
    setDraft(pendingResume);
    setPendingResume(null);
  }, [pendingResume]);

  const dismissResume = useCallback(() => {
    setPendingResume(null);
    clearPayrollDraft();
  }, []);

  const resetDraft = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    clearPayrollDraft();
    setDraft(createEmptyDraft());
    setPendingResume(null);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return {
    draft,
    updateDraft,
    resetDraft,
    pendingResume,
    resumeDraft,
    dismissResume,
    hasCheckedStorage,
  };
}
