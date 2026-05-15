import { Wallet, Banknote, Smartphone, Clock } from 'lucide-react';
import { KainShiftTotals } from '@/utils/kainShiftCalculations';
import { formatCurrency } from '@/utils/payrollCalculations';

interface KainShiftSummaryProps {
  totals: KainShiftTotals;
  shiftCount: number;
}

export function KainShiftSummary({ totals, shiftCount }: KainShiftSummaryProps) {
  return (
    <div className="summary-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <Wallet className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-lg text-foreground">Earnings summary</h3>
          <p className="text-sm text-muted-foreground">
            {shiftCount} shift{shiftCount !== 1 ? 's' : ''} logged
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Banknote className="w-4 h-4" />
            <span>Total cash</span>
          </div>
          <span className="font-semibold text-foreground">{formatCurrency(totals.totalCash)}</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Smartphone className="w-4 h-4" />
            <span>Total online tips</span>
          </div>
          <span className="font-semibold text-foreground">
            {formatCurrency(totals.totalOnlineTips)}
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Total hours</span>
          </div>
          <span className="font-semibold text-foreground">{totals.totalHours.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between py-4 px-3 -mx-3 rounded-xl bg-primary/10 mt-2">
          <span className="text-base font-semibold text-foreground">Grand total</span>
          <span className="text-2xl font-bold text-primary">
            {formatCurrency(totals.totalEarnings)}
          </span>
        </div>
      </div>
    </div>
  );
}
