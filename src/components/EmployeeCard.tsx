import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { Employee, EmployeeRole, BasePayType, LocationProfile, ROLE_DISPLAY_NAMES } from '@/types/payroll';
import { calculateEmployeePay, formatCurrency } from '@/utils/payrollCalculations';
import { AddHoursModal } from './AddHoursModal';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface EmployeeCardProps {
  employee: Employee;
  location: LocationProfile;
  index: number;
  onUpdate: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

export function EmployeeCard({
  employee,
  location,
  index,
  onUpdate,
  onDelete,
}: EmployeeCardProps) {
  const [showSunFriModal, setShowSunFriModal] = useState(false);
  const [showSatModal, setShowSatModal] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const payBreakdown = calculateEmployeePay(employee, location);

  const isManager = employee.role === 'lot-manager' || employee.role === 'box-manager';
  const showSaturdayRate = employee.role === 'runner' && employee.saturdayWorked;

  const handleRoleChange = (role: EmployeeRole) => {
    const updatedEmployee: Employee = {
      ...employee,
      role,
      // Managers always use premium, reset for runners
      basePayType: role === 'runner' ? employee.basePayType : 'premium',
    };
    onUpdate(updatedEmployee);
    setShowRoleDropdown(false);
  };

  const handleHoursChange = (field: 'sunFriHours' | 'saturdayHours', value: string) => {
    const numValue = parseFloat(value) || 0;
    if (numValue < 0) return;
    onUpdate({ ...employee, [field]: numValue });
  };

  const handleSaturdayToggle = (checked: boolean) => {
    onUpdate({
      ...employee,
      saturdayWorked: checked,
      saturdayHours: checked ? employee.saturdayHours : 0,
      saturdayRate: checked && employee.role === 'runner' 
        ? (location.customSaturdayRunnerRate ?? location.premiumRate)
        : null,
    });
  };

  const getRoleBadgeClass = () => {
    switch (employee.role) {
      case 'runner':
        return 'role-badge-runner';
      case 'lot-manager':
        return 'role-badge-lot-manager';
      case 'box-manager':
        return 'role-badge-box-manager';
      default:
        return '';
    }
  };

  return (
    <>
      <div 
        className="employee-card stagger-fade-in"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Header: Employee number and delete */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Employee #{index + 1}
          </span>
          <button
            onClick={() => onDelete(employee.id)}
            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors group"
            title="Remove employee"
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
          </div>

          {/* Role dropdown */}
          <div className="relative">
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Role
            </label>
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="input-premium w-full text-left flex items-center justify-between text-sm"
            >
              <span className={cn('role-badge', getRoleBadgeClass())}>
                {ROLE_DISPLAY_NAMES[employee.role]}
              </span>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                showRoleDropdown && "rotate-180"
              )} />
            </button>
            
            {showRoleDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border 
                              rounded-xl shadow-lg z-20 overflow-hidden animate-scale-in">
                {(['runner', 'lot-manager', 'box-manager'] as EmployeeRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-muted transition-colors text-sm",
                      employee.role === role && "bg-primary/10"
                    )}
                  >
                    <span className={cn('role-badge', 
                      role === 'runner' ? 'role-badge-runner' :
                      role === 'lot-manager' ? 'role-badge-lot-manager' : 'role-badge-box-manager'
                    )}>
                      {ROLE_DISPLAY_NAMES[role]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Base pay type (only for runners) */}
        {employee.role === 'runner' && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Base Pay Rate (Sun–Fri)
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdate({ ...employee, basePayType: 'standard' })}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
                  employee.basePayType === 'standard'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                Standard (${location.standardRate}/hr)
              </button>
              <button
                onClick={() => onUpdate({ ...employee, basePayType: 'premium' })}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
                  employee.basePayType === 'premium'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                Premium (${location.premiumRate}/hr)
              </button>
            </div>
          </div>
        )}

        {/* Managers always premium notice */}
        {isManager && (
          <div className="mb-4 px-3 py-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              Managers use Premium rate (${location.premiumRate}/hr)
            </p>
          </div>
        )}

        {/* Hours section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Sun-Fri Hours */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Sunday–Friday Hours
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={employee.sunFriHours || ''}
                onChange={(e) => handleHoursChange('sunFriHours', e.target.value)}
                placeholder="0.00"
                className="numeric-input flex-1"
              />
              <button
                onClick={() => setShowSunFriModal(true)}
                className="px-3 py-2 rounded-lg bg-muted hover:bg-primary/20 hover:text-primary 
                           transition-all text-muted-foreground"
                title="Add hours calculator"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Saturday toggle */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Saturday Worked?
            </label>
            <div className="flex items-center gap-3 h-[42px]">
              <Switch
                checked={employee.saturdayWorked}
                onCheckedChange={handleSaturdayToggle}
              />
              <span className="text-sm text-foreground">
                {employee.saturdayWorked ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Saturday details (conditional) */}
        {employee.saturdayWorked && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 animate-fade-in">
            {/* Saturday hours */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Saturday Hours
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={employee.saturdayHours || ''}
                  onChange={(e) => handleHoursChange('saturdayHours', e.target.value)}
                  placeholder="0.00"
                  className="numeric-input flex-1"
                />
                <button
                  onClick={() => setShowSatModal(true)}
                  className="px-3 py-2 rounded-lg bg-muted hover:bg-primary/20 hover:text-primary 
                             transition-all text-muted-foreground"
                  title="Add hours calculator"
                >
                  <Plus className="w-4 h-4" />
                </button>
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

            {/* Managers saturday rate info */}
            {isManager && (
              <div className="flex items-center">
                <p className="text-xs text-muted-foreground px-3 py-2 bg-muted/50 rounded-lg">
                  Saturday uses Premium (${location.premiumRate}/hr)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Pay breakdown */}
        <div className="border-t border-border pt-4 mt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
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
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSunFriModal && (
        <AddHoursModal
          title="Sun–Fri Hours"
          onUseTotal={(total) => onUpdate({ ...employee, sunFriHours: total })}
          onClose={() => setShowSunFriModal(false)}
        />
      )}
      {showSatModal && (
        <AddHoursModal
          title="Saturday Hours"
          onUseTotal={(total) => onUpdate({ ...employee, saturdayHours: total })}
          onClose={() => setShowSatModal(false)}
        />
      )}
    </>
  );
}
