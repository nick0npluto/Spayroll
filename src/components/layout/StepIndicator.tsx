import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppStep } from '@/hooks/usePayrollDraft';

export const PAYROLL_STEPS: { id: AppStep; label: string; number: number }[] = [
  { id: 'location', label: 'Location', number: 1 },
  { id: 'count', label: 'Team', number: 2 },
  { id: 'payroll', label: 'Payroll', number: 3 },
];

export const KAIN_STEPS: { id: AppStep; label: string; number: number }[] = [
  { id: 'location', label: 'Location', number: 1 },
  { id: 'kain-history', label: 'History', number: 2 },
  { id: 'count', label: 'Shifts', number: 3 },
  { id: 'payroll', label: 'Entry', number: 4 },
];

function stepIndex(step: AppStep, steps: { id: AppStep }[]): number {
  return steps.findIndex((s) => s.id === step);
}

interface StepIndicatorProps {
  currentStep: AppStep;
  onStepClick?: (step: AppStep) => void;
  steps?: { id: AppStep; label: string; number: number }[];
}

export function StepIndicator({
  currentStep,
  onStepClick,
  steps = PAYROLL_STEPS,
}: StepIndicatorProps) {
  const currentIdx = stepIndex(currentStep, steps);

  return (
    <nav
      className="flex items-center justify-center"
      aria-label="Progress"
    >
      {steps.map((step, idx) => {
        const isComplete = idx < currentIdx;
        const isCurrent = step.id === currentStep;
        const isClickable = isComplete && !!onStepClick;

        return (
          <div key={step.id} className="flex items-center">
            {idx > 0 && (
              <div
                className={cn(
                  'hidden sm:block w-6 lg:w-8 h-0.5 mx-0.5 rounded-full transition-colors',
                  isComplete ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick?.(step.id)}
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(
                'flex items-center gap-1.5 px-1.5 sm:px-2 py-1.5 rounded-lg transition-colors min-h-[44px]',
                isClickable && 'hover:bg-muted cursor-pointer',
                !isClickable && 'cursor-default',
                isCurrent && 'bg-primary/10'
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold border-2 transition-colors',
                  isComplete && 'bg-primary border-primary text-primary-foreground',
                  isCurrent && !isComplete && 'border-primary text-primary bg-background',
                  !isComplete && !isCurrent && 'border-border text-muted-foreground bg-background'
                )}
              >
                {isComplete ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden /> : step.number}
              </span>
              <span
                className={cn(
                  'hidden lg:inline text-xs sm:text-sm font-medium',
                  isCurrent ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
