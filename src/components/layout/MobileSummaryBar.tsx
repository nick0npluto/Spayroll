import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileSummaryBarProps {
  label: string;
  value: string;
  children: React.ReactNode;
}

export function MobileSummaryBar({ label, value, children }: MobileSummaryBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur-xl shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.15)]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 min-h-[52px]"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">{value}</span>
          {open ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          )}
        </span>
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 border-t border-border',
          open ? 'max-h-[70vh] overflow-y-auto' : 'max-h-0'
        )}
      >
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
