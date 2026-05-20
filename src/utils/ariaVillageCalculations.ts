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
  managerCashGiven: number;
  grossTotalCash: number;
  voids: number;
  cashAfterVoids: number;
  manualPayTotal: number;
  manualEmployeeCount: number;
  poolCash: number;
  poolCashRaw: number;
  ccDeposit: number;
  totalTipOut: number;
  totalManHours: number;
  tipOutPerManHour: number;
  poolEstimatedPay: number;
  totalEstimatedPay: number;
  bankWithdrawal: number;
  isManualPayOverGross: boolean;
  isPoolOverAllocated: boolean;
}

/** Legacy draft shape before cash-flow rework */
type LegacyAriaMetrics = Partial<AriaMetrics> & {
  totalCash?: number;
  weeklyTotal?: number;
};

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
    managerCashGiven: 0,
    voids: 0,
    ccDeposit: 0,
  };
}

export function sumDailyCash(dailyCashByDay: Record<DayKey, number>): number {
  return ARIA_DAY_ORDER.reduce((sum, day) => sum + (dailyCashByDay[day] || 0), 0);
}

export function migrateAriaMetrics(raw: LegacyAriaMetrics | undefined): AriaMetrics {
  const defaults = createDefaultAriaMetrics();
  if (!raw) return defaults;

  const dailyCashByDay = {
    ...defaults.dailyCashByDay,
    ...raw.dailyCashByDay,
  };
  const cashCounterSum = sumDailyCash(dailyCashByDay);

  let managerCashGiven = raw.managerCashGiven ?? 0;
  if (managerCashGiven === 0) {
    if (raw.totalCash != null && raw.totalCash > 0) {
      managerCashGiven = Math.max(0, raw.totalCash - cashCounterSum);
    } else if (raw.weeklyTotal != null && raw.weeklyTotal > cashCounterSum) {
      managerCashGiven = raw.weeklyTotal - cashCounterSum;
    }
  }

  return {
    dailyCashByDay,
    managerCashGiven,
    voids: raw.voids ?? 0,
    ccDeposit: raw.ccDeposit ?? 0,
  };
}

export function getEmployeeWeeklyHours(employee: Employee): number {
  if (employee.hoursByDay) {
    return ARIA_DAY_ORDER.reduce((sum, day) => sum + (employee.hoursByDay?.[day] ?? 0), 0);
  }
  return employee.sunFriHours + (employee.saturdayWorked ? employee.saturdayHours : 0);
}

export function isManualHourlyEmployee(employee: Employee): boolean {
  return !!employee.useCustomHourly && employee.customHourlyRate != null;
}

export function getManualEmployeePay(employee: Employee): number {
  if (!isManualHourlyEmployee(employee)) return 0;
  const hours = getEmployeeWeeklyHours(employee);
  if (hours <= 0) return 0;
  return hours * (employee.customHourlyRate as number);
}

export function calculateAriaVillageTotals(
  metrics: AriaMetrics,
  employees: Employee[]
): AriaVillageTotals {
  const cashCounterSum = sumDailyCash(metrics.dailyCashByDay);
  const managerCashGiven = metrics.managerCashGiven;
  const grossTotalCash = cashCounterSum + managerCashGiven;
  const voids = metrics.voids;
  const cashAfterVoids = grossTotalCash - voids;

  const manualEmployees = employees.filter(isManualHourlyEmployee);
  const manualPayTotal = manualEmployees.reduce((sum, e) => sum + getManualEmployeePay(e), 0);
  const manualEmployeeCount = manualEmployees.length;

  const poolCashRaw = cashAfterVoids - manualPayTotal;
  const isManualPayOverGross = poolCashRaw < -0.01;
  const poolCash = Math.max(0, poolCashRaw);

  const ccDeposit = metrics.ccDeposit;
  const totalTipOut = poolCash + ccDeposit;

  const poolEmployees = employees.filter((e) => !isManualHourlyEmployee(e));
  const totalManHours = poolEmployees.reduce((sum, e) => sum + getEmployeeWeeklyHours(e), 0);
  const tipOutPerManHour = totalManHours > 0 ? totalTipOut / totalManHours : 0;

  const poolEstimatedPay = poolEmployees.reduce(
    (sum, e) => sum + getAriaEmployeePay(e, tipOutPerManHour),
    0
  );
  const totalEstimatedPay = manualPayTotal + poolEstimatedPay;
  const bankWithdrawal = totalTipOut - poolCash;
  const isPoolOverAllocated = poolEstimatedPay > totalTipOut + 0.01;

  return {
    cashCounterSum,
    managerCashGiven,
    grossTotalCash,
    voids,
    cashAfterVoids,
    manualPayTotal,
    manualEmployeeCount,
    poolCash,
    poolCashRaw,
    ccDeposit,
    totalTipOut,
    totalManHours,
    tipOutPerManHour,
    poolEstimatedPay,
    totalEstimatedPay,
    bankWithdrawal,
    isManualPayOverGross,
    isPoolOverAllocated,
  };
}

export function getAriaEmployeePay(employee: Employee, tipOutPerManHour: number): number {
  const hours = getEmployeeWeeklyHours(employee);
  if (hours <= 0) return 0;
  if (isManualHourlyEmployee(employee)) {
    return getManualEmployeePay(employee);
  }
  return hours * tipOutPerManHour;
}

export function getAriaEmployeeRateLabel(
  employee: Employee,
  tipOutPerManHour: number
): string {
  if (isManualHourlyEmployee(employee)) {
    return `Manual $${employee.customHourlyRate!.toFixed(2)}/hr`;
  }
  return `Pool $${tipOutPerManHour.toFixed(2)}/hr`;
}

export function partitionAriaEmployees(employees: Employee[]): {
  manual: Employee[];
  pool: Employee[];
} {
  const manual: Employee[] = [];
  const pool: Employee[] = [];
  for (const emp of employees) {
    if (isManualHourlyEmployee(emp)) {
      manual.push(emp);
    } else {
      pool.push(emp);
    }
  }
  return { manual, pool };
}
