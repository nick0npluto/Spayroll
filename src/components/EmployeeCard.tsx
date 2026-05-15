import React, { useState, useEffect } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { Employee, EmployeeRole, LocationProfile, ROLE_DISPLAY_NAMES, OWNER_RATES } from '@/types/payroll';
import { calculateEmployeePay, formatCurrency } from '@/utils/payrollCalculations';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Parse comma-separated time entries (e.g., "5:42, 4:12, 9:34") and return total decimal hours
const parseTimeEntries = (input: string): number => {
  if (!input.trim()) return 0;
  
  const entries = input.split(',').map(s => s.trim()).filter(s => s);
  let totalMinutes = 0;
  
  for (const entry of entries) {
    // Handle H:MM or HH:MM format
    if (entry.includes(':')) {
      const [hours, minutes] = entry.split(':').map(s => parseInt(s) || 0);
      totalMinutes += hours * 60 + Math.min(minutes, 59);
    } else {
      // Handle plain decimal hours
      const hours = parseFloat(entry) || 0;
      totalMinutes += hours * 60;
    }
  }
  
  return Math.round((totalMinutes / 60) * 100) / 100;
};

// Format decimal hours to H:MM display
const formatHoursDisplay = (hours: number): string => {
  if (hours === 0) return '0:00';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
};

