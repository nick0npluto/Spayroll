import React from 'react';
import { MapPin, Settings } from 'lucide-react';
import { LocationProfile, LocationId } from '@/types/payroll';
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
};

export function LocationSelector({
  locations,
  selectedLocation,
  onSelect,
  onEditSettings,
}: LocationSelectorProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <MapPin className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Select Location
        </h1>
        <p className="text-muted-foreground text-lg">
          Choose the valet location for this week's payroll
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {locations.map((location, index) => (
          <div
            key={location.id}
            className={cn(
              'location-card relative group',
              selectedLocation?.id === location.id && 'location-card-selected'
            )}
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => onSelect(location)}
          >
            {/* Settings button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditSettings(location);
              }}
              className="absolute top-4 right-4 p-2 rounded-lg bg-muted/50 opacity-0 group-hover:opacity-100 
                         transition-all duration-200 hover:bg-muted"
              title="Edit pay rates"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Location content */}
            <div className="text-center">
              <span className="text-4xl mb-4 block">
                {locationIcons[location.id]}
              </span>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {location.name}
              </h3>
              
              {/* Pay rates preview */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Standard Rate</span>
                  <span className="text-foreground font-medium">
                    ${location.standardRate}/hr
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Premium Rate</span>
                  <span className="text-foreground font-medium">
                    ${location.premiumRate}/hr
                  </span>
                </div>
                {location.customSaturdayRunnerRate && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Sat Runner Rate</span>
                    <span className="text-foreground font-medium">
                      ${location.customSaturdayRunnerRate}/hr
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Selection indicator */}
            {selectedLocation?.id === location.id && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
