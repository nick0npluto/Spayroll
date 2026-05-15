import { useRef, useState } from 'react';
import {
  Plus,
  Wallet,
  ChevronRight,
  Trash2,
  Calendar,
  Download,
  Upload,
  FileText,
} from 'lucide-react';
import { formatRecordTimestamp, getShiftDateRangeLabel } from '@/utils/kainShiftDates';
import { Button } from '@/components/ui/button';
import { KainEarningsRecord } from '@/types/kainTracker';
import { calculateKainShiftTotals } from '@/utils/kainShiftCalculations';
import { formatCurrency } from '@/utils/payrollCalculations';
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

interface KainHistoryPanelProps {
  records: KainEarningsRecord[];
  onNewRecord: () => void;
  onOpenRecord: (id: string) => void;
  onDeleteRecord: (id: string) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onExportRecordPdf: (id: string) => void;
  onExportAllPdf: () => void;
}

export function KainHistoryPanel({
  records,
  onNewRecord,
  onOpenRecord,
  onDeleteRecord,
  onExportBackup,
  onImportBackup,
  onExportRecordPdf,
  onExportAllPdf,
}: KainHistoryPanelProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recordToDelete = deleteId ? records.find((r) => r.id === deleteId) : null;

  return (
    <div className="w-full max-w-2xl mx-auto step-enter">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-5">
          <Wallet className="w-7 h-7 text-primary" />
        </div>
        <h2 className="font-display text-3xl sm:text-4xl text-foreground mb-3">
          Earnings history
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Saved on this device automatically. Use backup only when moving phones or clearing browser
          data.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        {records.length > 0 && (
          <Button variant="outline" className="flex-1" onClick={onExportAllPdf}>
            <FileText className="w-4 h-4 mr-2" />
            Export all PDF
          </Button>
        )}
        <Button variant="outline" className="flex-1" onClick={onExportBackup}>
          <Download className="w-4 h-4 mr-2" />
          JSON backup
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          Import backup
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImportBackup(file);
            e.target.value = '';
          }}
        />
      </div>

      <Button
        onClick={onNewRecord}
        className="w-full mb-6 bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg rounded-xl"
      >
        <Plus className="w-5 h-5 mr-2" />
        Log new earnings
      </Button>

      {records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
          <p className="text-muted-foreground">No saved records yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Tap &quot;Log new earnings&quot; to track your first shifts.
          </p>
        </div>
      ) : (
        <ul className="space-y-3" aria-label="Saved earnings records">
          {records.map((record, index) => {
            const totals = calculateKainShiftTotals(record.shifts);
            const shiftDates = getShiftDateRangeLabel(record.shifts);
            const created = formatRecordTimestamp(record.createdAt);
            const updated = formatRecordTimestamp(record.updatedAt);

            return (
              <li
                key={record.id}
                className="stagger-fade-in rounded-xl border border-border bg-card shadow-sm overflow-hidden"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-stretch">
                  <button
                    type="button"
                    onClick={() => onOpenRecord(record.id)}
                    className="flex-1 flex items-center gap-4 p-4 text-left hover:bg-muted/40 transition-colors min-h-[72px]"
                  >
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">{record.label}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {shiftDates && <span>{shiftDates} · </span>}
                        {record.shifts.length} shift{record.shifts.length !== 1 ? 's' : ''} ·{' '}
                        {totals.totalHours.toFixed(1)} hrs
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Saved {created}
                        {record.updatedAt !== record.createdAt && ` · Updated ${updated}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(totals.totalEarnings)}
                      </p>
                      <p className="text-xs text-muted-foreground">total</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 hidden sm:block" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onExportRecordPdf(record.id)}
                    className="px-4 border-l border-border hover:bg-primary/10 transition-colors flex items-center justify-center min-w-[52px]"
                    aria-label={`Export ${record.label} as PDF`}
                  >
                    <FileText className="w-4 h-4 text-muted-foreground hover:text-primary" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(record.id)}
                    className="px-4 border-l border-border hover:bg-destructive/10 transition-colors flex items-center justify-center min-w-[52px]"
                    aria-label={`Delete ${record.label}`}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              {recordToDelete
                ? `"${recordToDelete.label}" will be removed permanently from this device.`
                : 'This record will be removed permanently.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) onDeleteRecord(deleteId);
                setDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
