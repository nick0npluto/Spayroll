import { AriaMetrics, DayKey, Employee } from '@/types/payroll';

export const ARIA_DAY_ORDER: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export interface AriaVillageTotals {
  cashCounterSum: number;
  totalCash: number;
  weeklyTotal: number;
  voids: number;
  totalAfterVoids: number;
  ccDeposit: number;
  totalTipOut: number;
  totalManHours: number;
  tipOutPerManHour: number;
  bankWithdrawal: number;
  totalEstimatedPay: number;
  isOverAllocated: boolean;
}

export function createEmptyHoursByDay(): Record<DayKey, number> {
  return {
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
  };
}

export function createDefaultAriaMetrics(): AriaMetrics {
  return {
    dailyCashByDay: createEmptyHoursByDay(),
    totalCash: 0,
    weeklyTotal: 0,
    voids: 0,
    ccDeposit: 0,
  };
}

export function getEmployeeWeeklyHours(employee: Employee): number {
  if (employee.hoursByDay) {
    return ARIA_DAY_ORDER.reduce((sum, day) => sum + (employee.hoursByDay?.[day] ?? 0), 0);
  }
  return employee.sunFriHours + (employee.saturdayWorked ? employee.saturdayHours : 0);
}

export function calculateAriaVillageTotals(
  metrics: AriaMetrics,
  employees: Employee[]
): AriaVillageTotals {
  const cashCounterSum = ARIA_DAY_ORDER.reduce(
    (sum, day) => sum + (metrics.dailyCashByDay[day] || 0),
    0
  );
  const totalAfterVoids = metrics.weeklyTotal - metrics.voids;
  const totalTipOut = metrics.totalCash + metrics.ccDeposit;
  const totalManHours = employees
    .filter((e) => !e.useCustomHourly)
    .reduce((sum, e) => sum + getEmployeeWeeklyHours(e), 0);
  const tipOutPerManHour = totalManHours > 0 ? totalTipOut / totalManHours : 0;
  const bankWithdrawal = totalTipOut - metrics.totalCash;
  const totalEstimatedPay = employees.reduce(
    (sum, e) => sum + getAriaEmployeePay(e, tipOutPerManHour),
    0
  );

  return {
    cashCounterSum,
    totalCash: metrics.totalCash,
    weeklyTotal: metrics.weeklyTotal,
    voids: metrics.voids,
    totalAfterVoids,
    ccDeposit: metrics.ccDeposit,
    totalTipOut,
    totalManHours,
    tipOutPerManHour,
    bankWithdrawal,
    totalEstimatedPay,
    isOverAllocated: totalEstimatedPay > totalTipOut + 0.01,
  };
}

export function getAriaEmployeePay(employee: Employee, tipOutPerManHour: number): number {
  const hours = getEmployeeWeeklyHours(employee);
  if (hours <= 0) return 0;
  if (employee.useCustomHourly && employee.customHourlyRate != null) {
    return hours * employee.customHourlyRate;
  }
  return hours * tipOutPerManHour;
}

export function getAriaEmployeeRateLabel(
  employee: Employee,
  tipOutPerManHour: number
): string {
  if (employee.useCustomHourly && employee.customHourlyRate != null) {
    return `Custom $${employee.customHourlyRate.toFixed(2)}/hr`;
  }
  return `Pool $${tipOutPerManHour.toFixed(2)}/hr`;
}
