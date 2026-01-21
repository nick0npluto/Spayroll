import React, { useState, useRef } from 'react';
import { X, FileDown, FileSpreadsheet, FileJson, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportData, exportToPDF, exportToCSV, exportToJSON, parseImportedJSON, ImportedData } from '@/utils/exportUtils';

interface ExportModalProps {
  data: ExportData;
  onClose: () => void;
  onImport?: (data: ImportedData) => void;
}

export function ExportModal({ data, onClose, onImport }: ExportModalProps) {
  const [weekLabel, setWeekLabel] = useState(data.weekLabel);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportPDF = () => {
    exportToPDF({ ...data, weekLabel });
  };

  const handleExportCSV = () => {
    exportToCSV({ ...data, weekLabel });
  };

  const handleExportJSON = () => {
    exportToJSON({ ...data, weekLabel });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
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
        setImportError('Invalid file format. Please use a JSON file exported from this app.');
        setImporting(false);
        return;
      }

      if (onImport) {
        onImport(importedData);
        onClose();
      }
    } catch (error) {
      setImportError('Failed to read file. Please try again.');
    }

    setImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div
          className="modal-content animate-scale-in max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Save & Export
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Week label input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Week Label / Date Range
            </label>
            <input
              type="text"
              value={weekLabel}
              onChange={(e) => setWeekLabel(e.target.value)}
              placeholder="e.g., WeekOf_2026-01-14"
              className="input-premium w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This will be included in the filename and report
            </p>
          </div>

          {/* Export buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleExportPDF}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-elevated border border-border
                         hover:border-primary/30 hover:bg-primary/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                <FileDown className="w-6 h-6 text-destructive" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                  Export as PDF
                </p>
                <p className="text-sm text-muted-foreground">
                  Professional report for printing or sharing
                </p>
              </div>
            </button>

            <button
              onClick={handleExportCSV}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-elevated border border-border
                         hover:border-primary/30 hover:bg-primary/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-success" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                  Export as CSV
                </p>
                <p className="text-sm text-muted-foreground">
                  Spreadsheet format for Excel or Google Sheets
                </p>
              </div>
            </button>

            <button
              onClick={handleExportJSON}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-elevated border border-border
                         hover:border-primary/30 hover:bg-primary/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <FileJson className="w-6 h-6 text-warning" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                  Export as JSON
                </p>
                <p className="text-sm text-muted-foreground">
                  Data file that can be re-imported later
                </p>
              </div>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Or
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Import section */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={handleImportClick}
              disabled={importing}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-dashed border-border
                         hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-foreground">
                  {importing ? 'Importing...' : 'Import Previous Week'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Load a previously saved JSON file
                </p>
              </div>
            </button>

            {importError && (
              <p className="text-sm text-destructive mt-2">{importError}</p>
            )}
          </div>

          {/* Cancel button */}
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
