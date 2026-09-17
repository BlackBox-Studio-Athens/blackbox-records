import { useEffect, useId, useRef, useState } from 'react';
import '../../styles/content.css';
import { useStaffRead } from '../../lib/staff-query';
import { Check, ChevronDown, ImageIcon, LayoutGrid, List as ListIcon, Search, Upload } from 'lucide-react';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
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

function cropSuitability(item: EditorialMedia, cropRatio?: number) {
  if (!cropRatio || !item.width || !item.height) return '';
  const ratio = item.width / item.height;
  return Math.abs(ratio - cropRatio) <= 0.08 ? 'Fits this crop' : 'Check the crop';
}

function MediaImage({
  item,
  base,
  className = '',
  crop = false,
}: {
  item: EditorialMedia;
  base: string;
  className?: string;
  crop?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const url =
    typeof window === 'undefined' ? '' : editorialMediaUrl(item, new URL(base || window.location.origin).origin);
  return url && !failed ? (
    <img
      src={url}
      alt={item.alt ?? ''}
      loading="lazy"
      style={{ objectFit: crop ? 'cover' : 'contain' }}
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
  remembered,
  cropRatio,
}: {
  cropRatio?: number | undefined;
  remembered?: React.RefObject<{ query: string; view: 'grid' | 'list' }>;
  base: string;
  value?: string;
  onSelect?(item: EditorialMedia): void;
  disabled?: boolean;
}) {
  const id = useId();
  const [query, setQuery] = useState(remembered?.current.query ?? '');
  const [items, setItems] = useState<EditorialMedia[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [detail, setDetail] = useState<EditorialMedia | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(remembered?.current.view ?? 'grid');
  useEffect(() => {
    if (remembered) remembered.current = { query, view: viewMode };
  }, [remembered, query, viewMode]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const detailTrigger = useRef<HTMLElement | null>(null);
  const sequence = useRef(0);
  const busy = loading || uploading || disabled;

  useEffect(() => {
    if (!loading && (items.length === 0 || error)) setUploadOpen(true);
  }, [error, items.length, loading]);

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
      setMessage(error instanceof Error ? error.message : 'Images could not be loaded. Try again.');
    } finally {
      if (sequence.current === request) setLoading(false);
    }
  }
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (navigator.onLine) void search();
    }, 300);
    return () => {
      window.clearTimeout(timer);
      sequence.current++;
    };
  }, [base, query]);
  useStaffRead(['images', base, query], () => search(), { enabled: !uploading && !disabled });

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
      <div className="flex flex-wrap items-end justify-between gap-3">
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
        <div className="flex flex-wrap items-end gap-3">
          {error && (
            <Button type="button" variant="outline" disabled={busy} onClick={() => void search()}>
              Retry images
            </Button>
          )}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value === 'grid' || value === 'list') setViewMode(value);
            }}
            aria-label="Image view"
            className="cms-media-view-toggle"
          >
            <ToggleGroupItem value="grid" aria-label="Grid view" title="Grid view">
              <LayoutGrid aria-hidden="true" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view" title="List view">
              <ListIcon aria-hidden="true" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      {/* blocks.so/file-upload/file-upload-02: native upload field, adapted to the existing CMS command. */}
      <Collapsible open={uploadOpen} onOpenChange={setUploadOpen} className="grid gap-3">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Upload className="size-4" aria-hidden="true" />
              Upload images
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Add a JPG, PNG or WebP without publishing it.</p>
          </div>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="shrink-0">
              {uploadOpen ? 'Hide' : 'Upload'}
              <ChevronDown
                className={`size-4 transition-transform ${uploadOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <Field className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
            <FieldLabel htmlFor={`${id}-upload`}>Choose an image</FieldLabel>
            <Input
              id={`${id}-upload`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              aria-label="Upload an image"
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
        </CollapsibleContent>
      </Collapsible>
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
        className={viewMode === 'grid' ? 'cms-media-grid' : 'cms-media-list'}
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
                className={`cms-media-card relative h-auto min-w-0 gap-0 overflow-hidden p-0 text-left whitespace-normal aria-pressed:border-ring aria-pressed:ring-2 aria-pressed:ring-ring ${viewMode === 'grid' ? 'flex-col' : 'cms-media-list-card'}`}
                onClick={(event) => {
                  if (onSelect) onSelect(item);
                  else {
                    detailTrigger.current = event.currentTarget;
                    setDetail(item);
                  }
                }}
              >
                <AspectRatio ratio={cropRatio ?? 4 / 3} className="w-full bg-muted/30 p-2">
                  <MediaImage item={item} base={base} crop={!!cropRatio} />
                </AspectRatio>
                <span className="cms-media-filename w-full truncate border-t border-border p-3 text-sm">
                  {item.filename}
                </span>
                <span className="cms-media-meta w-full flex-wrap gap-x-3 gap-y-1 px-3 pb-3 text-xs text-muted-foreground">
                  {item.width && item.height && (
                    <span>
                      {item.width} × {item.height} px
                    </span>
                  )}
                  <span>{cropSuitability(item, cropRatio)}</span>
                </span>
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
                {detail.width && detail.height && (
                  <>
                    <dt className="mt-3 text-muted-foreground">Dimensions</dt>
                    <dd>
                      {detail.width} × {detail.height} px
                    </dd>
                  </>
                )}
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
  error,
  onBlur,
  path,
  hideLabel,
  cropRatio,
}: {
  cropRatio?: number | undefined;
  base: string;
  value: string;
  label: string;
  onSelect(item: EditorialMedia): void;
  disabled?: boolean;
  error?: string | undefined;
  onBlur?: (() => void) | undefined;
  path?: string | undefined;
  hideLabel?: boolean | undefined;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const remembered = useRef<{ query: string; view: 'grid' | 'list' }>({ query: '', view: 'grid' });
  const scrollPosition = useRef(0);
  const pickerContent = useRef<HTMLDivElement>(null);
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
  const fieldError = error || (failed ? 'This image could not be loaded. Choose it again.' : '');
  const errorId = `${id}-error`;
  return (
    <Field data-invalid={!!fieldError}>
      {!hideLabel && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <input
        id={`${id}-value`}
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
          {item?.width && item.height && (
            <p className="text-xs text-muted-foreground">
              {item.width} × {item.height} px
            </p>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                ref={trigger}
                id={id}
                data-content-path={path}
                type="button"
                variant="outline"
                disabled={disabled}
                aria-label={`${value ? 'Change' : 'Choose'} ${label.toLowerCase()}`}
                aria-invalid={!!fieldError || (requiredError && !value) || undefined}
                aria-describedby={fieldError ? errorId : undefined}
                onBlur={onBlur}
              >
                {value ? 'Change' : 'Choose'} {label.toLowerCase()}
              </Button>
            </SheetTrigger>
            <SheetContent
              ref={pickerContent}
              onScroll={(event) => {
                scrollPosition.current = event.currentTarget.scrollTop;
              }}
              onOpenAutoFocus={() =>
                requestAnimationFrame(() => {
                  if (pickerContent.current) pickerContent.current.scrollTop = scrollPosition.current;
                })
              }
              className="cms-surface w-full overflow-y-auto sm:max-w-3xl"
            >
              <SheetHeader>
                <SheetTitle>Choose {label.toLowerCase()}</SheetTitle>
                <SheetDescription>Select an image from the library or upload a new one.</SheetDescription>
              </SheetHeader>
              <div className="p-4 sm:p-6">
                {cropRatio && (
                  <p className="mb-4 text-sm text-muted-foreground">
                    {cropRatio === 0.75
                      ? 'Portraits use a centered 3:4 crop. Aim for 1800 × 2400 px, at least 1200 × 1600 px, with headroom and room at the sides.'
                      : 'Artwork uses a centered square crop. These previews show what will be visible.'}
                  </p>
                )}
                <MediaLibrary
                  cropRatio={cropRatio}
                  base={base}
                  remembered={remembered}
                  value={value}
                  disabled={disabled}
                  onSelect={(image) => {
                    setItem(image);
                    setRequiredError(false);
                    onSelect(image);
                    setOpen(false);
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <FieldError id={errorId}>
        {fieldError || (requiredError && !value ? `Choose ${label.toLowerCase()} before saving.` : '')}
      </FieldError>
    </Field>
  );
}
