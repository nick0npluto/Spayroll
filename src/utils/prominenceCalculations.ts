import { Employee, ProminenceMetrics } from '@/types/payroll';

export const DEFAULT_LOT_FEE_PERCENT = 0.5;

export const PROMINENCE_DAY_ORDER = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export interface ProminenceTotals {
  totalCash: number;
  totalRevenue: number;
  totalDeposit: number;
  lotFee: number;
  lotFeeCalculated: number;
  totalTipOut: number;
  totalManHours: number;
  tipOutPerManHour: number;
  avgPerCar: number;
  tipAvg: number;
  bankWithdrawal: number;
  bankWithdrawalCalculated: number;
}

export function createDefaultProminenceMetrics(): ProminenceMetrics {
  return {
    dailyCashByDay: {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    },
    voids: 0,
    ccDeposit: 0,
    cars: 0,
    lotFeePercent: DEFAULT_LOT_FEE_PERCENT,
    lotFeeOverride: null,
    bankWithdrawalOverride: null,
  };
}

export function calculateProminenceTotals(
  metrics: ProminenceMetrics,
  employees: Employee[]
): ProminenceTotals {
  const totalCash = PROMINENCE_DAY_ORDER.reduce(
    (sum, day) => sum + (metrics.dailyCashByDay[day] || 0),
    0
  );
  const totalRevenue = totalCash + metrics.ccDeposit;
  const totalDeposit = totalRevenue - metrics.voids;
  // Prominence sheet applies lot fee as 50% of total deposit.
  const lotFeeCalculated = totalDeposit * metrics.lotFeePercent;
  const lotFee = metrics.lotFeeOverride ?? lotFeeCalculated;
  const totalTipOut = totalCash + metrics.ccDeposit - lotFee;
  const totalManHours = employees.reduce(
    (sum, employee) => sum + employee.sunFriHours + (employee.saturdayWorked ? employee.saturdayHours : 0),
    0
  );
  const tipOutPerManHour = totalManHours > 0 ? totalTipOut / totalManHours : 0;
  const avgPerCar = metrics.cars > 0 ? totalRevenue / metrics.cars : 0;
  const tipAvg = metrics.cars > 0 ? totalCash / metrics.cars : 0;
  // Matches spreadsheet behavior: withdrawal portion from CC after lot fee deduction.
  const bankWithdrawalCalculated = metrics.ccDeposit - lotFee;
  const bankWithdrawal = metrics.bankWithdrawalOverride ?? bankWithdrawalCalculated;

  return {
    totalCash,
    totalRevenue,
    totalDeposit,
    lotFee,
    lotFeeCalculated,
    totalTipOut,
    totalManHours,
    tipOutPerManHour,
    avgPerCar,
    tipAvg,
    bankWithdrawal,
    bankWithdrawalCalculated,
  };
}
