export type LocationId = 'rock-steady' | 'the-optimist' | 'aria-village' | 'kain-tracker';

export interface LocationProfile {
  id: LocationId;
  name: string;
  standardRate: number;
  premiumRate: number;
  customSaturdayRunnerRate: number | null;
}

export type EmployeeRole = 'runner' | 'lot-manager' | 'box-manager' | 'owner';

export type BasePayType = 'standard' | 'premium';

export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  basePayType: BasePayType;
  sunFriHours: number;
  saturdayWorked: boolean;
  saturdayHours: number;
  /**
   * Custom Saturday rate for runners.
   * For managers, use managerSaturdayRate instead so we can
   * distinguish in logic and exports.
   */
  saturdayRate: number | null;
  /**
   * When true (and role is a manager), Saturday pay uses
   * managerSaturdayRate instead of the location premium rate.
   */
  useCustomManagerSaturdayRate?: boolean;
  /**
   * Custom Saturday rate specifically for managers (Lot / Box).
   */
  managerSaturdayRate?: number | null;
  actualPaid: number | null;
  /** Aria Village: hours worked per weekday */
  hoursByDay?: Record<DayKey, number>;
  /** Aria Village: pay at manual rate instead of tip-pool rate */
  useCustomHourly?: boolean;
  customHourlyRate?: number | null;
}

export interface PayrollData {
  location: LocationProfile | null;
  employees: Employee[];
  expenses: number;
  weekLabel: string;
  roundedPayment: number | null;
}

export interface ProminenceMetrics {
  dailyCashByDay: Record<DayKey, number>;
  voids: number;
  ccDeposit: number;
  cars: number;
  lotFeePercent: number;
  lotFeeOverride: number | null;
  bankWithdrawalOverride: number | null;
}

/** Aria Village tip-pool inputs (Dunwoody sheet) */
export interface AriaMetrics {
  /** Row 27 — cash counter for the week */
  dailyCashByDay: Record<DayKey, number>;
  /** Cash the manager adds on top of the counter (e.g. $417) */
  managerCashGiven: number;
  voids: number;
  ccDeposit: number;
}

export interface EmployeePayBreakdown {
  sunFriPay: number;
  saturdayPay: number;
  totalPay: number;
}

export const DEFAULT_LOCATIONS: LocationProfile[] = [
  {
    id: 'rock-steady',
    name: 'Rock Steady',
    standardRate: 12,
    premiumRate: 15,
    customSaturdayRunnerRate: null,
  },
  {
    id: 'the-optimist',
    name: 'The Optimist',
    standardRate: 12,
    premiumRate: 15,
    customSaturdayRunnerRate: null,
  },
  {
    id: 'aria-village',
    name: 'Aria Village',
    standardRate: 12,
    premiumRate: 15,
    customSaturdayRunnerRate: null,
  },
  {
    id: 'kain-tracker',
    name: "Kain's Cash Tracker",
    standardRate: 12,
    premiumRate: 15,
    customSaturdayRunnerRate: null,
  },
];

export const ROLE_DISPLAY_NAMES: Record<EmployeeRole, string> = {
  'runner': 'Runner',
  'lot-manager': 'Lot Manager',
  'box-manager': 'Box Manager',
  'owner': 'Manager+',
};

/** Fixed pay rates for the Owner role — not tied to location rates. */
export const OWNER_RATES = {
  sunFriRate: 25,
  saturdayRate: 30,
} as const;

/** Maps legacy prominence id from saved data to Kain's Cash Tracker */
export function migrateLocationProfile(loc: LocationProfile): LocationProfile {
  if ((loc.id as string) === 'prominence') {
    return {
      ...loc,
      id: 'kain-tracker',
      name: "Kain's Cash Tracker",
    };
  }
  return loc;
}

export function isKainTracker(location: LocationProfile | null | undefined): boolean {
  return location?.id === 'kain-tracker';
}

export function isAriaVillage(location: LocationProfile | null | undefined): boolean {
  return location?.id === 'aria-village';
}
