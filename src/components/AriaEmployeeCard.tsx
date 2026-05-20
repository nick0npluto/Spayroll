import { Trash2 } from 'lucide-react';
import { Employee, DayKey } from '@/types/payroll';
import {
  ARIA_DAY_ORDER,
  createEmptyHoursByDay,
  getAriaEmployeePay,
  getAriaEmployeeRateLabel,
  getEmployeeWeeklyHours,
} from '@/utils/ariaVillageCalculations';
import { formatCurrency } from '@/utils/payrollCalculations';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const DAY_LABELS: Record<DayKey, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

interface AriaEmployeeCardProps {
  employee: Employee;
  index: number;
  tipOutPerManHour: number;
  onUpdate: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

function parseHours(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function AriaEmployeeCard({
  employee,
  index,
  tipOutPerManHour,
  onUpdate,
  onDelete,
}: AriaEmployeeCardProps) {
  const hoursByDay = employee.hoursByDay ?? createEmptyHoursByDay();
  const weeklyHours = getEmployeeWeeklyHours(employee);
  const estimatedPay = getAriaEmployeePay(employee, tipOutPerManHour);
  const rateLabel = getAriaEmployeeRateLabel(employee, tipOutPerManHour);

  const updateHours = (day: DayKey, value: number) => {
    onUpdate({
      ...employee,
      hoursByDay: { ...hoursByDay, [day]: value },
    });
  };

  return (
    <article
      className={cn(
        'employee-card stagger-fade-in',
        employee.useCustomHourly && 'ring-1 ring-amber-500/30'
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <input
          type="text"
          value={employee.name}
          onChange={(e) => onUpdate({ ...employee, name: e.target.value })}
          placeholder="Employee name"
          className="flex-1 text-lg font-display bg-transparent border-b border-border focus:border-primary outline-none"
        />
        <button
          type="button"
          onClick={() => onDelete(employee.id)}
          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Remove employee"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Hours by day
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-4">
        {ARIA_DAY_ORDER.map((day) => (
          <div key={day} className="space-y-1">
            <label className="text-[10px] text-muted-foreground">{DAY_LABELS[day]}</label>
            <input
              type="number"
              step="0.25"
              min="0"
              value={hoursByDay[day] || ''}
              onChange={(e) => updateHours(day, parseHours(e.target.value))}
              className="numeric-input w-full text-right text-sm"
              placeholder="0"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between py-3 px-3 rounded-lg bg-muted/30 border border-border/50 mb-4">
        <div>
          <p className="text-sm font-medium text-foreground">Custom hourly rate</p>
          <p className="text-xs text-muted-foreground">
            Paid first from gross cash — deducted before the tip pool is calculated
          </p>
        </div>
        <Switch
          checked={!!employee.useCustomHourly}
          onCheckedChange={(checked) =>
            onUpdate({
              ...employee,
              useCustomHourly: checked,
              customHourlyRate: checked
                ? employee.customHourlyRate ?? 15
                : employee.customHourlyRate,
            })
          }
        />
      </div>

      {employee.useCustomHourly && (
        <div className="mb-4">
          <label className="text-xs text-muted-foreground">Rate per hour</label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={employee.customHourlyRate ?? ''}
              onChange={(e) =>
                onUpdate({
                  ...employee,
                  customHourlyRate: parseHours(e.target.value) || null,
                })
              }
              className="numeric-input w-full pl-7 text-right"
              placeholder="15"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground">Total hours</p>
          <p className="text-lg font-semibold text-foreground">{weeklyHours.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Rate</p>
          <p className="text-sm font-medium text-foreground">{rateLabel}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Estimated pay</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(estimatedPay)}</p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Actual paid</label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={employee.actualPaid ?? ''}
              onChange={(e) =>
                onUpdate({
                  ...employee,
                  actualPaid: e.target.value === '' ? null : parseHours(e.target.value),
                })
              }
              placeholder={Math.round(estimatedPay).toString()}
              className="numeric-input w-full pl-7 text-right"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
