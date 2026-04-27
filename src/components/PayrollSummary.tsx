import React from 'react';
import { DollarSign, MinusCircle, Calculator, Banknote } from 'lucide-react';
import { Employee, LocationProfile } from '@/types/payroll';
import { calculateTotalPayroll, formatCurrency } from '@/utils/payrollCalculations';
import { ProminenceTotals } from '@/utils/prominenceCalculations';

interface PayrollSummaryProps {
  employees: Employee[];
  location: LocationProfile;
  expenses: number;
  onExpensesChange: (value: number) => void;
  prominenceTotals?: ProminenceTotals | null;
}

export function PayrollSummary({
  employees,
  location,
  expenses,
  onExpensesChange,
  prominenceTotals,
}: PayrollSummaryProps) {
  const totalPayroll = calculateTotalPayroll(employees, location);
  const netTotal = totalPayroll + expenses;
  const isProminence = location.id === 'prominence' && prominenceTotals;
  
  // Calculate actual payment from individual employee actuals
  const actualPayment = employees.reduce((sum, emp) => {
    return sum + (emp.actualPaid ?? 0);
  }, 0);

  return (
    <div className="summary-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-primary/20 flex items-center justify-center">
          <Calculator className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Payroll Summary</h3>
          <p className="text-sm text-muted-foreground">
            {employees.length} employee{employees.length !== 1 ? 's' : ''} • {location.name}
          </p>
        </div>
      </div>

      {isProminence ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-primary/10">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground font-medium">Employee Pay Before Rounding</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              {formatCurrency(prominenceTotals.totalTipOut)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 border-b border-primary/10 pb-3">
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground mb-1">Total Hours</p>
              <p className="text-lg font-semibold text-foreground">
                {prominenceTotals.totalManHours.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground mb-1">Hourly Pay</p>
              <p className="text-lg font-semibold text-primary">
                {formatCurrency(prominenceTotals.tipOutPerManHour)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-b border-primary/10 pb-3">
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground mb-1">Total Cash</p>
              <p className="text-sm font-semibold text-foreground">{formatCurrency(prominenceTotals.totalCash)}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground mb-1">CC Deposit</p>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(prominenceTotals.totalRevenue - prominenceTotals.totalCash)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground mb-1">Lot Fee</p>
              <p className="text-sm font-semibold text-foreground">{formatCurrency(prominenceTotals.lotFee)}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground mb-1">Bank Withdrawal</p>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(prominenceTotals.bankWithdrawal)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 bg-primary/5 px-3 -mx-3">
            <div className="flex items-center gap-3">
              <Banknote className="w-5 h-5 text-primary" />
              <span className="text-foreground font-medium">Actual Paid</span>
            </div>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(actualPayment)}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">Variance (Actual - Tip Out)</span>
            <span
              className={`text-sm font-semibold ${
                actualPayment - prominenceTotals.totalTipOut >= 0 ? 'text-primary' : 'text-destructive'
              }`}
            >
              {formatCurrency(actualPayment - prominenceTotals.totalTipOut)}
            </span>
          </div>
        </div>
      ) : (
      <div className="space-y-4">
        {/* Total Payroll */}
        <div className="flex items-center justify-between py-3 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-muted-foreground" />
            <span className="text-foreground font-medium">Total Payroll</span>
          </div>
          <span className="text-xl font-bold text-foreground">
            {formatCurrency(totalPayroll)}
          </span>
        </div>

        {/* Expenses */}
        <div className="flex items-center justify-between py-3 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <MinusCircle className="w-5 h-5 text-muted-foreground" />
            <span className="text-foreground font-medium">Expenses</span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={expenses || ''}
              onChange={(e) => onExpensesChange(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="numeric-input w-32 pl-7 text-right"
            />
          </div>
        </div>

        {/* Net Total */}
        <div className="flex items-center justify-between py-3 border-b border-primary/10">
          <span className="text-lg font-semibold text-foreground">Net Total</span>
          <span className={`text-2xl font-bold ${netTotal >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {formatCurrency(netTotal)}
          </span>
        </div>

        {/* Actual Payment (auto-calculated from employee actuals) */}
        <div className="flex items-center justify-between py-3 bg-primary/5 px-3 -mx-3">
          <div className="flex items-center gap-3">
            <Banknote className="w-5 h-5 text-primary" />
            <span className="text-foreground font-medium">Actual Payment</span>
          </div>
          <span className="text-2xl font-bold text-primary">
            {formatCurrency(actualPayment)}
          </span>
        </div>
      </div>
      )}
    </div>
  );
}
