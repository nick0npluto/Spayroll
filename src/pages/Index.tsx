import React, { useState, useCallback } from 'react';
import { ArrowLeft, Plus, Minus, Save, Settings, Users } from 'lucide-react';
import { LocationProfile, Employee, DEFAULT_LOCATIONS, LocationId } from '@/types/payroll';
import { generateUniqueId } from '@/utils/payrollCalculations';
import { ImportedData } from '@/utils/exportUtils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LocationSelector } from '@/components/LocationSelector';
import { LocationSettingsModal } from '@/components/LocationSettingsModal';
import { EmployeeCountPrompt } from '@/components/EmployeeCountPrompt';
import { EmployeeCard } from '@/components/EmployeeCard';
import { PayrollSummary } from '@/components/PayrollSummary';
import { ExportModal } from '@/components/ExportModal';
import { Button } from '@/components/ui/button';

type AppStep = 'location' | 'count' | 'payroll';

function createEmployee(location: LocationProfile): Employee {
  return {
    id: generateUniqueId(),
    name: '',
    role: 'runner',
    basePayType: 'standard',
    sunFriHours: 0,
    saturdayWorked: false,
    saturdayHours: 0,
    saturdayRate: location.customSaturdayRunnerRate,
    actualPaid: null,
  };
}

const Index = () => {
  // Persist locations with their custom rates
  const [locations, setLocations] = useLocalStorage<LocationProfile[]>(
    'payroll-locations',
    DEFAULT_LOCATIONS
  );

  // App state
  const [step, setStep] = useState<AppStep>('location');
  const [selectedLocation, setSelectedLocation] = useState<LocationProfile | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [expenses, setExpenses] = useState<number>(0);
  const [weekLabel, setWeekLabel] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `WeekOf_${year}-${month}-${day}`;
  });
  const [cashForWeek, setCashForWeek] = useState<string>('');

  // Modal states
  const [settingsLocation, setSettingsLocation] = useState<LocationProfile | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Handlers
  const handleLocationSelect = (location: LocationProfile) => {
    setSelectedLocation(location);
    setStep('count');
  };

  const handleLocationSettingsSave = (updatedLocation: LocationProfile) => {
    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === updatedLocation.id ? updatedLocation : loc
      )
    );
    // Update selected location if it's the one being edited
    if (selectedLocation?.id === updatedLocation.id) {
      setSelectedLocation(updatedLocation);
    }
  };

  const handleEmployeeCountConfirm = (count: number) => {
    if (!selectedLocation) return;
    
    const newEmployees: Employee[] = Array.from({ length: count }, () =>
      createEmployee(selectedLocation)
    );
    setEmployees(newEmployees);
    setStep('payroll');
  };

  const handleEmployeeUpdate = useCallback((updatedEmployee: Employee) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === updatedEmployee.id ? updatedEmployee : emp
      )
    );
  }, []);

  const handleEmployeeDelete = useCallback((id: string) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
  }, []);

  const handleAddEmployee = () => {
    if (!selectedLocation) return;
    setEmployees((prev) => [...prev, createEmployee(selectedLocation)]);
  };

  const handleRemoveLastEmployee = () => {
    if (employees.length > 1) {
      setEmployees((prev) => prev.slice(0, -1));
    }
  };

  const handleBack = () => {
    if (step === 'payroll') {
      setStep('count');
    } else if (step === 'count') {
      setStep('location');
      setSelectedLocation(null);
    }
  };

  const handleStartOver = () => {
    setStep('location');
    setSelectedLocation(null);
    setEmployees([]);
    setExpenses(0);
  };

  const handleImport = (data: ImportedData) => {
    // Find matching location or use the imported one
    const matchingLocation = locations.find((loc) => loc.id === data.location.id);
    
    if (matchingLocation) {
      setSelectedLocation(matchingLocation);
    } else {
      // Add the imported location to our list
      setLocations((prev) => [...prev, data.location]);
      setSelectedLocation(data.location);
    }
    
    setEmployees(data.employees);
    setExpenses(data.expenses);
    setWeekLabel(data.weekLabel);
    setStep('payroll');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {step !== 'location' && (
                <button
                  onClick={handleBack}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  Spayroll+
                </h1>
                {selectedLocation && (
                  <p className="text-xs text-muted-foreground">
                    {selectedLocation.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {step === 'payroll' && selectedLocation && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSettingsLocation(selectedLocation)}
                    className="hidden sm:flex"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Rates
                  </Button>
                  <Button
                    onClick={() => setShowExportModal(true)}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save / Export
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step 1: Location Selection */}
        {step === 'location' && (
          <div className="animate-fade-in">
            <LocationSelector
              locations={locations}
              selectedLocation={selectedLocation}
              onSelect={handleLocationSelect}
              onEditSettings={setSettingsLocation}
            />
          </div>
        )}

        {/* Step 2: Employee Count */}
        {step === 'count' && selectedLocation && (
          <div className="animate-fade-in">
            <EmployeeCountPrompt onConfirm={handleEmployeeCountConfirm} />
          </div>
        )}

        {/* Step 3: Payroll Entry */}
        {step === 'payroll' && selectedLocation && (
          <div className="animate-fade-in space-y-8">
            {/* Employee count controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Employee Payroll
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {employees.length} employee{employees.length !== 1 ? 's' : ''} • {weekLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRemoveLastEmployee}
                  disabled={employees.length <= 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted 
                             hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all text-sm font-medium"
                >
                  <Minus className="w-4 h-4" />
                  <span className="hidden sm:inline">Remove</span>
                </button>
                <button
                  onClick={handleAddEmployee}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary 
                             hover:bg-primary/90 text-primary-foreground transition-all text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Employee</span>
                </button>
              </div>
            </div>

            {/* Week label input */}
            <div className="max-w-md">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Week Label
              </label>
              <input
                type="text"
                value={weekLabel}
                onChange={(e) => setWeekLabel(e.target.value)}
                placeholder="e.g., WeekOf_2026-01-14"
                className="input-premium w-full text-sm"
              />
            </div>

            {/* Cash for the week input */}
            <div className="max-w-md">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Cash for the Week
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={cashForWeek}
                  onChange={(e) => setCashForWeek(e.target.value)}
                  placeholder="$Mon, $Tue, $Wed, $Thur, $Fri, $Sat, $Sun"
                  className="input-premium w-full text-sm"
                />
                <span className="text-muted-foreground font-medium whitespace-nowrap">
                  Total: ${cashForWeek
                    .split(',')
                    .map(v => parseFloat(v.replace(/[^0-9.-]/g, '')) || 0)
                    .reduce((sum, n) => sum + n, 0)
                    .toFixed(2)}
                </span>
            </div>
            </div>

            {/* Employee cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {employees.map((employee, index) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  location={selectedLocation}
                  index={index}
                  onUpdate={handleEmployeeUpdate}
                  onDelete={handleEmployeeDelete}
                />
              ))}
            </div>

            {/* Summary */}
            <PayrollSummary
              employees={employees}
              location={selectedLocation}
              expenses={expenses}
              onExpensesChange={setExpenses}
            />

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleStartOver}
                className="flex-1 sm:flex-none"
              >
                Start Over
              </Button>
              <Button
                onClick={() => setShowExportModal(true)}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                <Save className="w-4 h-4 mr-2" />
                Save & Export Payroll
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {settingsLocation && (
        <LocationSettingsModal
          location={settingsLocation}
          onSave={handleLocationSettingsSave}
          onClose={() => setSettingsLocation(null)}
        />
      )}

      {showExportModal && selectedLocation && (
        <ExportModal
          data={{
            location: selectedLocation,
            employees,
            expenses,
            weekLabel,
            roundedPayment: employees.reduce((sum, emp) => sum + (emp.actualPaid ?? 0), 0),
          }}
          onClose={() => setShowExportModal(false)}
          onImport={handleImport}
        />
      )}
    </div>
  );
};

export default Index;
