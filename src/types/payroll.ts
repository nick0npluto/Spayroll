export type LocationId = 'rock-steady' | 'the-optimist' | 'aria-village';

export interface LocationProfile {
  id: LocationId;
  name: string;
  standardRate: number;
  premiumRate: number;
  customSaturdayRunnerRate: number | null;
}

export type EmployeeRole = 'runner' | 'lot-manager' | 'box-manager';

export type BasePayType = 'standard' | 'premium';

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  basePayType: BasePayType;
  sunFriHours: number;
  saturdayWorked: boolean;
  saturdayHours: number;
  saturdayRate: number | null;
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
};
