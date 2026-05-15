import { CalendarDays, Banknote } from 'lucide-react';
import { LocationProfile } from '@/types/payroll';

interface WeekHeaderProps {
  weekLabel: string;
  onWeekLabelChange: (value: string) => void;
  location: LocationProfile;
  cashForWeek: string;
  onCashForWeekChange: (value: string) => void;
  cashTotal: number;
}

export function WeekHeader({
  weekLabel,
  onWeekLabelChange,
  location,
  cashForWeek,
  onCashForWeekChange,
  cashTotal,
}: WeekHeaderProps) {
  const isProminence = location.id === 'prominence';

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4 step-enter">
      <div>
        <label htmlFor="week-label" className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          Week label
        </label>
        <input
          id="week-label"
          type="text"
          value={weekLabel}
          onChange={(e) => onWeekLabelChange(e.target.value)}
          placeholder="WeekOf_2026-01-14"
          className="input-premium w-full max-w-md text-sm"
        />
      </div>

      {!isProminence && (
        <div>
          <label htmlFor="cash-week" className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <Banknote className="w-4 h-4 text-primary" />
            Cash for the week
          </label>
          <p id="cash-week-hint" className="text-xs text-muted-foreground mb-2">
            Comma-separated daily amounts, e.g. $120, $95, $200
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 max-w-xl">
            <input
              id="cash-week"
              type="text"
              value={cashForWeek}
              onChange={(e) => onCashForWeekChange(e.target.value)}
              placeholder="$Mon, $Tue, $Wed, $Thu, $Fri, $Sat, $Sun"
              aria-describedby="cash-week-hint"
              className="input-premium flex-1 text-sm"
            />
            {cashForWeek.trim() && (
              <p className="text-lg font-semibold text-primary whitespace-nowrap">
                Total: ${cashTotal.toFixed(2)}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
