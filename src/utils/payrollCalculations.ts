import { Employee, LocationProfile, EmployeePayBreakdown, OWNER_RATES } from '@/types/payroll';

export function calculateEmployeePay(
  employee: Employee,
  location: LocationProfile
): EmployeePayBreakdown {
  // Determine the rate for Sun-Fri based on role and pay type
  let sunFriRate: number;
  
  if (employee.role === 'owner') {
    // Owner has a fixed personal rate, not tied to location rates
    sunFriRate = OWNER_RATES.sunFriRate;
  } else if (employee.role === 'runner') {
    // Runners can use standard or premium rate based on selection
    sunFriRate = employee.basePayType === 'premium' 
      ? location.premiumRate 
      : location.standardRate;
  } else {
    // Lot Manager and Box Manager always use premium rate
    sunFriRate = location.premiumRate;
  }
  
  const sunFriPay = employee.sunFriHours * sunFriRate;
  
  // Calculate Saturday pay
  let saturdayPay = 0;
  
  if (employee.saturdayWorked && employee.saturdayHours > 0) {
    if (employee.role === 'owner') {
      // Owner has a fixed personal Saturday rate
      saturdayPay = employee.saturdayHours * OWNER_RATES.saturdayRate;
    } else if (employee.role === 'runner') {
      // Runners use custom Saturday rate
      const satRate = employee.saturdayRate ?? location.customSaturdayRunnerRate ?? location.premiumRate;
      saturdayPay = employee.saturdayHours * satRate;
    } else {
      // Managers can optionally use a custom Saturday rate
      const useCustom =
        employee.useCustomManagerSaturdayRate && employee.managerSaturdayRate != null;

      const satRate = useCustom
        ? employee.managerSaturdayRate!
        : location.premiumRate;

      saturdayPay = employee.saturdayHours * satRate;
    }
  }
  
  return {
    sunFriPay: Math.round(sunFriPay * 100) / 100,
    saturdayPay: Math.round(saturdayPay * 100) / 100,
    totalPay: Math.round((sunFriPay + saturdayPay) * 100) / 100,
  };
}

export function calculateTotalPayroll(
  employees: Employee[],
  location: LocationProfile
): number {
  return employees.reduce((total, employee) => {
    const { totalPay } = calculateEmployeePay(employee, location);
    return total + totalPay;
  }, 0);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatHours(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  
  return `${wholeHours}h ${minutes}m`;
}

export function parseHoursMinutes(hours: number, minutes: number): number {
  return hours + (minutes / 60);
}

export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
