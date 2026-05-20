import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Plus, Minus, Download, Settings, Users, RotateCcw, Save, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  LocationProfile,
  Employee,
  DEFAULT_LOCATIONS,
  isKainTracker,
  isAriaVillage,
  migrateLocationProfile,
} from '@/types/payroll';
import {
  KainShift,
  KainEarningsRecord,
  createEmptyKainShift,
  createDefaultRecordLabel,
  validateKainShiftsForSave,
} from '@/types/kainTracker';
import { exportKainHistoryToPDF, exportKainRecordToPDF } from '@/utils/kainHistoryPdf';
import { useKainHistory } from '@/hooks/useKainHistory';
import { KainHistoryPanel } from '@/components/KainHistoryPanel';
import { KainRecordHeader } from '@/components/KainRecordHeader';
import { KAIN_STEPS } from '@/components/layout/StepIndicator';
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
import { ShiftCountPrompt } from '@/components/ShiftCountPrompt';
import { EmployeeCard } from '@/components/EmployeeCard';
import { AriaEmployeeCard } from '@/components/AriaEmployeeCard';
import { AriaVillagePayoutPanel } from '@/components/AriaVillagePayoutPanel';
import { KainShiftCard } from '@/components/KainShiftCard';
import { PayrollSummary } from '@/components/PayrollSummary';
import { KainShiftSummary } from '@/components/KainShiftSummary';
import { ExportModal } from '@/components/ExportModal';
import { WeekHeader } from '@/components/WeekHeader';
import { Button } from '@/components/ui/button';
import { calculateKainShiftTotals } from '@/utils/kainShiftCalculations';
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
import {
  calculateAriaVillageTotals,
  createDefaultAriaMetrics,
  createEmptyHoursByDay,
} from '@/utils/ariaVillageCalculations';
import { exportAriaPayrollToPDF } from '@/utils/ariaVillagePdf';
import {
  downloadKainHistoryBackup,
  parseKainHistoryBackup,
} from '@/utils/kainHistoryBackup';

