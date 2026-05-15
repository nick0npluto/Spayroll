import { Trash2 } from 'lucide-react';
import { KainShift } from '@/types/kainTracker';
import { getShiftTotal } from '@/utils/kainShiftCalculations';
import { formatCurrency } from '@/utils/payrollCalculations';
import { DEFAULT_LOCATIONS } from '@/types/payroll';

const LOCATION_SUGGESTIONS = DEFAULT_LOCATIONS.filter((l) => l.id !== 'kain-tracker').map(
  (l) => l.name
);

interface KainShiftCardProps {
  shift: KainShift;
  index: number;
  onUpdate: (shift: KainShift) => void;
  onDelete: (id: string) => void;
}

function parseAmount(value: string): number {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function KainShiftCard({ shift, index, onUpdate, onDelete }: KainShiftCardProps) {
  const shiftTotal = getShiftTotal(shift);

  return (
    <article
      className="employee-card stagger-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Shift #{index + 1}
          </span>
          <p className="text-lg font-semibold text-primary mt-0.5">
            {formatCurrency(shiftTotal)}
            <span className="text-xs font-normal text-muted-foreground ml-1">shift total</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(shift.id)}
          className="p-2.5 rounded-lg hover:bg-destructive/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Remove shift"
        >
          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-2">
            Date worked <span className="text-destructive">*</span>
          </label>
          <input
            type="date"
            required
            value={shift.workDate}
            onChange={(e) => onUpdate({ ...shift, workDate: e.target.value })}
            className="input-premium w-full max-w-xs text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-2">
            Location worked <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            list={`kain-locations-${shift.id}`}
            value={shift.locationName}
            onChange={(e) => onUpdate({ ...shift, locationName: e.target.value })}
            placeholder="e.g. Rock Steady, The Optimist"
            className="input-premium w-full text-sm"
          />
          <datalist id={`kain-locations-${shift.id}`}>
            {LOCATION_SUGGESTIONS.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">
            Hours worked
          </label>
          <input
            type="number"
            step="0.25"
            min="0"
            value={shift.hours || ''}
            onChange={(e) => onUpdate({ ...shift, hours: parseAmount(e.target.value) })}
            placeholder="0"
            className="numeric-input w-full text-left"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">
            Cash made
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={shift.cash || ''}
              onChange={(e) => onUpdate({ ...shift, cash: parseAmount(e.target.value) })}
              placeholder="0.00"
              className="numeric-input w-full pl-7 text-left"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-2">
            Online tips
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={shift.onlineTips || ''}
              onChange={(e) => onUpdate({ ...shift, onlineTips: parseAmount(e.target.value) })}
              placeholder="0.00"
              className="numeric-input w-full pl-7 text-left"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Cash </span>
          <span className="font-medium">{formatCurrency(shift.cash)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Tips </span>
          <span className="font-medium">{formatCurrency(shift.onlineTips)}</span>
        </div>
        <div className="ml-auto">
          <span className="text-muted-foreground">Total </span>
          <span className="font-bold text-primary">{formatCurrency(shiftTotal)}</span>
        </div>
      </div>
    </article>
  );
}
