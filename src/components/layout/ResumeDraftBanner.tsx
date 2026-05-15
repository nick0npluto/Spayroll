import { Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PayrollDraft } from '@/hooks/usePayrollDraft';

interface ResumeDraftBannerProps {
  draft: PayrollDraft;
  onResume: () => void;
  onDismiss: () => void;
}

export function ResumeDraftBanner({ draft, onResume, onDismiss }: ResumeDraftBannerProps) {
  const savedDate = draft.savedAt
    ? new Date(draft.savedAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'recently';

  return (
    <div
      role="alert"
      className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center gap-4 step-enter"
    >
      <div className="flex items-start gap-3 flex-1">
        <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">Resume your last payroll?</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {draft.selectedLocation?.name ?? 'In progress'} · saved {savedDate}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button onClick={onResume} size="sm" className="bg-primary hover:bg-primary/90">
          Resume
        </Button>
        <Button variant="ghost" size="sm" onClick={onDismiss} aria-label="Dismiss">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
