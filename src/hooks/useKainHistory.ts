import { useCallback, useState } from 'react';
import { KainEarningsRecord, KainShift, createDefaultRecordLabel } from '@/types/kainTracker';
import { generateUniqueId } from '@/utils/payrollCalculations';

const HISTORY_KEY = 'kain-earnings-history';

function readHistory(): KainEarningsRecord[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as KainEarningsRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((r) => r && Array.isArray(r.shifts))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch {
    return [];
  }
}

function writeHistory(records: KainEarningsRecord[]): void {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
  } catch {
    /* quota */
  }
}

function cloneShifts(shifts: KainShift[]): KainShift[] {
  return shifts.map((s) => ({ ...s, id: generateUniqueId() }));
}

export function useKainHistory() {
  const [records, setRecords] = useState<KainEarningsRecord[]>(() => readHistory());

  const refresh = useCallback(() => {
    setRecords(readHistory());
  }, []);

  const saveRecord = useCallback(
    (params: {
      id?: string | null;
      label: string;
      shifts: KainShift[];
    }): KainEarningsRecord => {
      const now = new Date().toISOString();
      const all = readHistory();

      if (params.id) {
        const idx = all.findIndex((r) => r.id === params.id);
        const existing = idx >= 0 ? all[idx] : null;
        const updated: KainEarningsRecord = {
          id: params.id,
          label: params.label.trim() || existing?.label || createDefaultRecordLabel(),
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          shifts: params.shifts.map((s) => ({ ...s })),
        };
        if (idx >= 0) {
          all[idx] = updated;
        } else {
          all.unshift(updated);
        }
        writeHistory(all);
        setRecords(readHistory());
        return updated;
      }

      const created: KainEarningsRecord = {
        id: generateUniqueId(),
        label: params.label.trim() || createDefaultRecordLabel(),
        createdAt: now,
        updatedAt: now,
        shifts: params.shifts.map((s) => ({ ...s })),
      };
      all.unshift(created);
      writeHistory(all);
      setRecords(readHistory());
      return created;
    },
    []
  );

  const deleteRecord = useCallback((id: string) => {
    const all = readHistory().filter((r) => r.id !== id);
    writeHistory(all);
    setRecords(readHistory());
  }, []);

  const getRecord = useCallback((id: string): KainEarningsRecord | undefined => {
    return readHistory().find((r) => r.id === id);
  }, []);

  const duplicateRecord = useCallback((id: string): KainEarningsRecord | null => {
    const source = readHistory().find((r) => r.id === id);
    if (!source) return null;
    return saveRecord({
      label: `${source.label} (copy)`,
      shifts: cloneShifts(source.shifts),
    });
  }, [saveRecord]);

  const replaceAll = useCallback((next: KainEarningsRecord[]) => {
    const sorted = [...next].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    writeHistory(sorted);
    setRecords(readHistory());
  }, []);

  return {
    records,
    refresh,
    saveRecord,
    deleteRecord,
    getRecord,
    duplicateRecord,
    replaceAll,
  };
}
