import React from 'react';
import { Employee, ProminenceMetrics } from '@/types/payroll';
import {
  calculateProminenceTotals,
  PROMINENCE_DAY_ORDER,
} from '@/utils/prominenceCalculations';
import { formatCurrency } from '@/utils/payrollCalculations';

interface ProminencePayoutPanelProps {
  employees: Employee[];
  metrics: ProminenceMetrics;
  onMetricsChange: (metrics: ProminenceMetrics) => void;
}

const DAY_LABELS: Record<(typeof PROMINENCE_DAY_ORDER)[number], string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

function parseNumberInput(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function ProminencePayoutPanel({
  employees,
  metrics,
  onMetricsChange,
}: ProminencePayoutPanelProps) {
  const totals = calculateProminenceTotals(metrics, employees);

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Prominence Payout</h3>
        <p className="text-sm text-muted-foreground">
          Mirrors the weekly payout sheet with formula-driven fields.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
        {PROMINENCE_DAY_ORDER.map((day) => (
          <div key={day} className="space-y-1">
            <label className="text-xs text-muted-foreground">{DAY_LABELS[day]}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={metrics.dailyCashByDay[day] || ''}
              onChange={(e) =>
                onMetricsChange({
                  ...metrics,
                  dailyCashByDay: {
                    ...metrics.dailyCashByDay,
                    [day]: parseNumberInput(e.target.value),
                  },
                })
              }
              className="numeric-input w-full text-right"
              placeholder="0.00"
            />
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm font-medium">
        Total Cash: <span className="text-primary">{formatCurrency(totals.totalCash)}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2 rounded-xl border border-border p-4">
          <h4 className="text-sm font-semibold text-foreground">Totals</h4>
          <div className="text-sm">
            Total Revenue (Cash + Card):{' '}
            <span className="font-semibold">{formatCurrency(totals.totalRevenue)}</span>
          </div>
          <label className="block text-xs text-muted-foreground">Voids</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={metrics.voids || ''}
            onChange={(e) => onMetricsChange({ ...metrics, voids: parseNumberInput(e.target.value) })}
            className="numeric-input w-full text-right"
            placeholder="0.00"
          />
          <div className="text-sm">
            Net Revenue (Total Revenue - Voids):{' '}
            <span className="font-semibold">{formatCurrency(totals.totalDeposit)}</span>
          </div>
          <label className="block text-xs text-muted-foreground">Cars</label>
          <input
            type="number"
            step="1"
            min="0"
            value={metrics.cars || ''}
            onChange={(e) => onMetricsChange({ ...metrics, cars: parseNumberInput(e.target.value) })}
            className="numeric-input w-full text-right"
            placeholder="0"
          />
        </div>

        <div className="space-y-2 rounded-xl border border-border p-4">
          <h4 className="text-sm font-semibold text-foreground">Tip Out</h4>
          <label className="block text-xs text-muted-foreground">CC Deposit</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={metrics.ccDeposit || ''}
            onChange={(e) => onMetricsChange({ ...metrics, ccDeposit: parseNumberInput(e.target.value) })}
            className="numeric-input w-full text-right"
            placeholder="0.00"
          />
          <label className="block text-xs text-muted-foreground">Lot Fee</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={metrics.lotFeeOverride ?? ''}
            onChange={(e) =>
              onMetricsChange({
                ...metrics,
                lotFeeOverride: e.target.value === '' ? null : parseNumberInput(e.target.value),
              })
            }
            className="numeric-input w-full text-right"
            placeholder={totals.lotFeeCalculated.toFixed(2)}
          />
          <div className="text-sm">
            Lot Fee (used in payout): <span className="font-semibold">{formatCurrency(totals.lotFee)}</span>
          </div>
          <div className="text-sm">
            Employee Pay Before Rounding:{' '}
            <span className="font-semibold text-primary">{formatCurrency(totals.totalTipOut)}</span>
          </div>
          <div className="text-sm">
            Hourly Pay:{' '}
            <span className="font-semibold">
              {totals.totalManHours > 0 ? formatCurrency(totals.tipOutPerManHour) : '$0.00'}
            </span>
          </div>
          <div className="text-sm">
            Revenue Per Car:{' '}
            <span className="font-semibold">{formatCurrency(totals.avgPerCar)}</span>
          </div>
          <div className="text-sm">
            Tip Avg: <span className="font-semibold">{formatCurrency(totals.tipAvg)}</span>
          </div>
          <div className="text-sm">
            Bank Withdrawal (CC deposit - lot fee):{' '}
            <span className="font-semibold">{formatCurrency(totals.bankWithdrawal)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
