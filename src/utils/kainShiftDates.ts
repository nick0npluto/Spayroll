import { KainShift } from '@/types/kainTracker';

export function formatShiftWorkDate(isoDate: string): string {
  if (!isoDate) return '—';
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRecordTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getShiftDateRangeLabel(shifts: KainShift[]): string | null {
  const dates = shifts.map((s) => s.workDate).filter(Boolean).sort();
  if (dates.length === 0) return null;
  const first = formatShiftWorkDate(dates[0]);
  const last = formatShiftWorkDate(dates[dates.length - 1]);
  return dates.length === 1 || dates[0] === dates[dates.length - 1] ? first : `${first} – ${last}`;
}

export function sortShiftsByDate(shifts: KainShift[]): KainShift[] {
  return [...shifts].sort((a, b) => {
    if (a.workDate === b.workDate) return a.locationName.localeCompare(b.locationName);
    if (!a.workDate) return 1;
    if (!b.workDate) return -1;
    return a.workDate.localeCompare(b.workDate);
  });
}
