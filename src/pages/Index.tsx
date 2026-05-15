import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Plus, Minus, Download, Settings, Users, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
  LocationProfile,
  Employee,
  DEFAULT_LOCATIONS,
  ProminenceMetrics,
} from '@/types/payroll';
import { generateUniqueId } from '@/utils/payrollCalculations';
import { ImportedData } from '@/utils/exportUtils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  usePayrollDraft,
  type AppStep,
  type PayrollDraft,
} from '@/hooks/usePayrollDraft';
import { AppShell } from '@/components/layout/AppShell';
import { ResumeDraftBanner } from '@/components/layout/ResumeDraftBanner';
import { MobileSummaryBar } from '@/components/layout/MobileSummaryBar';
import { LocationSelector } from '@/components/LocationSelector';
import { LocationSettingsModal } from '@/components/LocationSettingsModal';
import { EmployeeCountPrompt } from '@/components/EmployeeCountPrompt';
import { EmployeeCard } from '@/components/EmployeeCard';
import { PayrollSummary } from '@/components/PayrollSummary';
import { ExportModal } from '@/components/ExportModal';
import { WeekHeader } from '@/components/WeekHeader';
import { Button } from '@/components/ui/button';
import { ProminencePayoutPanel } from '@/components/ProminencePayoutPanel';
import {
  calculateProminenceTotals,
  createDefaultProminenceMetrics,
} from '@/utils/prominenceCalculations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTheme } from 'next-themes';
import { formatCurrency } from '@/utils/payrollCalculations';

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
    useCustomManagerSaturdayRate: false,
    managerSaturdayRate: null,
    actualPaid: null,
  };
}

