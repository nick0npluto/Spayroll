export interface KainShift {
  id: string;
  /** ISO date YYYY-MM-DD for the day worked */
  workDate: string;
  locationName: string;
  hours: number;
  cash: number;
  onlineTips: number;
}

export interface KainEarningsRecord {
  id: string;
  label: string;
  createdAt: string;
  updatedAt: string;
  shifts: KainShift[];
}

export function getTodayISODate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createEmptyKainShift(id: string, workDate = getTodayISODate()): KainShift {
  return {
    id,
    workDate,
    locationName: '',
    hours: 0,
    cash: 0,
    onlineTips: 0,
  };
}

export function validateKainShiftsForSave(shifts: KainShift[]): string | null {
  if (shifts.length === 0) return 'Add at least one shift before saving';
  for (let i = 0; i < shifts.length; i++) {
    if (!shifts[i].workDate) return `Enter a date for shift ${i + 1}`;
    if (!shifts[i].locationName.trim()) return `Enter a location for shift ${i + 1}`;
  }
  return null;
}

export function createDefaultRecordLabel(date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
