import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppStep } from '@/hooks/usePayrollDraft';

const STEPS: { id: AppStep; label: string; number: number }[] = [
  { id: 'location', label: 'Location', number: 1 },
  { id: 'count', label: 'Team', number: 2 },
  { id: 'payroll', label: 'Payroll', number: 3 },
];

function stepIndex(step: AppStep): number {
  return STEPS.findIndex((s) => s.id === step);
}

interface StepIndicatorProps {
  currentStep: AppStep;
  onStepClick?: (step: AppStep) => void;
}

export function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  const currentIdx = stepIndex(currentStep);

  return (
    <nav
      className="flex items-center justify-center"
      aria-label="Payroll setup progress"
    >
      {STEPS.map((step, idx) => {
        const isComplete = idx < currentIdx;
        const isCurrent = step.id === currentStep;
        const isClickable = isComplete && !!onStepClick;

        return (
          <div key={step.id} className="flex items-center">
            {idx > 0 && (
              <div
                className={cn(
                  'hidden sm:block w-8 lg:w-12 h-0.5 mx-1 rounded-full transition-colors',
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
                'flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg transition-colors min-h-[44px]',
                isClickable && 'hover:bg-muted cursor-pointer',
                !isClickable && 'cursor-default',
                isCurrent && 'bg-primary/10'
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold border-2 transition-colors',
                  isComplete && 'bg-primary border-primary text-primary-foreground',
                  isCurrent && !isComplete && 'border-primary text-primary bg-background',
                  !isComplete && !isCurrent && 'border-border text-muted-foreground bg-background'
                )}
              >
                {isComplete ? <Check className="w-4 h-4" aria-hidden /> : step.number}
              </span>
              <span
                className={cn(
                  'hidden md:inline text-sm font-medium',
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
