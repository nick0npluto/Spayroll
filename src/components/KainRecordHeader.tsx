import { Tag } from 'lucide-react';

interface KainRecordHeaderProps {
  label: string;
  onLabelChange: (value: string) => void;
  isEditing: boolean;
}

export function KainRecordHeader({ label, onLabelChange, isEditing }: KainRecordHeaderProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 step-enter">
      <label htmlFor="kain-record-label" className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
        <Tag className="w-4 h-4 text-primary" />
        Record name
      </label>
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
          ? 'Update shifts below, then save to keep this record in your history.'
          : 'Name this period so you can find it later in your history.'}
      </p>
    </section>
  );
}
