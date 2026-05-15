import { Tag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KainRecordHeaderProps {
  label: string;
  onLabelChange: (value: string) => void;
  isEditing: boolean;
  onDelete?: () => void;
}

export function KainRecordHeader({
  label,
  onLabelChange,
  isEditing,
  onDelete,
}: KainRecordHeaderProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 step-enter">
      <div className="flex items-start justify-between gap-3 mb-2">
        <label
          htmlFor="kain-record-label"
          className="flex items-center gap-2 text-sm font-medium text-foreground"
        >
          <Tag className="w-4 h-4 text-primary" />
          Record name
        </label>
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete log
          </Button>
        )}
      </div>
      <input
        id="kain-record-label"
        type="text"
        value={label}
        onChange={(e) => onLabelChange(e.target.value)}
        placeholder="e.g. Week of May 15, 2026"
        className="input-premium w-full max-w-md text-sm"
      />
      <p className="text-xs text-muted-foreground mt-2">
        {isEditing
          ? 'Update shifts below, then save. Use Delete log to remove this entry from history.'
          : 'Name this period so you can find it later in your history.'}
      </p>
    </section>
  );
}