function createEmployee(location: LocationProfile): Employee {
  const base: Employee = {
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
  if (isAriaVillage(location)) {
    return {
      ...base,
      hoursByDay: createEmptyHoursByDay(),
      useCustomHourly: false,
      customHourlyRate: null,
    };
  }
  return base;
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

  const kainHistory = useKainHistory();

  const [settingsLocation, setSettingsLocation] = useState<LocationProfile | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [confirmStep, setConfirmStep] = useState<AppStep | null>(null);
  const [pendingImport, setPendingImport] = useState<KainEarningsRecord[] | null>(null);
  const [confirmDeleteRecordId, setConfirmDeleteRecordId] = useState<string | null>(null);

  const step = draft.step;
  const selectedLocation = draft.selectedLocation;
  const employees = draft.employees;
  const kainShifts = draft.kainShifts;
  const kainEditingRecordId = draft.kainEditingRecordId;
  const kainRecordLabel = draft.kainRecordLabel;
  const expenses = draft.expenses;
  const weekLabel = draft.weekLabel;
  const cashForWeek = draft.cashForWeek;
  const ariaMetrics = draft.ariaMetrics;

  const kainMode = isKainTracker(selectedLocation);
  const ariaMode = isAriaVillage(selectedLocation);
  const recordPendingDelete = confirmDeleteRecordId
    ? kainHistory.getRecord(confirmDeleteRecordId)
    : null;

  useEffect(() => {
    setLocations((prev) => {
      const migrated = prev
        .map((loc) => migrateLocationProfile(loc))
        .filter((loc) => (loc.id as string) !== 'prominence');
      const existingIds = new Set(migrated.map((l) => l.id));
      const missingDefaults = DEFAULT_LOCATIONS.filter((l) => !existingIds.has(l.id));
      return missingDefaults.length === 0 ? migrated : [...migrated, ...missingDefaults];
    });
  }, [setLocations]);

  const patchDraft = useCallback(
    (partial: Partial<PayrollDraft>) => {
      updateDraft((prev) => ({ ...prev, ...partial }));
    },
    [updateDraft]
  );

  const handleLocationSelect = (location: LocationProfile) => {
    const isKain = isKainTracker(location);
    patchDraft({
      selectedLocation: location,
      step: isKain ? 'kain-history' : 'count',
      employees: [],
      kainShifts: [],
      kainEditingRecordId: null,
      kainRecordLabel: createDefaultRecordLabel(),
      ...(isAriaVillage(location) ? { ariaMetrics: createDefaultAriaMetrics() } : {}),
    });
    if (isKain) kainHistory.refresh();
  };

  const handleNewKainRecord = () => {
    patchDraft({
      step: 'count',
      kainShifts: [],
      kainEditingRecordId: null,
      kainRecordLabel: createDefaultRecordLabel(),
    });
  };

  const handleOpenKainRecord = (id: string) => {
    const record = kainHistory.getRecord(id);
    if (!record) return;
    patchDraft({
      step: 'payroll',
      kainEditingRecordId: record.id,
      kainRecordLabel: record.label,
      kainShifts: record.shifts.map((s) => ({ ...s })),
    });
  };

  const handleDeleteKainRecord = (id: string) => {
    kainHistory.deleteRecord(id);
    if (kainEditingRecordId === id) {
      patchDraft({
        kainEditingRecordId: null,
        kainShifts: [],
        step: 'kain-history',
      });
    }
    toast.success('Record deleted');
  };

  const handleExportKainRecordPdf = (recordId: string) => {
    const record = kainHistory.getRecord(recordId);
    if (!record) return;
    exportKainRecordToPDF(record);
    toast.success('PDF downloaded');
  };

  const handleExportKainAllPdf = () => {
    if (kainHistory.records.length === 0) {
      toast.error('No records to export');
      return;
    }
    exportKainHistoryToPDF(kainHistory.records);
    toast.success('PDF downloaded');
  };

  const handleExportKainBackup = () => {
    downloadKainHistoryBackup(kainHistory.records);
    toast.success('Backup downloaded');
  };

  const handleImportKainBackup = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseKainHistoryBackup(text);
      if (!parsed) {
        toast.error('Invalid backup file. Use a JSON file from this app.');
        return;
      }
      if (kainHistory.records.length > 0) {
        setPendingImport(parsed);
        return;
      }
      kainHistory.replaceAll(parsed);
      toast.success(`Imported ${parsed.length} record${parsed.length !== 1 ? 's' : ''}`);
    } catch {
      toast.error('Could not read that file');
    }
  };

  const confirmImportKainBackup = () => {
    if (!pendingImport) return;
    kainHistory.replaceAll(pendingImport);
    toast.success(`Imported ${pendingImport.length} record${pendingImport.length !== 1 ? 's' : ''}`);
    setPendingImport(null);
  };

  const handleExportAriaPdf = () => {
    if (!selectedLocation || !ariaMode) return;
    exportAriaPayrollToPDF({
      location: selectedLocation,
      employees,
      weekLabel,
      ariaMetrics,
      actualPayment,
    });
    toast.success('PDF downloaded');
  };

  const handleExportCurrentKainPdf = () => {
    const validationError = validateKainShiftsForSave(kainShifts);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const existing = kainEditingRecordId ? kainHistory.getRecord(kainEditingRecordId) : null;
    const now = new Date().toISOString();
    exportKainRecordToPDF({
      id: kainEditingRecordId ?? 'draft',
      label: kainRecordLabel,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      shifts: kainShifts,
    });
    toast.success('PDF downloaded');
  };

  const handleSaveKainRecord = () => {
    const validationError = validateKainShiftsForSave(kainShifts);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    kainHistory.saveRecord({
      id: kainEditingRecordId,
      label: kainRecordLabel,
      shifts: kainShifts,
    });
    toast.success(kainEditingRecordId ? 'Record updated' : 'Saved to your history');
    patchDraft({
      step: 'kain-history',
      kainEditingRecordId: null,
      kainShifts: [],
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

    const newEmployees: Employee[] = Array.from({ length: count }, (_, i) => {
      if (employees[i]) {
        const emp = { ...employees[i] };
        if (isAriaVillage(selectedLocation) && !emp.hoursByDay) {
          emp.hoursByDay = createEmptyHoursByDay();
          emp.useCustomHourly = emp.useCustomHourly ?? false;
          emp.customHourlyRate = emp.customHourlyRate ?? null;
        }
        return emp;
      }
      return createEmployee(selectedLocation);
    });
    patchDraft({ employees: newEmployees, step: 'payroll' });
  };

  const handleShiftCountConfirm = (count: number) => {
    if (!selectedLocation) return;

    if (kainShifts.length === count) {
      patchDraft({ step: 'payroll' });
      return;
    }

    const newShifts: KainShift[] = Array.from({ length: count }, (_, i) =>
      kainShifts[i]
        ? { ...kainShifts[i] }
        : createEmptyKainShift(generateUniqueId())
    );
    patchDraft({ kainShifts: newShifts, step: 'payroll' });
  };

  const handleKainShiftUpdate = useCallback(
    (updated: KainShift) => {
      updateDraft((prev) => ({
        ...prev,
        kainShifts: prev.kainShifts.map((s) => (s.id === updated.id ? updated : s)),
      }));
    },
    [updateDraft]
  );

  const handleKainShiftDelete = useCallback(
    (id: string) => {
      updateDraft((prev) => ({
        ...prev,
        kainShifts: prev.kainShifts.filter((s) => s.id !== id),
      }));
    },
    [updateDraft]
  );

  const handleAddKainShift = () => {
    updateDraft((prev) => ({
      ...prev,
      kainShifts: [...prev.kainShifts, createEmptyKainShift(generateUniqueId())],
    }));
  };

  const handleRemoveLastKainShift = () => {
    if (kainShifts.length > 1) {
      updateDraft((prev) => ({
        ...prev,
        kainShifts: prev.kainShifts.slice(0, -1),
      }));
    }
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

    const hasPayrollData = kainMode
      ? kainShifts.some((s) => s.locationName || s.hours > 0 || s.cash > 0 || s.onlineTips > 0)
      : employees.some((e) => e.name || e.sunFriHours > 0);

    if (step === 'payroll' && hasPayrollData) {
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
        kainShifts: [],
        kainEditingRecordId: null,
      });
    } else if (target === 'kain-history') {
      patchDraft({ step: 'kain-history', kainEditingRecordId: null, kainShifts: [] });
      kainHistory.refresh();
    } else if (target === 'count') {
      patchDraft({ step: 'count' });
    } else {
      patchDraft({ step: 'payroll' });
    }
    setConfirmStep(null);
  };

  const handleBack = () => {
    if (step === 'payroll') {
      if (kainMode) {
        goToStep(kainEditingRecordId ? 'kain-history' : 'count');
      } else {
        goToStep('count');
      }
    } else if (step === 'count') {
      goToStep(kainMode ? 'kain-history' : 'location');
    } else if (step === 'kain-history') {
      goToStep('location');
    }
  };

  const handleStartOver = () => {
    resetDraft();
    toast.info(kainMode ? 'Started a new tracker' : 'Started a new payroll');
  };

  const handleImport = (data: ImportedData) => {
    const importedLocation = migrateLocationProfile(data.location);
    const matchingLocation = locations.find((loc) => loc.id === importedLocation.id);

    if (matchingLocation) {
      patchDraft({ selectedLocation: matchingLocation });
    } else {
      setLocations((prev) => [...prev, importedLocation]);
      patchDraft({ selectedLocation: importedLocation });
    }

    patchDraft({
      employees: data.employees,
      expenses: data.expenses,
      weekLabel: data.weekLabel,
      cashForWeek: data.cashForWeek ?? '',
      step: 'payroll',
    });
    toast.success('Payroll imported successfully');
  };

  const handleResume = () => {
    resumeDraft();
    toast.success('Draft restored');
  };

  const cashTotal = calculateCashTotal(cashForWeek);
  const kainTotals = useMemo(
    () => (kainMode ? calculateKainShiftTotals(kainShifts) : null),
    [kainMode, kainShifts]
  );

  const ariaTotals = useMemo(
    () => (ariaMode ? calculateAriaVillageTotals(ariaMetrics, employees) : null),
    [ariaMode, ariaMetrics, employees]
  );

  const actualPayment = employees.reduce((sum, emp) => sum + (emp.actualPaid ?? 0), 0);
  const summaryValue = kainTotals
    ? formatCurrency(kainTotals.totalEarnings)
    : formatCurrency(actualPayment);

  const summaryPanel =
    selectedLocation && step === 'payroll' ? (
      kainMode && kainTotals ? (
        <KainShiftSummary totals={kainTotals} shiftCount={kainShifts.length} />
      ) : (
        <PayrollSummary
          employees={employees}
          location={selectedLocation}
          expenses={expenses}
          onExpensesChange={(v) => patchDraft({ expenses: v })}
          prominenceTotals={null}
          ariaTotals={ariaTotals}
        />
      )
    ) : null;

  const headerActions =
    step === 'payroll' && selectedLocation ? (
      kainMode ? (
        <>
          <Button variant="outline" size="sm" onClick={handleExportCurrentKainPdf}>
            <FileText className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button size="sm" onClick={handleSaveKainRecord} className="bg-primary hover:bg-primary/90">
            <Save className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">
              {kainEditingRecordId ? 'Update' : 'Save'}
            </span>
          </Button>
        </>
      ) : ariaMode ? (
        <>
          <Button variant="outline" size="sm" onClick={handleExportAriaPdf}>
            <FileText className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setShowExportModal(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Download className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsLocation(selectedLocation)}
          >
            <Settings className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Rates</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setShowExportModal(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Download className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </>
      )
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
      steps={kainMode ? KAIN_STEPS : undefined}
    >
      {hasCheckedStorage &&
        pendingResume &&
        pendingResume.step !== 'location' &&
        ((step === 'location' && !isKainTracker(pendingResume.selectedLocation)) ||
          (step === 'kain-history' && isKainTracker(pendingResume.selectedLocation))) && (
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

      {step === 'kain-history' && kainMode && (
        <KainHistoryPanel
          records={kainHistory.records}
          onNewRecord={handleNewKainRecord}
          onOpenRecord={handleOpenKainRecord}
          onDeleteRecord={handleDeleteKainRecord}
          onExportBackup={handleExportKainBackup}
          onImportBackup={handleImportKainBackup}
          onExportRecordPdf={handleExportKainRecordPdf}
          onExportAllPdf={handleExportKainAllPdf}
        />
      )}

      {step === 'count' && selectedLocation && (
        kainMode ? (
          <ShiftCountPrompt
            initialCount={kainShifts.length || 1}
            onConfirm={handleShiftCountConfirm}
          />
        ) : (
          <EmployeeCountPrompt
            initialCount={employees.length || 1}
            onConfirm={handleEmployeeCountConfirm}
          />
        )
      )}

      {step === 'payroll' && selectedLocation && (
        <div className="space-y-6 pb-24 lg:pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl text-foreground">
                  {kainMode ? 'Shift earnings' : 'Employee payroll'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {kainMode
                    ? `${kainShifts.length} shift${kainShifts.length !== 1 ? 's' : ''}`
                    : `${employees.length} employee${employees.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={kainMode ? handleRemoveLastKainShift : handleRemoveLastEmployee}
                disabled={kainMode ? kainShifts.length <= 1 : employees.length <= 1}
              >
                <Minus className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Remove</span>
              </Button>
              <Button
                size="sm"
                onClick={kainMode ? handleAddKainShift : handleAddEmployee}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Add</span>
              </Button>
            </div>
          </div>

          {kainMode && (
            <KainRecordHeader
              label={kainRecordLabel}
              onLabelChange={(v) => patchDraft({ kainRecordLabel: v })}
              isEditing={!!kainEditingRecordId}
              onDelete={
                kainEditingRecordId
                  ? () => setConfirmDeleteRecordId(kainEditingRecordId)
                  : undefined
              }
            />
          )}

          {!kainMode && (
            <WeekHeader
              weekLabel={weekLabel}
              onWeekLabelChange={(v) => patchDraft({ weekLabel: v })}
              location={selectedLocation}
              cashForWeek={cashForWeek}
              onCashForWeekChange={(v) => patchDraft({ cashForWeek: v })}
              cashTotal={cashTotal}
            />
          )}

          {ariaMode && (
            <AriaVillagePayoutPanel
              employees={employees}
              metrics={ariaMetrics}
              onMetricsChange={(m) => patchDraft({ ariaMetrics: m })}
            />
          )}

          {kainMode ? (
            <div className="grid grid-cols-1 gap-4">
              {kainShifts.map((shift, index) => (
                <KainShiftCard
                  key={shift.id}
                  shift={shift}
                  index={index}
                  onUpdate={handleKainShiftUpdate}
                  onDelete={handleKainShiftDelete}
                />
              ))}
            </div>
          ) : ariaMode && ariaTotals ? (
            <div className="grid grid-cols-1 gap-4">
              {employees.map((employee, index) => (
                <AriaEmployeeCard
                  key={employee.id}
                  employee={employee}
                  index={index}
                  tipOutPerManHour={ariaTotals.tipOutPerManHour}
                  onUpdate={handleEmployeeUpdate}
                  onDelete={handleEmployeeDelete}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
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
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {kainMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => goToStep('kain-history')}
                  className="sm:w-auto"
                >
                  Back to history
                </Button>
                {kainEditingRecordId && (
                  <Button
                    variant="outline"
                    onClick={() => setConfirmDeleteRecordId(kainEditingRecordId)}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete log
                  </Button>
                )}
                <Button
                  onClick={handleSaveKainRecord}
                  className="sm:flex-1 bg-primary hover:bg-primary/90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {kainEditingRecordId ? 'Update record' : 'Save to history'}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={handleStartOver} className="sm:w-auto">
                <RotateCcw className="w-4 h-4 mr-2" />
                Start over
              </Button>
            )}
          </div>
        </div>
      )}
    </AppShell>

    {step === 'payroll' && selectedLocation && summaryPanel && (
      <MobileSummaryBar
        label={kainMode ? 'Total earnings' : 'Week totals'}
        value={summaryValue}
      >
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

    {showExportModal && selectedLocation && !kainMode && (
      <ExportModal
        open={showExportModal}
        data={{
          location: selectedLocation,
          employees,
          expenses,
          weekLabel,
          cashForWeek,
          roundedPayment: actualPayment,
          locationMetrics: undefined,
          ariaMetrics: ariaMode ? ariaMetrics : undefined,
          actualPayment: ariaMode ? actualPayment : undefined,
        }}
        onClose={() => setShowExportModal(false)}
        onImport={handleImport}
      />
    )}

    <AlertDialog open={!!confirmDeleteRecordId} onOpenChange={() => setConfirmDeleteRecordId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this log?</AlertDialogTitle>
          <AlertDialogDescription>
            {recordPendingDelete
              ? `"${recordPendingDelete.label}" and all of its shifts will be removed permanently.`
              : 'This log will be removed permanently.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              if (confirmDeleteRecordId) {
                handleDeleteKainRecord(confirmDeleteRecordId);
                setConfirmDeleteRecordId(null);
              }
            }}
          >
            Delete log
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={!!pendingImport} onOpenChange={() => setPendingImport(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Replace saved history?</AlertDialogTitle>
          <AlertDialogDescription>
            Importing will replace {kainHistory.records.length} record
            {kainHistory.records.length !== 1 ? 's' : ''} on this device with{' '}
            {pendingImport?.length ?? 0} from the backup file.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmImportKainBackup}>Replace history</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

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
