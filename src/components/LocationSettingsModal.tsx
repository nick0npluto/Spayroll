import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { LocationProfile } from '@/types/payroll';
import { Button } from '@/components/ui/button';

interface LocationSettingsModalProps {
  location: LocationProfile;
  onSave: (location: LocationProfile) => void;
  onClose: () => void;
}

export function LocationSettingsModal({
  location,
  onSave,
  onClose,
}: LocationSettingsModalProps) {
  const [standardRate, setStandardRate] = useState(location.standardRate.toString());
  const [premiumRate, setPremiumRate] = useState(location.premiumRate.toString());
  const [customSatRate, setCustomSatRate] = useState(
    location.customSaturdayRunnerRate?.toString() ?? ''
  );

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSave = () => {
    const updatedLocation: LocationProfile = {
      ...location,
      standardRate: parseFloat(standardRate) || 0,
      premiumRate: parseFloat(premiumRate) || 0,
      customSaturdayRunnerRate: customSatRate ? parseFloat(customSatRate) : null,
    };
    onSave(updatedLocation);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div
          className="modal-content animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              {location.name} Pay Rates
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* Standard Rate */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Standard Hourly Rate
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={standardRate}
                  onChange={(e) => setStandardRate(e.target.value)}
                  className="input-premium w-full pl-8"
                  placeholder="12.00"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Used for Runners on Sunday–Friday
              </p>
            </div>

            {/* Premium Rate */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Premium Hourly Rate
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={premiumRate}
                  onChange={(e) => setPremiumRate(e.target.value)}
                  className="input-premium w-full pl-8"
                  placeholder="15.00"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Used for Managers (always) and Runners (when selected)
              </p>
            </div>

            {/* Custom Saturday Runner Rate */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Default Saturday Runner Rate
                <span className="text-muted-foreground font-normal ml-2">(Optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={customSatRate}
                  onChange={(e) => setCustomSatRate(e.target.value)}
                  className="input-premium w-full pl-8"
                  placeholder="Leave blank to use premium rate"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pre-fills Saturday rate for Runners (can override per employee)
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Rates
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
