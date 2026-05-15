import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StepIndicator, PAYROLL_STEPS } from '@/components/layout/StepIndicator';
import type { AppStep } from '@/hooks/usePayrollDraft';
import { cn } from '@/lib/utils';

interface AppShellProps {
  step: AppStep;
  locationName?: string;
  showBack?: boolean;
  onBack?: () => void;
  onStepClick?: (step: AppStep) => void;
  theme?: string;
  onThemeToggle?: () => void;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  steps?: typeof PAYROLL_STEPS;
}

export function AppShell({
  step,
  locationName,
  showBack = false,
  onBack,
  onStepClick,
  theme,
  onThemeToggle,
  headerActions,
  children,
  sidebar,
  steps = PAYROLL_STEPS,
}: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {showBack && onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="p-2.5 rounded-lg hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="min-w-0">
                <h1 className="font-display text-lg sm:text-xl text-foreground leading-tight truncate">
                  Spayroll
                </h1>
                {locationName && (
                  <p className="text-xs text-muted-foreground truncate">{locationName}</p>
                )}
              </div>
            </div>

            <div className="hidden sm:flex flex-1 justify-center max-w-md mx-4">
              <StepIndicator currentStep={step} onStepClick={onStepClick} steps={steps} />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
              {onThemeToggle && (
                <Button variant="outline" size="sm" onClick={onThemeToggle} aria-label="Toggle theme">
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>

          <div className="sm:hidden pb-3">
            <StepIndicator currentStep={step} onStepClick={onStepClick} steps={steps} />
          </div>
        </div>
      </header>

      <div
        className={cn(
          'flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
          sidebar && 'lg:grid lg:grid-cols-[1fr_340px] lg:gap-8 lg:items-start'
        )}
      >
        <main className="min-w-0">{children}</main>
        {sidebar && (
          <aside className="hidden lg:block lg:sticky lg:top-24 space-y-4">{sidebar}</aside>
        )}
      </div>
    </div>
  );
}
