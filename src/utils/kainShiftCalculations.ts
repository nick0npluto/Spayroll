import { KainShift } from '@/types/kainTracker';
import { formatCurrency } from './payrollCalculations';

export function getShiftTotal(shift: KainShift): number {
  return (shift.cash || 0) + (shift.onlineTips || 0);
}

export interface KainShiftTotals {
  totalCash: number;
  totalOnlineTips: number;
  totalEarnings: number;
  totalHours: number;
}

export function calculateKainShiftTotals(shifts: KainShift[]): KainShiftTotals {
  return shifts.reduce(
    (acc, shift) => ({
      totalCash: acc.totalCash + (shift.cash || 0),
      totalOnlineTips: acc.totalOnlineTips + (shift.onlineTips || 0),
      totalEarnings: acc.totalEarnings + getShiftTotal(shift),
      totalHours: acc.totalHours + (shift.hours || 0),
    }),
    { totalCash: 0, totalOnlineTips: 0, totalEarnings: 0, totalHours: 0 }
  );
}

export function formatKainTotalsSummary(totals: KainShiftTotals): string {
  return formatCurrency(totals.totalEarnings);
}
