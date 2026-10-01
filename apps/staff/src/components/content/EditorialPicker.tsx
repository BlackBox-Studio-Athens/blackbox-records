import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { ContentImagePicker } from './MediaLibrary';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '../ui/command';
import { Field, FieldLabel, FieldError } from '../ui/field';
import { Button } from '../ui/button';
import {
  editorialRequest,
  type EditorialList,
  type EditorialMedia,
  type EditorialRecord,
} from '../../lib/backend/editorial-api';

type Choice = EditorialRecord | EditorialMedia;
function RecordPicker({
  base,
  collection,
  label,
  value,
  selectedLabel,
  onSelect,
  path,
  error,
  onBlur,
  required = true,
  onClear,
}: {
  base: string;
  collection: 'artists' | 'releases' | 'distro' | 'media';
  label: string;
  value: string;
  selectedLabel?: string;
  onSelect(item: Choice): void;
  path?: string | undefined;
  error?: string | undefined;
  onBlur?: (() => void) | undefined;
  required?: boolean;
  onClear?: () => void;
}) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Choice[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const requestSequence = useRef(0);
  const selectedRequestSequence = useRef(0);
  const selectionIdentity = JSON.stringify([base, collection, value]);
  const [selectedItem, setSelectedItem] = useState<{ identity: string; item: Choice } | null>(null);
  const [selectedLookupError, setSelectedLookupError] = useState(false);
  const [open, setOpen] = useState(false);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [requiredError, setRequiredError] = useState(false);
  const errorId = `${id}-error`;
  const fieldError = error || '';
  const name = (item: Choice) => ('filename' in item ? item.filename : String(item.data.title ?? item.slug));
  useEffect(() => {
    const request = ++selectedRequestSequence.current;
    if (!value) {
      setSelectedItem(null);
      setSelectedLookupError(false);
      return;
    }
    setSelectedLookupError(false);
    void editorialRequest<{ item: EditorialRecord }>(base, `content/${collection}/${encodeURIComponent(value)}`).then(
      ({ item }) => {
        if (request === selectedRequestSequence.current && item.id === value)
          setSelectedItem({ identity: selectionIdentity, item });
      },
      () => {
        if (request === selectedRequestSequence.current) setSelectedLookupError(true);
      },
    );
    return () => {
      selectedRequestSequence.current++;
    };
  }, [base, collection, value, selectionIdentity]);
  async function search(next?: string) {
    const request = ++requestSequence.current;
    setBusy(true);
    setMessage('');
    try {
      const params = new URLSearchParams({ limit: '25' });
      if (query.trim()) params.set('q', query.trim());
      if (next) params.set('cursor', next);
      const page = await editorialRequest<EditorialList<Choice>>(base, `content/${collection}?${params}`);
      if (request !== requestSequence.current) return;
      setItems((previous) => (next ? [...previous, ...page.items] : page.items));
      setCursor(page.nextCursor);
      if (!page.items.length) setMessage('No matches.');
    } catch (error) {
      if (request !== requestSequence.current) return;
      setMessage(error instanceof Error ? error.message : 'Could not load choices.');
    } finally {
      if (request === requestSequence.current) setBusy(false);
    }
  }
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      if (navigator.onLine && document.visibilityState === 'visible') void search();
    }, 300);
    return () => {
      window.clearTimeout(timer);
      requestSequence.current++;
    };
  }, [query, open]);
  function select(item: Choice) {
    setSelectedItem({ identity: JSON.stringify([base, collection, item.id]), item });
    setSelectedLookupError(false);
    setRequiredError(false);
    onSelect(item);
    setOpen(false);
  }
  const selected =
    (selectedItem?.identity === selectionIdentity ? selectedItem.item : undefined) ??
    items.find((item) => item.id === value);
  return (
    <Field data-invalid={!!fieldError || (requiredError && !value)}>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <input
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        required={required}
        value={value}
        aria-invalid={!!fieldError || (requiredError && !value) || undefined}
        aria-describedby={fieldError ? errorId : undefined}
        onChange={() => {}}
        onInvalid={(event) => {
          event.preventDefault();
          setRequiredError(true);
          trigger.current?.focus();
        }}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={trigger}
            data-content-path={path}
            aria-invalid={!!fieldError || (requiredError && !value) || undefined}
            aria-describedby={fieldError ? errorId : undefined}
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-label={label}
            aria-required={required}
            aria-expanded={open}
            className="w-full justify-between"
            onBlur={onBlur}
          >
            <span className="truncate">
              {selected
                ? name(selected)
                : value
                  ? selectedLookupError
                    ? `${label} unavailable`
                    : selectedLabel || `Loading ${label.toLowerCase()}…`
                  : `Choose ${label.toLowerCase()}`}
            </span>
            <ChevronsUpDown className="size-4 shrink-0" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="cms-surface editorial-picker-popover w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              aria-label={`Search ${label.toLowerCase()}`}
              value={query}
              onValueChange={(query) => {
                setQuery(query);
                setItems([]);
                setCursor(undefined);
              }}
              placeholder={`Search ${label.toLowerCase()}`}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !items.length) {
                  event.preventDefault();
                  if (!busy) void search();
                }
              }}
            />
            {message && (
              <div className="border-b p-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={busy}
                  onClick={() => void search()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  Retry {label.toLowerCase()}
                </Button>
              </div>
            )}
            <CommandList aria-label={label}>
              <CommandEmpty>{busy ? 'Loading' : 'No matches.'}</CommandEmpty>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  disabled={busy}
                  onSelect={() => select(item)}
                  className="min-h-11"
                >
                  <Check className={`size-4 ${value === item.id ? '' : 'invisible'}`} aria-hidden="true" />
                  {name(item)}
                </CommandItem>
              ))}
            </CommandList>
            {cursor && (
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => void search(cursor)}
                onKeyDown={(event) => event.stopPropagation()}
              >
                Show more
              </Button>
            )}
          </Command>
        </PopoverContent>
      </Popover>
      {!required && value && onClear && (
        <Button type="button" variant="ghost" className="min-h-11 justify-self-start" onClick={onClear}>
          Clear {label.toLowerCase()}
        </Button>
      )}
      <FieldError id={errorId}>
        {fieldError || (requiredError && !value ? `Choose ${label.toLowerCase()} before saving.` : '')}
      </FieldError>
      {(busy || message) && (
        <p role="status" className="text-sm text-muted-foreground">
          {busy ? 'Loading' : message}
        </p>
      )}
      {selectedLookupError && !selected && (
        <p role="status" className="text-sm text-muted-foreground">
          Could not load the selected {label.toLowerCase()} name.
        </p>
      )}
    </Field>
  );
}

export default function EditorialPicker(props: Parameters<typeof RecordPicker>[0]) {
  if (props.collection === 'media')
    return (
      <ContentImagePicker
        cropRatio={props.label === 'Artwork' ? 1 : props.label === 'Artist photo' ? 0.75 : undefined}
        base={props.base}
        value={props.value}
        label={props.label}
        onSelect={props.onSelect}
        error={props.error}
        onBlur={props.onBlur}
        path={props.path}
      />
    );
  return <RecordPicker {...props} />;
}
