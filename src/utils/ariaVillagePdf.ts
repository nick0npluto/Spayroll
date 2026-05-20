import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AriaMetrics, Employee, LocationProfile } from '@/types/payroll';
import {
  ARIA_DAY_ORDER,
  calculateAriaVillageTotals,
  getAriaEmployeePay,
  getAriaEmployeeRateLabel,
  getEmployeeWeeklyHours,
} from './ariaVillageCalculations';
import { formatCurrency } from './payrollCalculations';

export interface AriaExportData {
  location: LocationProfile;
  employees: Employee[];
  weekLabel: string;
  ariaMetrics: AriaMetrics;
  actualPayment: number;
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, '_').replace(/_+/g, '_') || 'payroll';
}

export function exportAriaPayrollToPDF(data: AriaExportData): void {
  const { location, employees, weekLabel, ariaMetrics, actualPayment } = data;
  const totals = calculateAriaVillageTotals(ariaMetrics, employees);
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Aria Village — Valet Pay Outs', pageWidth / 2, 22, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(location.name, pageWidth / 2, 30, { align: 'center' });
  doc.text(weekLabel, pageWidth / 2, 37, { align: 'center' });
  doc.setTextColor(0);

  const employeeRows = employees.map((emp) => {
    const hoursByDay = emp.hoursByDay ?? {};
    const dayHours = ARIA_DAY_ORDER.map((d) => {
      const h = hoursByDay[d] ?? 0;
      return h > 0 ? h.toFixed(2) : '—';
    });
    const weeklyHours = getEmployeeWeeklyHours(emp);
    const pay = getAriaEmployeePay(emp, totals.tipOutPerManHour);
    return [
      emp.name || '—',
      ...dayHours,
      weeklyHours.toFixed(2),
      getAriaEmployeeRateLabel(emp, totals.tipOutPerManHour),
      formatCurrency(pay),
      emp.actualPaid != null ? formatCurrency(emp.actualPaid) : '—',
    ];
  });

  autoTable(doc, {
    startY: 44,
    head: [
      ['Employee', ...DAY_HEADERS, 'Total Hrs', 'Rate', 'Pay Out', 'Actual'],
    ],
    body: employeeRows,
    theme: 'striped',
    headStyles: { fillColor: [180, 120, 40], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 2, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 28 },
    },
  });

  let y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 50;
  y += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Cash counter (Mon–Sun)', 14, y);
  y += 6;

  const counterRow = ARIA_DAY_ORDER.map((d) => {
    const v = ariaMetrics.dailyCashByDay[d] || 0;
    return v > 0 ? formatCurrency(v) : '—';
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    DAY_HEADERS.map((h, i) => `${h}: ${counterRow[i]}`).join('  '),
    14,
    y
  );
  y += 5;
  doc.text(`Counter sum: ${formatCurrency(totals.cashCounterSum)}`, 14, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, y);
  y += 7;
  doc.setFont('helvetica', 'normal');

  const summaryLines = [
    ['Weekly total', formatCurrency(totals.weeklyTotal)],
    ['Voids', formatCurrency(totals.voids)],
    ['Total after voids', formatCurrency(totals.totalAfterVoids)],
    ['Total cash', formatCurrency(totals.totalCash)],
    ['CC deposit', formatCurrency(totals.ccDeposit)],
    ['Total tip out', formatCurrency(totals.totalTipOut)],
    ['Tip out / man-hour', formatCurrency(totals.tipOutPerManHour)],
    ['Pool hours', totals.totalManHours.toFixed(2)],
    ['Bank withdrawal', formatCurrency(totals.bankWithdrawal)],
    ['Estimated pay (all staff)', formatCurrency(totals.totalEstimatedPay)],
    ['Actual paid (all staff)', formatCurrency(actualPayment)],
  ];

  summaryLines.forEach(([label, value]) => {
    doc.text(`${label}: ${value}`, 14, y);
    y += 5;
  });

  const filename = `Aria_Village_${sanitizeFilename(weekLabel)}.pdf`;
  doc.save(filename);
}
