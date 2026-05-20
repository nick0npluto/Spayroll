import { AriaMetrics, Employee } from '@/types/payroll';
import {
  ARIA_DAY_ORDER,
  calculateAriaVillageTotals,
} from '@/utils/ariaVillageCalculations';
import { formatCurrency } from '@/utils/payrollCalculations';
import { AlertCircle } from 'lucide-react';

interface AriaVillagePayoutPanelProps {
  employees: Employee[];
  metrics: AriaMetrics;
  onMetricsChange: (metrics: AriaMetrics) => void;
}

const DAY_LABELS: Record<(typeof ARIA_DAY_ORDER)[number], string> = {
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

export function AriaVillagePayoutPanel({
  employees,
  metrics,
  onMetricsChange,
}: AriaVillagePayoutPanelProps) {
  const totals = calculateAriaVillageTotals(metrics, employees);

  return (
    <section className="rounded-xl border border-amber-500/20 bg-card p-5 space-y-6 step-enter shadow-sm">
      <div>
        <h3 className="font-display text-lg text-foreground">Aria Village payout</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Enter cash metrics and employee hours. Total cash is what you split — not the daily counter sum.
        </p>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Cash counter for the week
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {ARIA_DAY_ORDER.map((day) => (
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
        <p className="text-xs text-muted-foreground mt-2">
          Counter sum: {formatCurrency(totals.cashCounterSum)} — for your records only
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/20">
          <h4 className="text-sm font-semibold text-foreground">Weekly totals</h4>
          <MetricInput
            label="Weekly total"
            hint="Gross total for the week"
            value={metrics.weeklyTotal}
            onChange={(v) => onMetricsChange({ ...metrics, weeklyTotal: v })}
          />
          <MetricInput
            label="Voids"
            value={metrics.voids}
            onChange={(v) => onMetricsChange({ ...metrics, voids: v })}
          />
          <div className="flex justify-between text-sm pt-1 border-t border-border">
            <span className="text-muted-foreground">Total after voids</span>
            <span className="font-semibold text-foreground">
              {formatCurrency(totals.totalAfterVoids)}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-primary/20 p-4 space-y-3 bg-primary/5">
          <h4 className="text-sm font-semibold text-foreground">Tip-out pool</h4>
          <MetricInput
            label="Total cash"
            hint="Amount to split (after manager take)"
            value={metrics.totalCash}
            onChange={(v) => onMetricsChange({ ...metrics, totalCash: v })}
          />
          <MetricInput
            label="CC deposit"
            value={metrics.ccDeposit}
            onChange={(v) => onMetricsChange({ ...metrics, ccDeposit: v })}
          />
          <div className="text-sm space-y-1.5 pt-2 border-t border-primary/10">
            <SummaryRow label="Total tip out" value={formatCurrency(totals.totalTipOut)} bold />
            <SummaryRow
              label="Tip out / man-hour"
              value={
                totals.totalManHours > 0
                  ? formatCurrency(totals.tipOutPerManHour)
                  : '$0.00'
              }
            />
            <SummaryRow label="Pool hours" value={totals.totalManHours.toFixed(2)} />
            <SummaryRow label="Bank withdrawal" value={formatCurrency(totals.bankWithdrawal)} />
          </div>
        </div>
      </div>

      {totals.isOverAllocated && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-foreground">
            Estimated pay ({formatCurrency(totals.totalEstimatedPay)}) exceeds the tip-out pool (
            {formatCurrency(totals.totalTipOut)}). Check hours or custom hourly rates.
          </p>
        </div>
      )}
    </section>
  );
}

function MetricInput({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      {hint && <p className="text-[10px] text-muted-foreground/80">{hint}</p>}
      <input
        type="number"
        step="0.01"
        min="0"
        value={value || ''}
        onChange={(e) => onChange(parseNumberInput(e.target.value))}
        className="numeric-input w-full text-right mt-1"
        placeholder="0"
      />
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <p className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? 'font-bold text-primary' : 'font-semibold'}>{value}</span>
    </p>
  );
}
