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
    <section className="rounded-xl border border-border bg-card p-5 space-y-6 step-enter shadow-sm">
      <div>
        <h3 className="font-display text-lg text-foreground">Prominence payout</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Enter daily cash and revenue metrics for tip-out calculation.
        </p>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Daily cash
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
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
                className="numeric-input w-full text-right text-sm"
                placeholder="0"
              />
            </div>
          ))}
        </div>
        <p className="text-sm font-medium mt-3">
          Total cash: <span className="text-primary">{formatCurrency(totals.totalCash)}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/20">
          <h4 className="text-sm font-semibold text-foreground">Revenue inputs</h4>
          <div className="text-sm flex justify-between">
            <span className="text-muted-foreground">Total revenue</span>
            <span className="font-semibold">{formatCurrency(totals.totalRevenue)}</span>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Voids</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={metrics.voids || ''}
              onChange={(e) => onMetricsChange({ ...metrics, voids: parseNumberInput(e.target.value) })}
              className="numeric-input w-full text-right mt-1"
            />
          </div>
          <div className="text-sm flex justify-between">
            <span className="text-muted-foreground">Net revenue</span>
            <span className="font-semibold">{formatCurrency(totals.totalDeposit)}</span>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Cars</label>
            <input
              type="number"
              step="1"
              min="0"
              value={metrics.cars || ''}
              onChange={(e) => onMetricsChange({ ...metrics, cars: parseNumberInput(e.target.value) })}
              className="numeric-input w-full text-right mt-1"
            />
          </div>
        </div>

        <div className="rounded-xl border border-primary/20 p-4 space-y-3 bg-primary/5">
          <h4 className="text-sm font-semibold text-foreground">Computed pool</h4>
          <div>
            <label className="text-xs text-muted-foreground">CC deposit</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={metrics.ccDeposit || ''}
              onChange={(e) => onMetricsChange({ ...metrics, ccDeposit: parseNumberInput(e.target.value) })}
              className="numeric-input w-full text-right mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Lot fee override</label>
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
              className="numeric-input w-full text-right mt-1"
              placeholder={totals.lotFeeCalculated.toFixed(2)}
            />
          </div>
          <div className="text-sm space-y-1.5 pt-2 border-t border-primary/10">
            <p className="flex justify-between">
              <span className="text-muted-foreground">Lot fee</span>
              <span className="font-semibold">{formatCurrency(totals.lotFee)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-muted-foreground">Tip-out pool</span>
              <span className="font-bold text-primary">{formatCurrency(totals.totalTipOut)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-muted-foreground">Hourly pay</span>
              <span className="font-semibold">
                {totals.totalManHours > 0 ? formatCurrency(totals.tipOutPerManHour) : '$0.00'}
              </span>
            </p>
            <p className="flex justify-between">
              <span className="text-muted-foreground">Bank withdrawal</span>
              <span className="font-semibold">{formatCurrency(totals.bankWithdrawal)}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
