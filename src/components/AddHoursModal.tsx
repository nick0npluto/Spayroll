import React, { useState, useEffect } from 'react';
import { X, Plus, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimeEntry {
  id: string;
  hours: string;
  minutes: string;
}

interface AddHoursModalProps {
  onUseTotal: (totalHours: number) => void;
  onClose: () => void;
  title?: string;
}

export function AddHoursModal({ onUseTotal, onClose, title = 'Add Hours' }: AddHoursModalProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([
    { id: '1', hours: '', minutes: '' },
    { id: '2', hours: '', minutes: '' },
  ]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const addRow = () => {
    setEntries([...entries, { id: Date.now().toString(), hours: '', minutes: '' }]);
  };

  const removeRow = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter((e) => e.id !== id));
    }
  };

  const updateEntry = (id: string, field: 'hours' | 'minutes', value: string) => {
    // Only allow valid numbers
    const numValue = value.replace(/[^0-9]/g, '');
    
    // Limit minutes to 59
    if (field === 'minutes' && parseInt(numValue) > 59) {
      return;
    }
    
    setEntries(
      entries.map((e) => (e.id === id ? { ...e, [field]: numValue } : e))
    );
  };

  const calculateTotal = (): number => {
    return entries.reduce((total, entry) => {
      const hours = parseInt(entry.hours) || 0;
      const minutes = parseInt(entry.minutes) || 0;
      return total + hours + minutes / 60;
    }, 0);
  };

  const formatTotalDisplay = (): string => {
    const total = calculateTotal();
    const hours = Math.floor(total);
    const minutes = Math.round((total - hours) * 60);
    
    if (minutes === 0) {
      return `${hours}h 0m`;
    }
    return `${hours}h ${minutes}m`;
  };

  const handleUseTotal = () => {
    const total = calculateTotal();
    onUseTotal(Math.round(total * 100) / 100);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div
          className="modal-content animate-scale-in max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Add multiple time entries to calculate total hours
          </p>

          {/* Time entries */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[40vh]">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-sm text-muted-foreground w-6">
                  {index + 1}.
                </span>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={entry.hours}
                    onChange={(e) => updateEntry(entry.id, 'hours', e.target.value)}
                    placeholder="0"
                    className="numeric-input w-16"
                  />
                  <span className="text-muted-foreground text-sm">h</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={entry.minutes}
                    onChange={(e) => updateEntry(entry.id, 'minutes', e.target.value)}
                    placeholder="00"
                    className="numeric-input w-16"
                  />
                  <span className="text-muted-foreground text-sm">m</span>
                </div>
                {entries.length > 1 && (
                  <button
                    onClick={() => removeRow(entry.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add row button */}
          <button
            onClick={addRow}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-dashed 
                       border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground
                       hover:text-primary mb-4"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add another row</span>
          </button>

          {/* Total */}
          <div className="bg-surface-elevated rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Hours</span>
              <span className="text-2xl font-bold text-primary">
                {formatTotalDisplay()}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {calculateTotal().toFixed(2)} hours (decimal)
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUseTotal}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Use Total
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
