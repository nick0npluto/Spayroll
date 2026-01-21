import React, { useState } from 'react';
import { Users, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmployeeCountPromptProps {
  onConfirm: (count: number) => void;
}

export function EmployeeCountPrompt({ onConfirm }: EmployeeCountPromptProps) {
  const [count, setCount] = useState<number>(1);

  const handleIncrement = () => setCount((c) => Math.min(c + 1, 50));
  const handleDecrement = () => setCount((c) => Math.max(c - 1, 1));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setCount(Math.min(Math.max(value, 1), 50));
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">
          How many employees worked this week?
        </h2>
        <p className="text-muted-foreground">
          Enter the number of employees to generate entry rows
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8">
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={handleDecrement}
            disabled={count <= 1}
            className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center
                       hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all"
          >
            <Minus className="w-5 h-5" />
          </button>

          <input
            type="number"
            value={count}
            onChange={handleInputChange}
            min={1}
            max={50}
            className="w-24 h-16 text-center text-3xl font-bold bg-input border border-border 
                       rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent
                       [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
                       [&::-webkit-inner-spin-button]:appearance-none"
          />

          <button
            onClick={handleIncrement}
            disabled={count >= 50}
            className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center
                       hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground mb-6">
          {count} employee{count !== 1 ? 's' : ''} will be added
        </p>

        <Button
          onClick={() => onConfirm(count)}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg rounded-xl"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
