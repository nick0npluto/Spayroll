import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Employee,
  LocationProfile,
  ProminenceMetrics,
  AriaMetrics,
  ROLE_DISPLAY_NAMES,
  OWNER_RATES,
} from '@/types/payroll';
import { calculateEmployeePay, formatCurrency } from './payrollCalculations';
import { calculateProminenceTotals, createDefaultProminenceMetrics } from './prominenceCalculations';

export interface ExportData {
  location: LocationProfile;
  employees: Employee[];
  expenses: number;
  weekLabel: string;
  roundedPayment: number | null;
  cashForWeek?: string;
  locationMetrics?: ProminenceMetrics;
  ariaMetrics?: AriaMetrics;
  actualPayment?: number;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, '');
}

export function generateFilename(location: LocationProfile, weekLabel: string, extension: string): string {
  const locationName = sanitizeFilename(location.name.replace(/\s+/g, ''));
  const weekPart = sanitizeFilename(weekLabel.replace(/\s+/g, '_'));
  return `${locationName}_Payroll_${weekPart}.${extension}`;
}

function generateWeekLabelOnlyFilename(weekLabel: string, extension: string): string {
  const weekPart = sanitizeFilename(weekLabel.replace(/\s+/g, '_'));
  return `${weekPart || 'Payroll_Report'}.${extension}`;
}

