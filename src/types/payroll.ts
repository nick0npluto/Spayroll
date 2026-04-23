export type LocationId = 'rock-steady' | 'the-optimist' | 'aria-village';

export interface LocationProfile {
  id: LocationId;
  name: string;
  standardRate: number;
  premiumRate: number;
  customSaturdayRunnerRate: number | null;
}

export type EmployeeRole = 'runner' | 'lot-manager' | 'box-manager' | 'owner';

export type BasePayType = 'standard' | 'premium';

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
}

export interface PayrollData {
  location: LocationProfile | null;
  employees: Employee[];
  expenses: number;
  weekLabel: string;
  roundedPayment: number | null;
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
