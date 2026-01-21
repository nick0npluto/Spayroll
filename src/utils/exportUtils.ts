import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Employee, LocationProfile, ROLE_DISPLAY_NAMES } from '@/types/payroll';
import { calculateEmployeePay, formatCurrency } from './payrollCalculations';

export interface ExportData {
  location: LocationProfile;
  employees: Employee[];
  expenses: number;
  weekLabel: string;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, '');
}

export function generateFilename(location: LocationProfile, weekLabel: string, extension: string): string {
  const locationName = sanitizeFilename(location.name.replace(/\s+/g, ''));
  const weekPart = sanitizeFilename(weekLabel.replace(/\s+/g, '_'));
  return `${locationName}_Payroll_${weekPart}.${extension}`;
}

export function exportToPDF(data: ExportData): void {
  const { location, employees, expenses, weekLabel } = data;
  
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
  
  // Pay rates section
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Pay Rates', 14, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Standard Rate: $${location.standardRate}/hr`, 14, 63);
  doc.text(`Premium Rate: $${location.premiumRate}/hr`, 14, 70);
  if (location.customSaturdayRunnerRate) {
    doc.text(`Sat. Runner Rate: $${location.customSaturdayRunnerRate}/hr`, 14, 77);
  }
  
  // Employee table
  const tableStartY = location.customSaturdayRunnerRate ? 85 : 78;
  
  const tableData = employees.map((emp) => {
    const pay = calculateEmployeePay(emp, location);
    return [
      emp.name || 'Unnamed',
      ROLE_DISPLAY_NAMES[emp.role],
      emp.role === 'runner' ? emp.basePayType.charAt(0).toUpperCase() + emp.basePayType.slice(1) : 'Premium',
      emp.sunFriHours.toFixed(2),
      emp.saturdayWorked ? emp.saturdayHours.toFixed(2) : '-',
      emp.role === 'runner' && emp.saturdayWorked && emp.saturdayRate 
        ? `$${emp.saturdayRate}` 
        : '-',
      formatCurrency(pay.sunFriPay),
      formatCurrency(pay.saturdayPay),
      formatCurrency(pay.totalPay),
    ];
  });
  
  autoTable(doc, {
    startY: tableStartY,
    head: [[
      'Name',
      'Role',
      'Base Type',
      'Sun-Fri Hrs',
      'Sat Hrs',
      'Sat Rate',
      'Sun-Fri Pay',
      'Sat Pay',
      'Total',
    ]],
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
    columnStyles: {
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
  const netTotal = totalPayroll - expenses;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, finalY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Total Payroll: ${formatCurrency(totalPayroll)}`, 14, finalY + 8);
  doc.text(`Expenses: ${formatCurrency(expenses)}`, 14, finalY + 15);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Net Total: ${formatCurrency(netTotal)}`, 14, finalY + 25);
  
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
  const filename = generateFilename(location, weekLabel, 'pdf');
  doc.save(filename);
}

export function exportToCSV(data: ExportData): void {
  const { location, employees, expenses, weekLabel } = data;
  
  const totalPayroll = employees.reduce((sum, emp) => {
    return sum + calculateEmployeePay(emp, location).totalPay;
  }, 0);
  const netTotal = totalPayroll - expenses;
  
  // CSV headers
  const headers = [
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
  const rows = employees.map((emp) => {
    const pay = calculateEmployeePay(emp, location);
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
      emp.role === 'runner' && emp.saturdayWorked && emp.saturdayRate 
        ? emp.saturdayRate.toString() 
        : '',
      pay.sunFriPay.toFixed(2),
      pay.saturdayPay.toFixed(2),
      pay.totalPay.toFixed(2),
    ];
  });
  
  // Add summary rows
  rows.push([]);
  rows.push(['SUMMARY']);
  rows.push(['Total Payroll', totalPayroll.toFixed(2)]);
  rows.push(['Expenses', expenses.toFixed(2)]);
  rows.push(['Net Total', netTotal.toFixed(2)]);
  
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
  const { location, employees, expenses, weekLabel } = data;
  
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
    })),
    expenses,
    summary: {
      totalPayroll,
      netTotal: totalPayroll - expenses,
    },
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
      })),
      expenses: data.expenses || 0,
      weekLabel: data.weekLabel || '',
    };
  } catch (error) {
    console.error('Failed to parse imported file:', error);
    return null;
  }
}