export function exportToPDF(data: ExportData): void {
  const { location, employees, expenses, weekLabel, roundedPayment, locationMetrics } = data;
  const isProminence = location.id === 'prominence';
  const prominenceMetrics = locationMetrics ?? createDefaultProminenceMetrics();
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Payroll Report', pageWidth / 2, 25, { align: 'center' });
  
  // Location and week
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(location.name, pageWidth / 2, 35, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(weekLabel, pageWidth / 2, 42, { align: 'center' });
  
  // Pay rates / payout model section
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(isProminence ? 'Payout Model' : 'Pay Rates', 14, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  if (isProminence) {
    const prominence = calculateProminenceTotals(prominenceMetrics, employees);
    doc.text('Prominence uses tip-out pool distribution (not fixed hourly rates).', 14, 63);
    doc.text(`Hourly Pay: ${formatCurrency(prominence.tipOutPerManHour)}`, 14, 70);
  } else {
    doc.text(`Standard Rate: $${location.standardRate}/hr`, 14, 63);
    doc.text(`Premium Rate: $${location.premiumRate}/hr`, 14, 70);
    if (location.customSaturdayRunnerRate) {
      doc.text(`Sat. Runner Rate: $${location.customSaturdayRunnerRate}/hr`, 14, 77);
    }
  }
  
  // Employee table
  const tableStartY = isProminence
    ? 78
    : location.customSaturdayRunnerRate
      ? 85
      : 78;
  
  const prominenceTipOutPerHour =
    isProminence
      ? calculateProminenceTotals(prominenceMetrics, employees).tipOutPerManHour
      : 0;

  const tableData = employees.map((emp) => {
    const pay = calculateEmployeePay(emp, location);

    if (isProminence) {
      const hours = emp.sunFriHours + (emp.saturdayWorked ? emp.saturdayHours : 0);
      const estimatedPay = hours * prominenceTipOutPerHour;
      return [
        emp.name || 'Unnamed',
        ROLE_DISPLAY_NAMES[emp.role],
        hours.toFixed(2),
        formatCurrency(prominenceTipOutPerHour),
        formatCurrency(estimatedPay),
        formatCurrency(emp.actualPaid ?? 0),
      ];
    }

    return [
      emp.name || 'Unnamed',
      ROLE_DISPLAY_NAMES[emp.role],
      emp.role === 'owner'
        ? `Manager+ ($${OWNER_RATES.sunFriRate}/hr)`
        : emp.role === 'runner'
          ? emp.basePayType.charAt(0).toUpperCase() + emp.basePayType.slice(1)
          : 'Premium',
      emp.sunFriHours.toFixed(2),
      emp.saturdayWorked ? emp.saturdayHours.toFixed(2) : '-',
      emp.role === 'owner' && emp.saturdayWorked
        ? `$${OWNER_RATES.saturdayRate}`
        : emp.role === 'runner' && emp.saturdayWorked && emp.saturdayRate
          ? `$${emp.saturdayRate}`
          : emp.useCustomManagerSaturdayRate && emp.managerSaturdayRate != null && emp.saturdayWorked
            ? `$${emp.managerSaturdayRate}`
            : '-',
      formatCurrency(pay.sunFriPay),
      formatCurrency(pay.saturdayPay),
      formatCurrency(pay.totalPay),
    ];
  });
  
  autoTable(doc, {
    startY: tableStartY,
    head: [
      isProminence
        ? ['Name', 'Role', 'Hours', 'Hourly Pay', 'Estimated Pay', 'Actual Paid']
        : [
            'Name',
            'Role',
            'Base Type',
            'Sun-Fri Hrs',
            'Sat Hrs',
            'Sat Rate',
            'Sun-Fri Pay',
            'Sat Pay',
            'Total',
          ],
    ],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: isProminence
      ? {
          0: { cellWidth: 34 },
          1: { cellWidth: 26 },
          2: { cellWidth: 18, halign: 'center' },
          3: { cellWidth: 28, halign: 'right' },
          4: { cellWidth: 28, halign: 'right' },
          5: { cellWidth: 28, halign: 'right' },
        }
      : {
          0: { cellWidth: 28 },
          1: { cellWidth: 22 },
          2: { cellWidth: 18 },
          3: { cellWidth: 18, halign: 'center' },
          4: { cellWidth: 15, halign: 'center' },
          5: { cellWidth: 15, halign: 'center' },
          6: { cellWidth: 22, halign: 'right' },
          7: { cellWidth: 20, halign: 'right' },
          8: { cellWidth: 22, halign: 'right' },
        },
  });
  
  // Summary section
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  const totalPayroll = employees.reduce((sum, emp) => {
    return sum + calculateEmployeePay(emp, location).totalPay;
  }, 0);
  const netTotal = totalPayroll + expenses;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, finalY);

  if (isProminence) {
    const prominence = calculateProminenceTotals(prominenceMetrics, employees);
    const actual = roundedPayment ?? 0;
    const variance = actual - prominence.totalTipOut;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Employee Pay Before Rounding: ${formatCurrency(prominence.totalTipOut)}`, 14, finalY + 8);
    doc.text(`Actual Paid: ${formatCurrency(actual)}`, 14, finalY + 15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Variance: ${formatCurrency(variance)}`, 14, finalY + 24);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total Payroll: ${formatCurrency(totalPayroll)}`, 14, finalY + 8);
    doc.text(`Expenses: ${formatCurrency(expenses)}`, 14, finalY + 15);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Net Total: ${formatCurrency(netTotal)}`, 14, finalY + 25);

    // Actual Payment (rounded amount)
    if (roundedPayment !== null) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 102, 0); // Orange color
      doc.text(`Actual Payment: ${formatCurrency(roundedPayment)}`, 14, finalY + 35);
      doc.setTextColor(0);
    }
  }

  if (location.id === 'prominence') {
    const prominence = calculateProminenceTotals(prominenceMetrics, employees);
    const prominenceY = finalY + 35;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Prominence Metrics', 14, prominenceY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total Cash: ${formatCurrency(prominence.totalCash)}`, 14, prominenceY + 8);
    doc.text(`Net Revenue (Total Revenue - Voids): ${formatCurrency(prominence.totalDeposit)}`, 14, prominenceY + 15);
    doc.text(`Lot Fee (50% total deposit): ${formatCurrency(prominence.lotFee)}`, 14, prominenceY + 22);
    const actualPaid = roundedPayment ?? 0;
    doc.text(`Actual Paid to Employees: ${formatCurrency(actualPaid)}`, 14, prominenceY + 29);
    doc.text(`Hourly Pay: ${formatCurrency(prominence.tipOutPerManHour)}`, 14, prominenceY + 36);
    doc.text(`Bank Withdrawal (CC deposit - lot fee): ${formatCurrency(prominence.bankWithdrawal)}`, 14, prominenceY + 43);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150);
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );
  
  // Save
  const filename = generateWeekLabelOnlyFilename(weekLabel, 'pdf');
  doc.save(filename);
}