function calculateCashTotal(input: string): number {
  if (!input.trim()) return 0;
  return input
    .split(',')
    .map((val) => {
      const cleaned = val.trim().replace(/^\$/, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    })
    .reduce((sum, num) => sum + num, 0);
}

const Index = () => {
  const { theme, setTheme } = useTheme();
  const [locations, setLocations] = useLocalStorage<LocationProfile[]>(
    'payroll-locations',
    DEFAULT_LOCATIONS
  );

  const {
    draft,
    updateDraft,
    resetDraft,
    pendingResume,
    resumeDraft,
    dismissResume,
    hasCheckedStorage,
  } = usePayrollDraft();

  const [settingsLocation, setSettingsLocation] = useState<LocationProfile | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [confirmStep, setConfirmStep] = useState<AppStep | null>(null);

  const step = draft.step;
  const selectedLocation = draft.selectedLocation;
  const employees = draft.employees;
  const expenses = draft.expenses;
  const weekLabel = draft.weekLabel;
  const cashForWeek = draft.cashForWeek;
  const prominenceMetrics = draft.prominenceMetrics;

  useEffect(() => {
    setLocations((prev) => {
      const existingIds = new Set(prev.map((l) => l.id));
      const missingDefaults = DEFAULT_LOCATIONS.filter((l) => !existingIds.has(l.id));
      return missingDefaults.length === 0 ? prev : [...prev, ...missingDefaults];
    });
  }, [setLocations]);

  const patchDraft = useCallback(
    (partial: Partial<PayrollDraft>) => {
      updateDraft((prev) => ({ ...prev, ...partial }));
    },
    [updateDraft]
  );

  const handleLocationSelect = (location: LocationProfile) => {
    patchDraft({
      selectedLocation: location,
      step: 'count',
      employees: [],
      prominenceMetrics: createDefaultProminenceMetrics(),
    });
  };

  const handleLocationSettingsSave = (updatedLocation: LocationProfile) => {
    setLocations((prev) =>
      prev.map((loc) => (loc.id === updatedLocation.id ? updatedLocation : loc))
    );
    if (selectedLocation?.id === updatedLocation.id) {
      patchDraft({ selectedLocation: updatedLocation });
    }
    toast.success('Pay rates updated');
  };

  const handleEmployeeCountConfirm = (count: number) => {
    if (!selectedLocation) return;

    if (employees.length === count) {
      patchDraft({ step: 'payroll' });
      return;
    }

    const newEmployees: Employee[] = Array.from({ length: count }, (_, i) =>
      employees[i] ? { ...employees[i] } : createEmployee(selectedLocation)
    );
    patchDraft({ employees: newEmployees, step: 'payroll' });
  };

  const handleEmployeeUpdate = useCallback(
    (updatedEmployee: Employee) => {
      updateDraft((prev) => ({
        ...prev,
        employees: prev.employees.map((emp) =>
          emp.id === updatedEmployee.id ? updatedEmployee : emp
        ),
      }));
    },
    [updateDraft]
  );

  const handleEmployeeDelete = useCallback(
    (id: string) => {
      updateDraft((prev) => ({
        ...prev,
        employees: prev.employees.filter((emp) => emp.id !== id),
      }));
    },
    [updateDraft]
  );

  const handleAddEmployee = () => {
    if (!selectedLocation) return;
    updateDraft((prev) => ({
      ...prev,
      employees: [...prev.employees, createEmployee(selectedLocation)],
    }));
  };

  const handleRemoveLastEmployee = () => {
    if (employees.length > 1) {
      updateDraft((prev) => ({
        ...prev,
        employees: prev.employees.slice(0, -1),
      }));
    }
  };

  const goToStep = (target: AppStep) => {
    if (target === step) return;

    if (step === 'payroll' && employees.some((e) => e.name || e.sunFriHours > 0)) {
      setConfirmStep(target);
      return;
    }

    applyStep(target);
  };

  const applyStep = (target: AppStep) => {
    if (target === 'location') {
      patchDraft({
        step: 'location',
        selectedLocation: null,
        employees: [],
      });
    } else if (target === 'count') {
      patchDraft({ step: 'count' });
    } else {
      patchDraft({ step: 'payroll' });
    }
    setConfirmStep(null);
  };

  const handleBack = () => {
    if (step === 'payroll') goToStep('count');
    else if (step === 'count') goToStep('location');
  };

  const handleStartOver = () => {
    resetDraft();
    toast.info('Started a new payroll');
  };

  const handleImport = (data: ImportedData) => {
    const matchingLocation = locations.find((loc) => loc.id === data.location.id);

    if (matchingLocation) {
      patchDraft({ selectedLocation: matchingLocation });
    } else {
      setLocations((prev) => [...prev, data.location]);
      patchDraft({ selectedLocation: data.location });
    }

    patchDraft({
      employees: data.employees,
      expenses: data.expenses,
      weekLabel: data.weekLabel,
      cashForWeek: data.cashForWeek ?? '',
      prominenceMetrics: data.locationMetrics ?? createDefaultProminenceMetrics(),
      step: 'payroll',
    });
    toast.success('Payroll imported successfully');
  };

  const handleResume = () => {
    resumeDraft();
    toast.success('Draft restored');
  };

  const cashTotal = calculateCashTotal(cashForWeek);
  const prominenceTotals = useMemo(
    () =>
      selectedLocation?.id === 'prominence'
        ? calculateProminenceTotals(prominenceMetrics, employees)
        : null,
    [selectedLocation, prominenceMetrics, employees]
  );

  const actualPayment = employees.reduce((sum, emp) => sum + (emp.actualPaid ?? 0), 0);
  const summaryValue = prominenceTotals
    ? formatCurrency(actualPayment)
    : formatCurrency(actualPayment);

  const summaryPanel =
    selectedLocation && step === 'payroll' ? (
      <PayrollSummary
        employees={employees}
        location={selectedLocation}
        expenses={expenses}
        onExpensesChange={(v) => patchDraft({ expenses: v })}
        prominenceTotals={prominenceTotals}
      />
    ) : null;

  const headerActions =
    step === 'payroll' && selectedLocation ? (
      <>
        {selectedLocation.id !== 'prominence' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsLocation(selectedLocation)}
          >
            <Settings className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Rates</span>
          </Button>
        )}
        <Button
          size="sm"
          onClick={() => setShowExportModal(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Download className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </>
    ) : null;

  return (
  <>
    <AppShell
      step={step}
      locationName={selectedLocation?.name}
      showBack={step !== 'location'}
      onBack={handleBack}
      onStepClick={goToStep}
      theme={theme}
      onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      headerActions={headerActions}
      sidebar={summaryPanel}
    >
      {hasCheckedStorage && pendingResume && step === 'location' && (
        <ResumeDraftBanner
          draft={pendingResume}
          onResume={handleResume}
          onDismiss={dismissResume}
        />
      )}

      {step === 'location' && (
        <div className="step-enter">
          <LocationSelector
            locations={locations}
            selectedLocation={selectedLocation}
            onSelect={handleLocationSelect}
            onEditSettings={setSettingsLocation}
          />
        </div>
      )}

      {step === 'count' && selectedLocation && (
        <EmployeeCountPrompt
          initialCount={employees.length || 1}
          onConfirm={handleEmployeeCountConfirm}
        />
      )}

      {step === 'payroll' && selectedLocation && (
        <div className="space-y-6 pb-24 lg:pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl text-foreground">Employee payroll</h2>
                <p className="text-sm text-muted-foreground">
                  {employees.length} employee{employees.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveLastEmployee}
                disabled={employees.length <= 1}
              >
                <Minus className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Remove</span>
              </Button>
              <Button size="sm" onClick={handleAddEmployee} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Add</span>
              </Button>
            </div>
          </div>

          <WeekHeader
            weekLabel={weekLabel}
            onWeekLabelChange={(v) => patchDraft({ weekLabel: v })}
            location={selectedLocation}
            cashForWeek={cashForWeek}
            onCashForWeekChange={(v) => patchDraft({ cashForWeek: v })}
            cashTotal={cashTotal}
          />

          {selectedLocation.id === 'prominence' ? (
            <ProminencePayoutPanel
              employees={employees}
              metrics={prominenceMetrics}
              onMetricsChange={(m) => patchDraft({ prominenceMetrics: m })}
            />
          ) : null}

          <div className="grid grid-cols-1 gap-4">
            {employees.map((employee, index) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                location={selectedLocation}
                index={index}
                prominenceTipOutPerHour={prominenceTotals?.tipOutPerManHour ?? 0}
                onUpdate={handleEmployeeUpdate}
                onDelete={handleEmployeeDelete}
              />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={handleStartOver} className="sm:w-auto">
              <RotateCcw className="w-4 h-4 mr-2" />
              Start over
            </Button>
          </div>
        </div>
      )}
    </AppShell>

    {step === 'payroll' && selectedLocation && summaryPanel && (
      <MobileSummaryBar label="Week totals" value={summaryValue}>
        {summaryPanel}
      </MobileSummaryBar>
    )}

    {settingsLocation && (
      <LocationSettingsModal
        location={settingsLocation}
        open={!!settingsLocation}
        onSave={handleLocationSettingsSave}
        onClose={() => setSettingsLocation(null)}
      />
    )}

    {showExportModal && selectedLocation && (
      <ExportModal
        open={showExportModal}
        data={{
          location: selectedLocation,
          employees,
          expenses,
          weekLabel,
          cashForWeek,
          roundedPayment: actualPayment,
          locationMetrics:
            selectedLocation.id === 'prominence' ? prominenceMetrics : undefined,
        }}
        onClose={() => setShowExportModal(false)}
        onImport={handleImport}
      />
    )}

    <AlertDialog open={!!confirmStep} onOpenChange={() => setConfirmStep(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave payroll step?</AlertDialogTitle>
          <AlertDialogDescription>
            You have entered employee data. Going back will keep your entries, but confirm you want to
            change steps.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay</AlertDialogCancel>
          <AlertDialogAction onClick={() => confirmStep && applyStep(confirmStep)}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
};

export default Index;
