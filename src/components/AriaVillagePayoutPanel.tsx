import { ReactNode } from 'react';
import { AriaMetrics, Employee } from '@/types/payroll';
import {
  ARIA_DAY_ORDER,
  calculateAriaVillageTotals,
} from '@/utils/ariaVillageCalculations';
import { formatCurrency } from '@/utils/payrollCalculations';
import { AlertCircle, Minus } from 'lucide-react';

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
    <section className="rounded-xl border border-amber-500/20 bg-card p-5 space-y-5 step-enter shadow-sm">
      <div>
        <h3 className="font-display text-lg text-foreground">Aria Village payout</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Build gross cash from the counter and manager, remove voids, pay manual hourly first, then
          split the remainder plus CC across pool staff.
        </p>
      </div>

      <WaterfallSection title="1. Build gross total cash">
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
        <LedgerRow label="Counter sum" value={formatCurrency(totals.cashCounterSum)} />
        <MetricInput
          label="Manager cash given"
          hint="Extra cash the manager contributes (e.g. $417)"
          value={metrics.managerCashGiven}
          onChange={(v) => onMetricsChange({ ...metrics, managerCashGiven: v })}
        />
        <LedgerRow
          label="Gross total cash"
          value={formatCurrency(totals.grossTotalCash)}
          highlight
        />
      </WaterfallSection>

      <WaterfallSection title="2. Voids (before tip-out)">
        <MetricInput
          label="Voids"
          value={metrics.voids}
          onChange={(v) => onMetricsChange({ ...metrics, voids: v })}
        />
        <LedgerRow label="Cash after voids" value={formatCurrency(totals.cashAfterVoids)} highlight />
      </WaterfallSection>

      <WaterfallSection title="3. Manual hourly (paid first)">
        <p className="text-xs text-muted-foreground">
          {totals.manualEmployeeCount === 0
            ? 'No manual-hourly employees yet — enable “Custom hourly rate” on employee cards below.'
            : `${totals.manualEmployeeCount} employee${totals.manualEmployeeCount !== 1 ? 's' : ''} on manual hourly`}
        </p>
        <LedgerRow label="Manual payroll" value={formatCurrency(totals.manualPayTotal)} />
        <div className="flex items-center gap-2 text-muted-foreground py-1">
          <Minus className="w-4 h-4 shrink-0" />
          <span className="text-xs">Deducted from cash after voids</span>
        </div>
        <LedgerRow label="Pool cash" value={formatCurrency(totals.poolCash)} highlight />
        {totals.isManualPayOverGross && (
          <ErrorBanner>
            Manual payroll ({formatCurrency(totals.manualPayTotal)}) exceeds cash after voids (
            {formatCurrency(totals.cashAfterVoids)}). Lower hours, rates, or adjust cash inputs.
          </ErrorBanner>
        )}
      </WaterfallSection>

      <WaterfallSection title="4. Tip-out pool">
        <MetricInput
          label="CC deposit"
          value={metrics.ccDeposit}
          onChange={(v) => onMetricsChange({ ...metrics, ccDeposit: v })}
        />
        <LedgerRow label="Total tip out" value={formatCurrency(totals.totalTipOut)} highlight />
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground mb-1">Tip out / man-hour</p>
            <p className="text-lg font-semibold text-primary">
              {totals.totalManHours > 0
                ? formatCurrency(totals.tipOutPerManHour)
                : '$0.00'}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground mb-1">Pool hours</p>
            <p className="text-lg font-semibold text-foreground">
              {totals.totalManHours.toFixed(2)}
            </p>
          </div>
        </div>
        {totals.isPoolOverAllocated && !totals.isManualPayOverGross && (
          <ErrorBanner>
            Pool estimated pay ({formatCurrency(totals.poolEstimatedPay)}) exceeds total tip out (
            {formatCurrency(totals.totalTipOut)}). Check pool employee hours.
          </ErrorBanner>
        )}
      </WaterfallSection>
    </section>
  );
}

function WaterfallSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border/80 p-4 space-y-3 bg-muted/10">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      {children}
    </div>
  );
}

function LedgerRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-center text-sm py-1.5 px-2 rounded-lg ${
        highlight ? 'bg-primary/10 font-semibold' : ''
      }`}
    >
      <span className={highlight ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
      <span className={highlight ? 'text-primary text-base' : 'text-foreground font-medium'}>
        {value}
      </span>
    </div>
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

function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
      <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
      <p className="text-foreground">{children}</p>
    </div>
  );
}
