import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { KainEarningsRecord } from '@/types/kainTracker';
import { calculateKainShiftTotals, getShiftTotal } from '@/utils/kainShiftCalculations';
import { formatCurrency } from '@/utils/payrollCalculations';
import {
  formatRecordTimestamp,
  formatShiftWorkDate,
  sortShiftsByDate,
} from '@/utils/kainShiftDates';

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, '_').replace(/_+/g, '_') || 'earnings';
}

function downloadPdf(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

function renderRecordSection(
  doc: jsPDF,
  record: KainEarningsRecord,
  startY: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const totals = calculateKainShiftTotals(record.shifts);
  const sorted = sortShiftsByDate(record.shifts);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(record.label, 14, startY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90);
  doc.text(`Created: ${formatRecordTimestamp(record.createdAt)}`, 14, startY + 7);
  doc.text(`Last saved: ${formatRecordTimestamp(record.updatedAt)}`, 14, startY + 13);

  const tableBody = sorted.map((shift) => {
    const total = getShiftTotal(shift);
    return [
      formatShiftWorkDate(shift.workDate),
      shift.locationName || '—',
      shift.hours > 0 ? shift.hours.toFixed(2) : '0',
      formatCurrency(shift.cash),
      formatCurrency(shift.onlineTips),
      formatCurrency(total),
    ];
  });

  autoTable(doc, {
    startY: startY + 18,
    head: [['Date', 'Location', 'Hours', 'Cash', 'Online tips', 'Shift total']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [41, 74, 62], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 42 },
    },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY + 40;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  const summaryY = finalY + 8;
  doc.text(`Shifts: ${record.shifts.length}`, 14, summaryY);
  doc.text(`Total hours: ${totals.totalHours.toFixed(2)}`, 14, summaryY + 6);
  doc.text(`Total cash: ${formatCurrency(totals.totalCash)}`, pageWidth / 2, summaryY, {
    align: 'center',
  });
  doc.text(`Total tips: ${formatCurrency(totals.totalOnlineTips)}`, pageWidth / 2, summaryY + 6, {
    align: 'center',
  });
  doc.setFontSize(12);
  doc.text(`Grand total: ${formatCurrency(totals.totalEarnings)}`, pageWidth - 14, summaryY + 3, {
    align: 'right',
  });

  return summaryY + 14;
}

export function exportKainRecordToPDF(record: KainEarningsRecord): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text("Kain's Cash Tracker", pageWidth / 2, 22, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Earnings report', pageWidth / 2, 30, { align: 'center' });
  doc.setTextColor(0);

  renderRecordSection(doc, record, 40);

  const filename = `Kain_${sanitizeFilename(record.label)}.pdf`;
  downloadPdf(doc, filename);
}

export function exportKainHistoryToPDF(records: KainEarningsRecord[]): void {
  if (records.length === 0) return;

  if (records.length === 1) {
    exportKainRecordToPDF(records[0]);
    return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text("Kain's Cash Tracker", pageWidth / 2, 22, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Full history · ${records.length} records`, pageWidth / 2, 30, { align: 'center' });
  doc.setTextColor(0);

  let y = 40;

  records.forEach((record, index) => {
    if (y > pageHeight - 60 && index > 0) {
      doc.addPage();
      y = 20;
    } else if (index > 0) {
      y += 6;
    }

    if (y > pageHeight - 80) {
      doc.addPage();
      y = 20;
    }

    y = renderRecordSection(doc, record, y);

    if (index < records.length - 1) {
      doc.setDrawColor(200);
      doc.line(14, y, pageWidth - 14, y);
      y += 10;
    }
  });

  const date = new Date().toISOString().slice(0, 10);
  downloadPdf(doc, `Kain_Full_History_${date}.pdf`);
}
