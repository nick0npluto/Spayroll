import { useState } from 'react';
import { Users, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmployeeCountPromptProps {
  initialCount?: number;
  onConfirm: (count: number) => void;
}

export function EmployeeCountPrompt({ initialCount = 1, onConfirm }: EmployeeCountPromptProps) {
  const [count, setCount] = useState<number>(initialCount);

  const handleIncrement = () => setCount((c) => Math.min(c + 1, 50));
  const handleDecrement = () => setCount((c) => Math.max(c - 1, 1));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 1;
    setCount(Math.min(Math.max(value, 1), 50));
  };

  return (
    <div className="w-full max-w-md mx-auto step-enter">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-5">
          <Users className="w-7 h-7 text-primary" />
        </div>
        <h2 className="font-display text-2xl sm:text-3xl text-foreground mb-3">
          Team size
        </h2>
        <p className="text-muted-foreground">
          How many employees worked this week?
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={count <= 1}
            className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center
                       hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all min-h-[44px] min-w-[44px]"
            aria-label="Decrease count"
          >
            <Minus className="w-5 h-5" />
          </button>

          <input
            type="number"
            value={count}
            onChange={handleInputChange}
            min={1}
            max={50}
            aria-label="Number of employees"
            className="w-24 h-16 text-center text-3xl font-bold bg-input border border-border 
                       rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary
                       [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
                       [&::-webkit-inner-spin-button]:appearance-none"
          />

          <button
            type="button"
            onClick={handleIncrement}
            disabled={count >= 50}
            className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center
                       hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all min-h-[44px] min-w-[44px]"
            aria-label="Increase count"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground mb-6">
          You&apos;ll enter payroll for <strong className="text-foreground">{count}</strong>{' '}
          employee{count !== 1 ? 's' : ''}
        </p>

        <Button
          onClick={() => onConfirm(count)}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg rounded-xl"
        >
          Continue to payroll
        </Button>
      </div>
    </div>
  );
}
