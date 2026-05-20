import { useState, useRef } from 'react';
import { FileDown, FileSpreadsheet, FileJson, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ExportData,
  exportToPDF,
  exportToCSV,
  exportToJSON,
  parseImportedJSON,
  ImportedData,
} from '@/utils/exportUtils';
import { isAriaVillage } from '@/types/payroll';
import { exportAriaPayrollToPDF } from '@/utils/ariaVillagePdf';
import { createDefaultAriaMetrics } from '@/utils/ariaVillageCalculations';
import { toast } from 'sonner';

interface ExportModalProps {
  open: boolean;
  data: ExportData;
  onClose: () => void;
  onImport?: (data: ImportedData) => void;
}

export function ExportModal({ open, data, onClose, onImport }: ExportModalProps) {
  const [weekLabel, setWeekLabel] = useState(data.weekLabel);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportData = { ...data, weekLabel };

  const handleExportPDF = () => {
    if (isAriaVillage(exportData.location)) {
      exportAriaPayrollToPDF({
        location: exportData.location,
        employees: exportData.employees,
        weekLabel: exportData.weekLabel,
        ariaMetrics: exportData.ariaMetrics ?? createDefaultAriaMetrics(),
        actualPayment: exportData.actualPayment ?? exportData.roundedPayment ?? 0,
      });
    } else {
      exportToPDF(exportData);
    }
    toast.success('PDF downloaded');
  };

  const handleExportCSV = () => {
    exportToCSV(exportData);
    toast.success('CSV downloaded');
  };

  const handleExportJSON = () => {
    exportToJSON(exportData);
    toast.success('JSON saved — use this file to restore later');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError(null);

    try {
      const text = await file.text();
      const importedData = parseImportedJSON(text);

      if (!importedData) {
        setImportError('Invalid file. Please use a JSON file exported from Spayroll.');
        setImporting(false);
        return;
      }

      if (onImport) {
        onImport(importedData);
        onClose();
      }
    } catch {
      setImportError('Failed to read file. Please try again.');
    }

    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Save & export</DialogTitle>
          <DialogDescription>
            Download your payroll or import a previous week&apos;s JSON file.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <label htmlFor="export-week-label" className="block text-sm font-medium mb-2">
            Week label
          </label>
          <input
            id="export-week-label"
            type="text"
            value={weekLabel}
            onChange={(e) => setWeekLabel(e.target.value)}
            placeholder="WeekOf_2026-01-14"
            className="input-premium w-full"
          />
        </div>

        <div className="space-y-2 mb-6">
          <ExportOption
            icon={<FileDown className="w-5 h-5 text-destructive" />}
            iconBg="bg-destructive/10"
            title="Export as PDF"
            description="Printable report"
            onClick={handleExportPDF}
          />
          <ExportOption
            icon={<FileSpreadsheet className="w-5 h-5 text-success" />}
            iconBg="bg-success/10"
            title="Export as CSV"
            description="Spreadsheet format"
            onClick={handleExportCSV}
          />
          <ExportOption
            icon={<FileJson className="w-5 h-5 text-warning" />}
            iconBg="bg-warning/10"
            title="Export as JSON"
            description="Re-importable backup"
            onClick={handleExportJSON}
          />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50 min-h-[44px]"
        >
          <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Upload className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="text-left">
            <p className="font-medium text-foreground">
              {importing ? 'Importing…' : 'Import previous week'}
            </p>
            <p className="text-sm text-muted-foreground">Load a saved JSON file</p>
          </div>
        </button>

        {importError && <p className="text-sm text-destructive mt-2">{importError}</p>}

        <Button variant="outline" onClick={onClose} className="w-full mt-4">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function ExportOption({
  icon,
  iconBg,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all text-left min-h-[44px]"
    >
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}
