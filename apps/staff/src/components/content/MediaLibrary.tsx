import { useEffect, useId, useRef, useState } from 'react';
import '../../styles/content.css';
import { Check, ImageIcon, Search, Upload } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Field, FieldLabel, FieldDescription, FieldError } from '../ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group';
import { AspectRatio } from '../ui/aspect-ratio';
import { Alert, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import { Spinner } from '../ui/spinner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '../ui/sheet';
import {
  editorialRequest,
  editorialMediaUrl,
  uploadArtwork,
  type EditorialMedia,
  type EditorialList,
} from '../../lib/backend/editorial-api';

export function MediaImage({ item, base, className = '' }: { item: EditorialMedia; base: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const url =
    typeof window === 'undefined' ? '' : editorialMediaUrl(item, new URL(base || window.location.origin).origin);
  return url && !failed ? (
    <img
      src={url}
      alt={item.alt ?? ''}
      loading="lazy"
      className={`h-full w-full object-contain ${className}`}
      onError={() => setFailed(true)}
    />
  ) : (
    <span className="flex h-full min-h-24 items-center justify-center gap-2 text-sm text-muted-foreground">
      <ImageIcon className="size-5" />
      Preview unavailable
    </span>
  );
}

export default function MediaLibrary({
  base,
  value,
  onSelect,
  disabled = false,
}: {
  base: string;
  value?: string;
  onSelect?(item: EditorialMedia): void;
  disabled?: boolean;
}) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<EditorialMedia[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [detail, setDetail] = useState<EditorialMedia | null>(null);
  const detailTrigger = useRef<HTMLElement | null>(null);
  const sequence = useRef(0);
  const busy = loading || uploading || disabled;

  async function search(next?: string) {
    const request = ++sequence.current;
    setLoading(true);
    setMessage('');
    setError(false);
    try {
      const params = new URLSearchParams({ limit: '25', mimeType: 'image/jpeg,image/png,image/webp' });
      if (query.trim()) params.set('q', query.trim());
      if (next) params.set('cursor', next);
      const page = await editorialRequest<EditorialList<EditorialMedia>>(base, `media?${params}`);
      if (sequence.current !== request) return;
      setItems((previous) => (next ? [...previous, ...page.items] : page.items));
      setCursor(page.nextCursor);
    } catch (error) {
      if (sequence.current !== request) return;
      setError(true);
      setMessage(error instanceof Error ? error.message : 'Images could not be loaded. Search to retry.');
    } finally {
      if (sequence.current === request) setLoading(false);
    }
  }
  useEffect(() => {
    void search();
    return () => {
      sequence.current++;
    };
  }, [base]);

  async function upload(file: File) {
    setUploading(true);
    setMessage('');
    setError(false);
    try {
      const item = await uploadArtwork(base, file);
      setItems((previous) => [item, ...previous.filter((row) => row.id !== item.id)]);
      setMessage(`${item.filename} uploaded. Select the image to use it in your draft.`);
      // Keep the upload field in view so its success message remains visible.
    } catch (error) {
      setError(true);
      setMessage(error instanceof Error ? error.message : 'The image could not be uploaded. Try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="cms-media grid min-w-0 gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <Field className="min-w-48 flex-1">
          <FieldLabel htmlFor={`${id}-search`}>Search images</FieldLabel>
          <InputGroup className="h-11">
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id={`${id}-search`}
              value={query}
              maxLength={200}
              placeholder="Search by filename…"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  if (!busy) void search();
                }
              }}
            />
          </InputGroup>
        </Field>
        <Button type="button" variant="outline" disabled={busy} onClick={() => void search()}>
          Search
        </Button>
      </div>
      {/* blocks.so/file-upload/file-upload-02: native upload field, adapted to the existing CMS command. */}
      <Field className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
        <FieldLabel htmlFor={`${id}-upload`}>
          <Upload className="size-4" aria-hidden="true" />
          Upload an image
        </FieldLabel>
        <Input
          id={`${id}-upload`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          aria-describedby={`${id}-upload-help`}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void upload(file);
          }}
        />
        <FieldDescription id={`${id}-upload-help`}>
          JPG, PNG or WebP, up to 20 MB. Uploading does not publish the image.
        </FieldDescription>
      </Field>
      {uploading && (
        <p role="status" className="flex items-center gap-2 text-sm">
          <Spinner className="size-4" />
          Uploading image…
        </p>
      )}
      {message && (
        <Alert variant={error ? 'destructive' : 'default'} role={error ? 'alert' : 'status'}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      <div
        aria-busy={loading}
        aria-label="Images"
        className="grid grid-cols-2 gap-3 @[36rem]:grid-cols-3 @[56rem]:grid-cols-4"
      >
        {loading && items.length === 0
          ? Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="aspect-square rounded-lg" />)
          : items.map((item) => (
              <Button
                key={item.id}
                aria-label={item.filename}
                type="button"
                variant="outline"
                disabled={busy}
                aria-pressed={onSelect ? value === item.id : undefined}
                className="relative h-auto min-w-0 flex-col gap-0 overflow-hidden p-0 text-left whitespace-normal aria-pressed:border-ring aria-pressed:ring-2 aria-pressed:ring-ring"
                onClick={(event) => {
                  if (onSelect) onSelect(item);
                  else {
                    detailTrigger.current = event.currentTarget;
                    setDetail(item);
                  }
                }}
              >
                <AspectRatio ratio={4 / 3} className="w-full bg-muted/30 p-2">
                  <MediaImage item={item} base={base} />
                </AspectRatio>
                <span className="w-full truncate border-t border-border p-3 text-sm">{item.filename}</span>
                {value === item.id && (
                  <span className="absolute top-2 right-2 rounded-full bg-primary p-1 text-primary-foreground">
                    <Check className="size-4" aria-hidden="true" />
                    <span className="sr-only">Selected</span>
                  </span>
                )}
              </Button>
            ))}
      </div>
      {loading && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading images…
        </p>
      )}
      {!loading && !error && items.length === 0 && (
        <div className="py-8 text-center">
          <ImageIcon className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">{query ? 'No matching images' : 'Your media library is empty'}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {query ? 'Try another filename or clear your search.' : 'Upload an image to use it across your content.'}
          </p>
        </div>
      )}
      {cursor && (
        <Button type="button" variant="outline" disabled={busy} onClick={() => void search(cursor)}>
          Show more images
        </Button>
      )}
      <Sheet
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <SheetContent
          className="cms-surface w-full overflow-y-auto sm:max-w-xl"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            detailTrigger.current?.focus();
          }}
        >
          <SheetHeader>
            <SheetTitle className="break-all pr-8">{detail?.filename}</SheetTitle>
            <SheetDescription>Image details. Changes to your content are saved separately.</SheetDescription>
          </SheetHeader>
          {detail && (
            <div className="grid gap-6 p-6">
              <AspectRatio ratio={1}>
                <MediaImage item={detail} base={base} />
              </AspectRatio>
              <dl className="grid gap-2 text-sm">
                <dt className="text-muted-foreground">Filename</dt>
                <dd className="break-all">{detail.filename}</dd>
                <dt className="mt-3 text-muted-foreground">Library description</dt>
                <dd>{detail.alt || 'No library description. Describe the image when adding it to content.'}</dd>
              </dl>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function ContentImagePicker({
  base,
  value,
  label,
  onSelect,
  disabled = false,
}: {
  base: string;
  value: string;
  label: string;
  onSelect(item: EditorialMedia): void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState<EditorialMedia | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setItem(null);
    setFailed(false);
    if (value)
      void editorialRequest<{ item: EditorialMedia }>(base, `media/${encodeURIComponent(value)}`)
        .then((result) => {
          if (active) setItem(result.item);
        })
        .catch(() => {
          if (active) setFailed(true);
        });
    return () => {
      active = false;
    };
  }, [base, value]);
  const trigger = useRef<HTMLButtonElement>(null);
  const [requiredError, setRequiredError] = useState(false);
  return (
    <Field>
      <span className="text-sm font-medium">{label}</span>
      <input
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        required
        disabled={disabled}
        value={value}
        onChange={() => {}}
        onInvalid={(event) => {
          event.preventDefault();
          setRequiredError(true);
          trigger.current?.focus();
        }}
      />
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border p-3">
        <div className="h-24 w-28 shrink-0 overflow-hidden rounded bg-muted/30">
          {item ? (
            <MediaImage item={item} base={base} />
          ) : value && !failed ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ImageIcon className="m-auto h-full w-6 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
        <div className="grid min-w-0 flex-1 gap-2">
          <p className="truncate text-sm text-muted-foreground">
            {item?.filename || (value ? 'Current image' : 'No image selected')}
          </p>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                ref={trigger}
                type="button"
                variant="outline"
                disabled={disabled}
                aria-invalid={requiredError && !value}
              >
                {value ? 'Change' : 'Choose'} {label.toLowerCase()}
              </Button>
            </SheetTrigger>
            <SheetContent className="cms-surface w-full overflow-y-auto sm:max-w-3xl">
              <SheetHeader>
                <SheetTitle>Choose {label.toLowerCase()}</SheetTitle>
                <SheetDescription>Select an image from the library or upload a new one.</SheetDescription>
              </SheetHeader>
              <div className="p-4 sm:p-6">
                <MediaLibrary
                  base={base}
                  value={value}
                  disabled={disabled}
                  onSelect={(image) => {
                    setItem(image);
                    onSelect(image);
                    setOpen(false);
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      {requiredError && !value && <FieldError>Choose {label.toLowerCase()} before saving.</FieldError>}
    </Field>
  );
}
