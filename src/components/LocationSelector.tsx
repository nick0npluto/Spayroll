import { MapPin, Settings } from 'lucide-react';
import { LocationProfile, LocationId, isAriaVillage } from '@/types/payroll';
import { cn } from '@/lib/utils';

interface LocationSelectorProps {
  locations: LocationProfile[];
  selectedLocation: LocationProfile | null;
  onSelect: (location: LocationProfile) => void;
  onEditSettings: (location: LocationProfile) => void;
}

const locationIcons: Record<LocationId, string> = {
  'rock-steady': '🎸',
  'the-optimist': '☀️',
  'aria-village': '🏘️',
  'kain-tracker': '💰',
};

export function LocationSelector({
  locations,
  selectedLocation,
  onSelect,
  onEditSettings,
}: LocationSelectorProps) {
  return (
    <div className="w-full max-w-5xl mx-auto step-enter">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-5">
          <MapPin className="w-7 h-7 text-primary" />
        </div>
        <h2 className="font-display text-3xl sm:text-4xl text-foreground mb-3">
          Select location
        </h2>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Choose the valet site for this week&apos;s payroll
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {locations.map((location, index) => {
          const isSelected = selectedLocation?.id === location.id;
          const isKainTracker = location.id === 'kain-tracker';
          const isAria = isAriaVillage(location);

          return (
            <article
              key={location.id}
              className={cn(
                'location-card stagger-fade-in',
                isSelected && 'location-card-selected'
              )}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {!isKainTracker && !isAria && (
                <button
                  type="button"
                  onClick={() => onEditSettings(location)}
                  className="absolute top-3 right-3 p-2.5 rounded-lg bg-muted/80 hover:bg-muted border border-border/50 min-h-[44px] min-w-[44px] flex items-center justify-center z-10"
                  title="Edit pay rates"
                  aria-label={`Edit rates for ${location.name}`}
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </button>
              )}

              <button
                type="button"
                className="w-full text-left pt-1"
                onClick={() => onSelect(location)}
              >
                <span className="text-4xl mb-3 block" aria-hidden>
                  {locationIcons[location.id]}
                </span>
                <h3 className="font-display text-xl text-foreground mb-1 pr-10">
                  {location.name}
                </h3>

                {isKainTracker ? (
                  <p className="text-sm text-muted-foreground">
                    <span className="text-primary font-medium">Personal earnings</span>
                    {' · '}track shifts, cash, and online tips
                  </p>
                ) : isAria ? (
                  <p className="text-sm text-muted-foreground mt-3">
                    <span className="text-primary font-medium">Tip-pool payroll</span>
                    {' · '}daily hours, cash counter, and custom hourly overrides
                  </p>
                ) : (
                  <dl className="space-y-1.5 text-sm mt-3">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Standard</dt>
                      <dd className="font-semibold text-foreground">${location.standardRate}/hr</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Premium</dt>
                      <dd className="font-semibold text-foreground">${location.premiumRate}/hr</dd>
                    </div>
                    {location.customSaturdayRunnerRate != null && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Sat runner</dt>
                        <dd className="font-semibold text-foreground">
                          ${location.customSaturdayRunnerRate}/hr
                        </dd>
                      </div>
                    )}
                  </dl>
                )}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
