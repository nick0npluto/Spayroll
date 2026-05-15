import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { LocationProfile } from '@/types/payroll';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LocationSettingsModalProps {
  location: LocationProfile;
  open: boolean;
  onSave: (location: LocationProfile) => void;
  onClose: () => void;
}

export function LocationSettingsModal({
  location,
  open,
  onSave,
  onClose,
}: LocationSettingsModalProps) {
  const [standardRate, setStandardRate] = useState(location.standardRate.toString());
  const [premiumRate, setPremiumRate] = useState(location.premiumRate.toString());
  const [customSatRate, setCustomSatRate] = useState(
    location.customSaturdayRunnerRate?.toString() ?? ''
  );

  useEffect(() => {
    setStandardRate(location.standardRate.toString());
    setPremiumRate(location.premiumRate.toString());
    setCustomSatRate(location.customSaturdayRunnerRate?.toString() ?? '');
  }, [location]);

  const handleSave = () => {
    onSave({
      ...location,
      standardRate: parseFloat(standardRate) || 0,
      premiumRate: parseFloat(premiumRate) || 0,
      customSaturdayRunnerRate: customSatRate ? parseFloat(customSatRate) : null,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{location.name} pay rates</DialogTitle>
          <DialogDescription>
            Standard and premium hourly rates for this location.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div>
            <label htmlFor="standard-rate" className="block text-sm font-medium mb-2">
              Standard hourly rate
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <input
                id="standard-rate"
                type="number"
                step="0.01"
                min="0"
                value={standardRate}
                onChange={(e) => setStandardRate(e.target.value)}
                className="input-premium w-full pl-8"
                placeholder="12.00"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Runners on Sunday–Friday</p>
          </div>

          <div>
            <label htmlFor="premium-rate" className="block text-sm font-medium mb-2">
              Premium hourly rate
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <input
                id="premium-rate"
                type="number"
                step="0.01"
                min="0"
                value={premiumRate}
                onChange={(e) => setPremiumRate(e.target.value)}
                className="input-premium w-full pl-8"
                placeholder="15.00"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Managers and premium runners</p>
          </div>

          <div>
            <label htmlFor="sat-rate" className="block text-sm font-medium mb-2">
              Default Saturday runner rate <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <input
                id="sat-rate"
                type="number"
                step="0.01"
                min="0"
                value={customSatRate}
                onChange={(e) => setCustomSatRate(e.target.value)}
                className="input-premium w-full pl-8"
                placeholder="Leave blank for premium"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            <Save className="w-4 h-4 mr-2" />
            Save rates
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