export function exportToCSV(data: ExportData): void {
  const { location, employees, expenses, weekLabel, roundedPayment, locationMetrics } = data;
  const isProminence = location.id === 'prominence';
  const prominenceMetrics = locationMetrics ?? createDefaultProminenceMetrics();
  
  const totalPayroll = employees.reduce((sum, emp) => {
    return sum + calculateEmployeePay(emp, location).totalPay;
  }, 0);
  const netTotal = totalPayroll + expenses;
  
  // CSV headers
  const headers = isProminence
    ? [
        'Location',
        'Week',
        'Employee Name',
        'Role',
        'Hours',
        'Hourly Pay',
        'Estimated Pay',
        'Actual Paid',
      ]
    : [
        'Location',
        'Week',
        'Employee Name',
        'Role',
        'Base Pay Type',
        'Standard Rate',
        'Premium Rate',
        'Sun-Fri Hours',
        'Saturday Worked',
        'Saturday Hours',
        'Saturday Rate',
        'Sun-Fri Pay',
        'Saturday Pay',
        'Total Pay',
      ];
  
  // CSV rows
  const prominenceTipOutPerHour =
    isProminence
      ? calculateProminenceTotals(prominenceMetrics, employees).tipOutPerManHour
      : 0;

  const rows = employees.map((emp) => {
    const pay = calculateEmployeePay(emp, location);
    const hours = emp.sunFriHours + (emp.saturdayWorked ? emp.saturdayHours : 0);

    if (isProminence) {
      return [
        location.name,
        weekLabel,
        emp.name || 'Unnamed',
        ROLE_DISPLAY_NAMES[emp.role],
        hours.toFixed(2),
        prominenceTipOutPerHour.toFixed(2),
        (hours * prominenceTipOutPerHour).toFixed(2),
        (emp.actualPaid ?? 0).toFixed(2),
      ];
    }

    return [
      location.name,
      weekLabel,
      emp.name || 'Unnamed',
      ROLE_DISPLAY_NAMES[emp.role],
      emp.role === 'runner' ? emp.basePayType : 'premium',
      location.standardRate.toString(),
      location.premiumRate.toString(),
      emp.sunFriHours.toString(),
      emp.saturdayWorked ? 'Yes' : 'No',
      emp.saturdayHours.toString(),
      emp.role === 'owner' && emp.saturdayWorked
        ? OWNER_RATES.saturdayRate.toString()
        : emp.role === 'runner' && emp.saturdayWorked && emp.saturdayRate
          ? emp.saturdayRate.toString()
          : emp.useCustomManagerSaturdayRate && emp.managerSaturdayRate != null && emp.saturdayWorked
            ? emp.managerSaturdayRate.toString()
            : '',
      pay.sunFriPay.toFixed(2),
      pay.saturdayPay.toFixed(2),
      pay.totalPay.toFixed(2),
    ];
  });
  
  // Add summary rows
  rows.push([]);
  rows.push(['SUMMARY']);
  if (isProminence) {
    const prominence = calculateProminenceTotals(prominenceMetrics, employees);
    const actual = roundedPayment ?? 0;
    rows.push(['Employee Pay Before Rounding', prominence.totalTipOut.toFixed(2)]);
    rows.push(['Actual Paid', actual.toFixed(2)]);
    rows.push(['Variance', (actual - prominence.totalTipOut).toFixed(2)]);
  } else {
    rows.push(['Total Payroll', totalPayroll.toFixed(2)]);
    rows.push(['Expenses', expenses.toFixed(2)]);
    rows.push(['Net Total', netTotal.toFixed(2)]);
    if (roundedPayment !== null) {
      rows.push(['Actual Payment', roundedPayment.toFixed(2)]);
    }
  }

  if (location.id === 'prominence') {
    const prominence = calculateProminenceTotals(prominenceMetrics, employees);
    rows.push([]);
    rows.push(['PROMINENCE METRICS']);
    rows.push(['Total Cash', prominence.totalCash.toFixed(2)]);
    rows.push(['Net Revenue (Total Revenue - Voids)', prominence.totalDeposit.toFixed(2)]);
    rows.push(['Lot Fee', prominence.lotFee.toFixed(2)]);
    rows.push(['Actual Paid to Employees', (roundedPayment ?? 0).toFixed(2)]);
    rows.push(['Hourly Pay', prominence.tipOutPerManHour.toFixed(2)]);
    rows.push(['Bank Withdrawal', prominence.bankWithdrawal.toFixed(2)]);
    rows.push(['Revenue Per Car', prominence.avgPerCar.toFixed(2)]);
    rows.push(['Tip Average', prominence.tipAvg.toFixed(2)]);
  }
  
  // Convert to CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => 
      row.map((cell) => {
        // Escape quotes and wrap in quotes if contains comma
        const str = String(cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ),
  ].join('\n');
  
  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', generateFilename(location, weekLabel, 'csv'));
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToJSON(data: ExportData): string {
  const { location, employees, expenses, weekLabel, roundedPayment, cashForWeek, locationMetrics } = data;
  
  const totalPayroll = employees.reduce((sum, emp) => {
    return sum + calculateEmployeePay(emp, location).totalPay;
  }, 0);
  
  const exportObj = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    location: {
      id: location.id,
      name: location.name,
      standardRate: location.standardRate,
      premiumRate: location.premiumRate,
      customSaturdayRunnerRate: location.customSaturdayRunnerRate,
    },
    weekLabel,
    employees: employees.map((emp) => ({
      name: emp.name,
      role: emp.role,
      basePayType: emp.basePayType,
      sunFriHours: emp.sunFriHours,
      saturdayWorked: emp.saturdayWorked,
      saturdayHours: emp.saturdayHours,
      saturdayRate: emp.saturdayRate,
      useCustomManagerSaturdayRate: emp.useCustomManagerSaturdayRate ?? false,
      managerSaturdayRate: emp.managerSaturdayRate ?? null,
    })),
    expenses,
    roundedPayment,
    cashForWeek: cashForWeek ?? '',
    summary: {
      totalPayroll,
      netTotal: totalPayroll + expenses,
      actualPayment: roundedPayment,
    },
    locationMetrics: locationMetrics ?? null,
  };
  
  const json = JSON.stringify(exportObj, null, 2);
  
  // Download
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', generateFilename(location, weekLabel, 'json'));
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return json;
}

export interface ImportedData {
  location: LocationProfile;
  employees: Employee[];
  expenses: number;
  weekLabel: string;
  cashForWeek?: string;
  locationMetrics?: ProminenceMetrics;
}

export function parseImportedJSON(jsonString: string): ImportedData | null {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate structure
    if (!data.location || !Array.isArray(data.employees)) {
      throw new Error('Invalid file format');
    }
    
    return {
      location: {
        id: data.location.id,
        name: data.location.name,
        standardRate: data.location.standardRate,
        premiumRate: data.location.premiumRate,
        customSaturdayRunnerRate: data.location.customSaturdayRunnerRate,
      },
      employees: data.employees.map((emp: any, index: number) => ({
        id: `imported-${index}-${Date.now()}`,
        name: emp.name || '',
        role: emp.role || 'runner',
        basePayType: emp.basePayType || 'standard',
        sunFriHours: emp.sunFriHours || 0,
        saturdayWorked: emp.saturdayWorked || false,
        saturdayHours: emp.saturdayHours || 0,
        saturdayRate: emp.saturdayRate || null,
        useCustomManagerSaturdayRate: emp.useCustomManagerSaturdayRate || false,
        managerSaturdayRate: emp.managerSaturdayRate ?? null,
        actualPaid: emp.actualPaid ?? null,
      })),
      expenses: data.expenses || 0,
      weekLabel: data.weekLabel || '',
      cashForWeek: data.cashForWeek ?? '',
      locationMetrics: data.locationMetrics ?? undefined,
    };
  } catch (error) {
    console.error('Failed to parse imported file:', error);
    return null;
  }
}
