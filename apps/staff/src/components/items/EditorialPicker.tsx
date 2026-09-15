import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { ContentImagePicker } from '../content/MediaLibrary';
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
}: {
  base: string;
  collection: 'artists' | 'releases' | 'distro' | 'media';
  label: string;
  value: string;
  selectedLabel?: string;
  onSelect(item: Choice): void;
}) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Choice[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedItem, setSelectedItem] = useState<Choice | null>(null);
  const [open, setOpen] = useState(false);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [requiredError, setRequiredError] = useState(false);
  const name = (item: Choice) => ('filename' in item ? item.filename : String(item.data.title ?? item.slug));
  async function search(next?: string) {
    setBusy(true);
    setMessage('');
    try {
      const params = new URLSearchParams({ limit: '25' });
      if (query.trim()) params.set('q', query.trim());
      if (next) params.set('cursor', next);
      const page = await editorialRequest<EditorialList<Choice>>(base, `content/${collection}?${params}`);
      setItems((previous) => (next ? [...previous, ...page.items] : page.items));
      setCursor(page.nextCursor);
      if (!page.items.length) setMessage('No matching records.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load records.');
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void search();
  }, []);
  function select(item: Choice) {
    setSelectedItem(item);
    onSelect(item);
    setOpen(false);
  }
  const selected = selectedItem?.id === value ? selectedItem : items.find((item) => item.id === value);
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        required
        value={value}
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
            aria-invalid={requiredError && !value}
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">
              {selected
                ? name(selected)
                : value
                  ? selectedLabel || 'Current selection'
                  : `Choose ${label.toLowerCase()}`}
            </span>
            <ChevronsUpDown className="size-4 shrink-0" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="cms-surface w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              aria-label={`Search ${label.toLowerCase()}`}
              value={query}
              disabled={busy}
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
            <div className="border-b p-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={busy}
                onClick={() => void search()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                Search {label.toLowerCase()}
              </Button>
            </div>
            <CommandList aria-label={label}>
              <CommandEmpty>{busy ? 'Loading' : 'No matching records.'}</CommandEmpty>
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
      {requiredError && !value && <FieldError>Choose {label.toLowerCase()} before saving.</FieldError>}
      {(busy || message) && (
        <p role="status" className="text-sm text-muted-foreground">
          {busy ? 'Loading' : message}
        </p>
      )}
    </Field>
  );
}

export default function EditorialPicker(props: Parameters<typeof RecordPicker>[0]) {
  if (props.collection === 'media')
    return <ContentImagePicker base={props.base} value={props.value} label={props.label} onSelect={props.onSelect} />;
  return <RecordPicker {...props} />;
}
