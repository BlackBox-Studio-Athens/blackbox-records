import { useMemo, useState } from 'react';
import { Check, CircleAlert, ListChecks, Send, X } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Command, CommandInput } from '../ui/command';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../ui/empty';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useIsMobile } from '../../hooks/use-mobile';
import type { SelectedPublicationRecord, SelectedPublicationRequest } from '../../lib/backend/content-publication-api';

export type PublicationSelectionItem = SelectedPublicationRecord & {
  title: string;
};

type PublicationQueueProps = {
  records: PublicationSelectionItem[];
  staleRecordKeys?: string[];
  disabled?: boolean;
  blockedReason?: string | undefined;
  pendingPublication?: SelectedPublicationRequest | null;
  open: boolean;
  onOpenChange(open: boolean): void;
  onRemove(record: PublicationSelectionItem): void;
  onPublish(): void;
};

function recordKey(record: Pick<SelectedPublicationRecord, 'collection' | 'recordId'>) {
  return `${record.collection}/${record.recordId}`;
}

function QueuePanel({
  records,
  staleRecordKeys = [],
  disabled = false,
  blockedReason,
  pendingPublication = null,
  onRemove,
  onPublish,
}: Omit<PublicationQueueProps, 'open' | 'onOpenChange'>) {
  const [filter, setFilter] = useState('');
  const stale = new Set(staleRecordKeys);
  const canPublish = records.length > 0 && !disabled && !blockedReason;
  const filteredRecords = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase();
    if (!normalizedFilter) return records;
    return records.filter(
      (record) =>
        record.title.toLowerCase().includes(normalizedFilter) ||
        record.collection.toLowerCase().includes(normalizedFilter),
    );
  }, [filter, records]);
  const actionLabel = pendingPublication
    ? 'Retry publication'
    : records.length
      ? `Publish changes (${records.length})`
      : 'Publish changes';

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        Saved revisions in this queue will go live together. Save and add a record again after editing it.
      </p>
      {blockedReason && (
        <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-[var(--warning)]" aria-hidden="true" />
          <span>{blockedReason}</span>
        </div>
      )}
      {records.length ? (
        <>
          {records.length > 3 && (
            <Command shouldFilter={false} className="h-auto rounded-md border border-border bg-background">
              <CommandInput value={filter} onValueChange={setFilter} placeholder="Find a staged record…" />
            </Command>
          )}
          <ScrollArea className="max-h-72 pr-2">
            {filteredRecords.length ? (
              <ul className="grid gap-2" aria-label="Staged publication changes">
                {filteredRecords.map((record) => {
                  const isStale = stale.has(recordKey(record));
                  return (
                    <li
                      key={recordKey(record)}
                      className="flex min-w-0 items-start gap-3 rounded-md border border-border bg-muted/20 p-3"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-[var(--success)]" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" title={record.title}>
                          {record.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{record.collection}</p>
                        {isStale && (
                          <Badge variant="outline" className="mt-2 cms-state-warning">
                            Save and add again
                          </Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-9 shrink-0"
                        aria-label={`Remove ${record.title} from publication`}
                        disabled={disabled}
                        onClick={() => onRemove(record)}
                      >
                        <X className="size-4" aria-hidden="true" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                No staged records match “{filter}”.
              </p>
            )}
          </ScrollArea>
        </>
      ) : (
        <Empty className="p-5">
          <EmptyHeader>
            <EmptyMedia>
              <ListChecks aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>Nothing staged yet</EmptyTitle>
            <EmptyDescription>Save a draft, then add it to this publication.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      <Button type="button" className="w-full" disabled={!canPublish} onClick={onPublish}>
        <Send className="size-4" aria-hidden="true" />
        {actionLabel}
      </Button>
    </div>
  );
}

export default function PublicationQueue({
  records,
  staleRecordKeys = [],
  disabled = false,
  blockedReason,
  pendingPublication = null,
  open,
  onOpenChange,
  onRemove,
  onPublish,
}: PublicationQueueProps) {
  const mobile = useIsMobile();
  const trigger = (
    <Button
      type="button"
      variant={records.length ? 'secondary' : 'outline'}
      className="shrink-0"
      aria-haspopup="dialog"
      aria-label={`Staged changes${records.length ? ` (${records.length})` : ''}`}
    >
      <ListChecks className="size-4" aria-hidden="true" />
      <span className="hidden sm:inline">Staged changes</span>
      <Badge variant="outline">{records.length}</Badge>
    </Button>
  );
  const publishButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex shrink-0">
          <Button
            type="button"
            disabled={disabled || !records.length || !!blockedReason}
            onClick={onPublish}
            className="shrink-0"
          >
            <Send className="size-4" aria-hidden="true" />
            {pendingPublication
              ? 'Retry publication'
              : `Publish changes${records.length ? ` (${records.length})` : ''}`}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {blockedReason ?? (records.length ? 'Publish all staged saved revisions together.' : 'Add saved drafts first.')}
      </TooltipContent>
    </Tooltip>
  );
  const panel = (
    <QueuePanel
      records={records}
      staleRecordKeys={staleRecordKeys}
      disabled={disabled}
      blockedReason={blockedReason}
      pendingPublication={pendingPublication}
      onRemove={onRemove}
      onPublish={onPublish}
    />
  );

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
      {mobile ? (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetTrigger asChild>{trigger}</SheetTrigger>
          <SheetContent className="cms-surface overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Staged publication</SheetTitle>
              <SheetDescription>Review the saved revisions that will go live together.</SheetDescription>
            </SheetHeader>
            <div className="p-4">{panel}</div>
          </SheetContent>
        </Sheet>
      ) : (
        <Popover open={open} onOpenChange={onOpenChange}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent align="end" className="cms-surface w-96 max-w-[calc(100vw-2rem)]">
            <h2 className="mb-3 text-sm font-semibold">Staged publication</h2>
            {panel}
          </PopoverContent>
        </Popover>
      )}
      {publishButton}
    </div>
  );
}