interface EmployeeCardProps {
  employee: Employee;
  location: LocationProfile;
  index: number;
  prominenceTipOutPerHour?: number;
  onUpdate: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

export function EmployeeCard({
  employee,
  location,
  index,
  prominenceTipOutPerHour = 0,
  onUpdate,
  onDelete,
}: EmployeeCardProps) {
  // Local state for the raw time input strings
  const [sunFriInput, setSunFriInput] = useState('');
  const [saturdayInput, setSaturdayInput] = useState('');

  const payBreakdown = calculateEmployeePay(employee, location);
  const isProminence = location.id === 'prominence';
  const prominenceTotalHours = employee.sunFriHours;
  const prominenceTotalPay = prominenceTotalHours * prominenceTipOutPerHour;

  const isManager = employee.role === 'lot-manager' || employee.role === 'box-manager';
  const isOwner = employee.role === 'owner';
  const showSaturdayRate = employee.role === 'runner' && employee.saturdayWorked;
  const showManagerCustomSaturdayControls =
    isManager &&
    employee.saturdayWorked &&
    location.id === 'rock-steady';
  const availableRoles: EmployeeRole[] = isProminence
    ? ['runner', 'lot-manager']
    : ['runner', 'lot-manager', 'box-manager', 'owner'];

  useEffect(() => {
    if (isProminence && (employee.role === 'box-manager' || employee.role === 'owner')) {
      onUpdate({
        ...employee,
        role: 'lot-manager',
        basePayType: 'premium',
      });
    }
  }, [employee, isProminence, onUpdate]);

  const handleRoleChange = (role: EmployeeRole) => {
    const updatedEmployee: Employee = {
      ...employee,
      role,
      // Managers and owner always use premium/fixed, reset for runners
      basePayType: role === 'runner' ? employee.basePayType : 'premium',
      // Clear manager Saturday custom rate if switching away from manager
      useCustomManagerSaturdayRate:
        role === 'lot-manager' || role === 'box-manager'
          ? employee.useCustomManagerSaturdayRate ?? false
          : false,
      managerSaturdayRate:
        role === 'lot-manager' || role === 'box-manager'
          ? employee.managerSaturdayRate ?? null
          : null,
    };
    onUpdate(updatedEmployee);
  };

  // Handle Sun-Fri hours input change
  const handleSunFriInputChange = (value: string) => {
    setSunFriInput(value);
    const totalHours = parseTimeEntries(value);
    onUpdate({
      ...employee,
      sunFriHours: totalHours,
      ...(isProminence
        ? {
            saturdayWorked: false,
            saturdayHours: 0,
            saturdayRate: null,
            useCustomManagerSaturdayRate: false,
            managerSaturdayRate: null,
          }
        : {}),
    });
  };

  // Handle Saturday hours input change
  const handleSaturdayInputChange = (value: string) => {
    setSaturdayInput(value);
    const totalHours = parseTimeEntries(value);
    onUpdate({ ...employee, saturdayHours: totalHours });
  };

  const handleSaturdayToggle = (checked: boolean) => {
    if (!checked) {
      setSaturdayInput('');
    }
    onUpdate({
      ...employee,
      saturdayWorked: checked,
      saturdayHours: checked ? employee.saturdayHours : 0,
      saturdayRate: checked && employee.role === 'runner' 
        ? (location.customSaturdayRunnerRate ?? location.premiumRate)
        : null,
      // Reset manager-specific Saturday settings when turning Saturday off
      useCustomManagerSaturdayRate: checked ? employee.useCustomManagerSaturdayRate ?? false : false,
      managerSaturdayRate: checked ? employee.managerSaturdayRate ?? null : null,
    });
  };

  const getRoleBadgeClass = (role: EmployeeRole = employee.role) => {
    switch (role) {
      case 'runner':
        return 'role-badge-runner';
      case 'lot-manager':
        return 'role-badge-lot-manager';
      case 'box-manager':
        return 'role-badge-box-manager';
      case 'owner':
        return 'role-badge-owner';
      default:
        return '';
    }
  };

  return (
    <div 
      className="employee-card stagger-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Employee #{index + 1}
          </span>
          <p className="text-lg font-semibold text-primary mt-0.5">
            {formatCurrency(isProminence ? prominenceTotalPay : payBreakdown.totalPay)}
            <span className="text-xs font-normal text-muted-foreground ml-1">calculated</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(employee.id)}
          className="p-2.5 rounded-lg hover:bg-destructive/10 transition-colors group min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Remove employee"
          aria-label="Remove employee"
        >
          <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
        </button>
      </div>

      {/* Name and Role row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">
            Name
          </label>
          <input
            type="text"
            value={employee.name}
            onChange={(e) => onUpdate({ ...employee, name: e.target.value })}
            placeholder="Employee name"
            className="input-premium w-full text-sm"
          />
          {!employee.name.trim() && (
            <p className="flex items-center gap-1 text-xs text-warning mt-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Name recommended before export
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">Role</label>
          <Select value={employee.role} onValueChange={(v) => handleRoleChange(v as EmployeeRole)}>
            <SelectTrigger className="input-premium h-11">
              <SelectValue>
                <span className={cn('role-badge', getRoleBadgeClass())}>
                  {ROLE_DISPLAY_NAMES[employee.role]}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  <span className={cn('role-badge', getRoleBadgeClass(role))}>
                    {ROLE_DISPLAY_NAMES[role]}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Owner fixed rate notice */}
      {!isProminence && isOwner && (
        <div className="mb-4 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-xs font-medium text-primary">
            Manager+ rates: ${OWNER_RATES.sunFriRate}/hr (Sun–Fri) · ${OWNER_RATES.saturdayRate}/hr (Saturday)
          </p>
        </div>
      )}

      {/* Base pay type (only for runners) */}
      {!isProminence && employee.role === 'runner' && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-muted-foreground mb-2">
            Base Pay Rate (Sun–Fri)
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdate({ ...employee, basePayType: 'standard' })}
              className={cn(
                "flex-1 py-2 px-4 text-sm font-medium transition-all border",
                employee.basePayType === 'standard'
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-primary hover:bg-primary hover:text-primary-foreground"
              )}
            >
              Standard (${location.standardRate}/hr)
            </button>
            <button
              onClick={() => onUpdate({ ...employee, basePayType: 'premium' })}
              className={cn(
                "flex-1 py-2 px-4 text-sm font-medium transition-all border",
                employee.basePayType === 'premium'
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-primary hover:bg-primary hover:text-primary-foreground"
              )}
            >
              Premium (${location.premiumRate}/hr)
            </button>
          </div>
        </div>
      )}

      {/* Managers always premium notice */}
      {!isProminence && isManager && !isOwner && (
        <div className="mb-4 px-3 py-2 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            Managers use Premium rate (${location.premiumRate}/hr)
          </p>
        </div>
      )}

      {/* Hours section */}
      <div className="space-y-4 mb-4">
        {/* Sun-Fri Hours */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">
            {isProminence ? 'Total Weekly Hours' : 'Sunday–Friday Hours'}
            <span className="text-muted-foreground/60 ml-2 font-normal">
              (comma-separated, e.g., 5:42, 4:12, 9:34)
            </span>
          </label>
          <div className="space-y-2">
            <input
              type="text"
              value={sunFriInput}
              onChange={(e) => handleSunFriInputChange(e.target.value)}
              placeholder="0:00 or 5:42, 4:12, 9:34"
              className="input-premium w-full text-sm"
            />
            {employee.sunFriHours > 0 && (
              <div className="flex items-center justify-between px-3 py-2 bg-primary/10 rounded-lg">
                <span className="text-xs text-muted-foreground">Total:</span>
                <span className="text-sm font-semibold text-primary">
                  {formatHoursDisplay(employee.sunFriHours)} ({employee.sunFriHours.toFixed(2)} hrs)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Saturday toggle */}
        {!isProminence && (
        <div className="flex items-center justify-between py-2">
          <label className="text-xs font-medium text-muted-foreground">
            Saturday Worked?
          </label>
          <div className="flex items-center gap-3">
            <Switch
              checked={employee.saturdayWorked}
              onCheckedChange={handleSaturdayToggle}
            />
            <span className="text-sm text-foreground min-w-[28px]">
              {employee.saturdayWorked ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
        )}
      </div>

      {/* Saturday details (conditional) */}
      {!isProminence && employee.saturdayWorked && (
        <div className="space-y-4 mb-4 animate-fade-in">
          {/* Saturday hours */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Saturday Hours
              <span className="text-muted-foreground/60 ml-2 font-normal">
                (comma-separated)
              </span>
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={saturdayInput}
                onChange={(e) => handleSaturdayInputChange(e.target.value)}
                placeholder="0:00 or 3:30, 2:15"
                className="input-premium w-full text-sm"
              />
              {employee.saturdayHours > 0 && (
                <div className="flex items-center justify-between px-3 py-2 bg-primary/10 rounded-lg">
                  <span className="text-xs text-muted-foreground">Total:</span>
                  <span className="text-sm font-semibold text-primary">
                    {formatHoursDisplay(employee.saturdayHours)} ({employee.saturdayHours.toFixed(2)} hrs)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Saturday rate (only for runners) */}
          {showSaturdayRate && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Saturday Rate ($/hr)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={employee.saturdayRate ?? ''}
                  onChange={(e) => onUpdate({
                    ...employee,
                    saturdayRate: parseFloat(e.target.value) || null,
                  })}
                  placeholder={location.premiumRate.toString()}
                  className="numeric-input w-full pl-7 text-left"
                />
              </div>
            </div>
          )}

          {/* Managers Saturday custom rate controls (Rock Steady only) */}
          {showManagerCustomSaturdayControls && (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Use custom Saturday rate for manager
                </label>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={!!employee.useCustomManagerSaturdayRate}
                    onCheckedChange={(checked) =>
                      onUpdate({
                        ...employee,
                        useCustomManagerSaturdayRate: checked,
                        managerSaturdayRate: checked
                          ? employee.managerSaturdayRate ?? location.premiumRate
                          : null,
                      })
                    }
                  />
                  <span className="text-sm text-foreground min-w-[28px]">
                    {employee.useCustomManagerSaturdayRate ? 'On' : 'Off'}
                  </span>
                </div>
              </div>

              {employee.useCustomManagerSaturdayRate && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">
                    Manager Saturday Rate (custom $/hr)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={employee.managerSaturdayRate ?? ''}
                      onChange={(e) =>
                        onUpdate({
                          ...employee,
                          managerSaturdayRate:
                            e.target.value === ''
                              ? null
                              : parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder={location.premiumRate.toString()}
                      className="numeric-input w-full pl-7 text-left"
                    />
                  </div>
                </div>
              )}

              {!employee.useCustomManagerSaturdayRate && (
                <div className="px-3 py-2 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    Saturday uses Premium (${location.premiumRate}/hr) unless a custom manager Saturday rate is enabled.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pay breakdown */}
      <div className="border-t border-border pt-4 mt-4">
        {isProminence ? (
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Hours</p>
              <p className="text-sm font-semibold text-foreground">
                {prominenceTotalHours.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Hourly Pay</p>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(prominenceTipOutPerHour)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Estimated</p>
              <p className="text-sm font-bold text-primary">
                {formatCurrency(prominenceTotalPay)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Actual</p>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={employee.actualPaid ?? ''}
                  onChange={(e) => onUpdate({
                    ...employee,
                    actualPaid: e.target.value === '' ? null : parseFloat(e.target.value) || 0,
                  })}
                  placeholder={Math.round(prominenceTotalPay).toString()}
                  className="numeric-input w-full pl-5 text-center text-sm py-1"
                />
              </div>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Sun–Fri</p>
            <p className="text-sm font-semibold text-foreground">
              {formatCurrency(payBreakdown.sunFriPay)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Saturday</p>
            <p className="text-sm font-semibold text-foreground">
              {formatCurrency(payBreakdown.saturdayPay)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-sm font-bold text-primary">
              {formatCurrency(payBreakdown.totalPay)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Actual</p>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                $
              </span>
              <input
                type="number"
                step="1"
                min="0"
                value={employee.actualPaid ?? ''}
                onChange={(e) => onUpdate({
                  ...employee,
                  actualPaid: e.target.value === '' ? null : parseFloat(e.target.value) || 0,
                })}
                placeholder={Math.round(payBreakdown.totalPay).toString()}
                className="numeric-input w-full pl-5 text-center text-sm py-1"
              />
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
