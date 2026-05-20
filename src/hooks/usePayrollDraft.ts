import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Employee,
  LocationProfile,
  ProminenceMetrics,
  AriaMetrics,
  migrateLocationProfile,
  isKainTracker,
} from '@/types/payroll';
import { KainShift, createEmptyKainShift, createDefaultRecordLabel } from '@/types/kainTracker';
import { createDefaultProminenceMetrics } from '@/utils/prominenceCalculations';
import { createDefaultAriaMetrics } from '@/utils/ariaVillageCalculations';

export type AppStep = 'location' | 'kain-history' | 'count' | 'payroll';

export interface PayrollDraft {
  step: AppStep;
  selectedLocation: LocationProfile | null;
  employees: Employee[];
  kainShifts: KainShift[];
  kainEditingRecordId: string | null;
  kainRecordLabel: string;
  expenses: number;
  weekLabel: string;
  cashForWeek: string;
  prominenceMetrics: ProminenceMetrics;
  ariaMetrics: AriaMetrics;
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
    kainShifts: [],
    kainEditingRecordId: null,
    kainRecordLabel: createDefaultRecordLabel(),
    expenses: 0,
    weekLabel: getDefaultWeekLabel(),
    cashForWeek: '',
    prominenceMetrics: createDefaultProminenceMetrics(),
    ariaMetrics: createDefaultAriaMetrics(),
    savedAt: new Date().toISOString(),
  };
}

function readDraft(): PayrollDraft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PayrollDraft;
    if (!parsed || typeof parsed !== 'object') return null;
    const selectedLocation = parsed.selectedLocation
      ? migrateLocationProfile(parsed.selectedLocation)
      : null;

    return {
      ...createEmptyDraft(),
      ...parsed,
      selectedLocation,
      kainShifts: Array.isArray(parsed.kainShifts)
        ? parsed.kainShifts.map((s, i) => ({
            ...createEmptyKainShift(s.id || `shift-${i}`),
            ...s,
          }))
        : [],
      kainEditingRecordId: parsed.kainEditingRecordId ?? null,
      kainRecordLabel: parsed.kainRecordLabel ?? createDefaultRecordLabel(),
      prominenceMetrics: {
        ...createDefaultProminenceMetrics(),
        ...parsed.prominenceMetrics,
        dailyCashByDay: {
          ...createDefaultProminenceMetrics().dailyCashByDay,
          ...parsed.prominenceMetrics?.dailyCashByDay,
        },
      },
      ariaMetrics: {
        ...createDefaultAriaMetrics(),
        ...parsed.ariaMetrics,
        dailyCashByDay: {
          ...createDefaultAriaMetrics().dailyCashByDay,
          ...parsed.ariaMetrics?.dailyCashByDay,
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

  const hasMeaningfulProgress = useCallback((d: PayrollDraft) => {
    if (!d.selectedLocation || d.step === 'location') return false;
    if (isKainTracker(d.selectedLocation)) {
      return d.step === 'count' || d.step === 'payroll' || d.kainShifts.length > 0;
    }
    return true;
  }, []);

  useEffect(() => {
    const stored = readDraft();
    if (stored && hasMeaningfulProgress(stored)) {
      setPendingResume(stored);
    }
    setHasCheckedStorage(true);
  }, [hasMeaningfulProgress]);

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
          if (
            isKainTracker(next.selectedLocation) &&
            next.step === 'kain-history' &&
            !next.kainEditingRecordId &&
            next.kainShifts.length === 0
          ) {
            clearPayrollDraft();
          } else if (!isKainTracker(next.selectedLocation) || next.step !== 'kain-history') {
            persistDraft(next);
          }
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
