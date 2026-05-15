import {
  KainEarningsRecord,
  KainShift,
  createEmptyKainShift,
  getTodayISODate,
} from '@/types/kainTracker';
import { generateUniqueId } from '@/utils/payrollCalculations';

const BACKUP_VERSION = 1;

export interface KainHistoryBackup {
  version: number;
  exportedAt: string;
  records: KainEarningsRecord[];
}

function normalizeShift(raw: unknown, index: number): KainShift | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Partial<KainShift>;
  const base = createEmptyKainShift(typeof s.id === 'string' ? s.id : `shift-${index}`);
  return {
    ...base,
    workDate:
      typeof s.workDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.workDate)
        ? s.workDate
        : base.workDate || getTodayISODate(),
    locationName: typeof s.locationName === 'string' ? s.locationName : '',
    hours: typeof s.hours === 'number' && !Number.isNaN(s.hours) ? s.hours : 0,
    cash: typeof s.cash === 'number' && !Number.isNaN(s.cash) ? s.cash : 0,
    onlineTips:
      typeof s.onlineTips === 'number' && !Number.isNaN(s.onlineTips) ? s.onlineTips : 0,
  };
}

function normalizeRecord(raw: unknown): KainEarningsRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<KainEarningsRecord>;
  if (!Array.isArray(r.shifts)) return null;

  const now = new Date().toISOString();
  const shifts = r.shifts
    .map((s, i) => normalizeShift(s, i))
    .filter((s): s is KainShift => s !== null);

  return {
    id: typeof r.id === 'string' && r.id ? r.id : generateUniqueId(),
    label: typeof r.label === 'string' && r.label.trim() ? r.label.trim() : 'Imported record',
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : now,
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : now,
    shifts,
  };
}

export function parseKainHistoryBackup(jsonString: string): KainEarningsRecord[] | null {
  try {
    const parsed = JSON.parse(jsonString) as unknown;
    let rawRecords: unknown[] | null = null;

    if (Array.isArray(parsed)) {
      rawRecords = parsed;
    } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as KainHistoryBackup).records)) {
      rawRecords = (parsed as KainHistoryBackup).records;
    }

    if (!rawRecords) return null;

    const records = rawRecords
      .map(normalizeRecord)
      .filter((r): r is KainEarningsRecord => r !== null);

    return records.length > 0 || rawRecords.length === 0 ? records : null;
  } catch {
    return null;
  }
}

export function buildKainHistoryBackup(records: KainEarningsRecord[]): KainHistoryBackup {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    records: records.map((r) => ({
      ...r,
      shifts: r.shifts.map((s) => ({ ...s })),
    })),
  };
}

export function downloadKainHistoryBackup(records: KainEarningsRecord[]): void {
  const backup = buildKainHistoryBackup(records);
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `kain-earnings-backup-${date}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
