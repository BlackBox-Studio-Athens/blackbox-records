import TracklistFields from './TracklistFields';
import CountryPicker from './CountryPicker';
import { artistLinkNames, genreSuggestions } from '@blackbox/content-model';
import { tracklistFormat, type Tracklist } from '@blackbox/content-model';
import { lazy, Suspense, useEffect, useState } from 'react';
import {
  ABOUT_STAT_KEYS,
  DISTRO_GROUP_VALUES,
  DISTRO_INTRO_FIELDS,
  SITE_PAGES,
  SOCIAL_PLATFORMS,
  proseBlocks,
  resolveProse,
  scalarProseFields,
  type AboutStatKey,
  type Prose,
  type RichText,
} from '@blackbox/content-model';
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Disc3,
  FileText,
  Hash,
  ImageIcon,
  LayoutTemplate,
  Link,
  ListOrdered,
  Mail,
  Music2,
  Plus,
  Tag,
  Trash2,
  Type,
  Users,
} from 'lucide-react';
import EditorialPicker from './EditorialPicker';
import { Button } from '../ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../ui/accordion';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '../ui/field';
import { Checkbox } from '../ui/checkbox';
import { NativeSelect } from '../ui/native-select';
import { ContentGalleryUploader, ContentImagePicker } from './MediaLibrary';
import {
  bandcampEmbedSrc,
  contentFieldErrors,
  youtubeVideoId,
  type ContentValidation,
} from '../publication/content-validation';
import { type ContentData, type ContentSection } from '../../lib/content-sections';

const ContentBodyEditor = lazy(() => import('./ContentBodyEditor'));

type ChoiceOption = string | { value: string; label: string };
const pageOptions = SITE_PAGES.map(({ path, label }) => ({ value: path, label: `${label} (${path})` }));
const statLabels: Record<AboutStatKey, string> = {
  artists: 'Number of artists',
  releases: 'Number of releases',
  countries: 'Number of artist countries',
  year: 'Years active',
};
const unchanged = (text: string) => text;
const youtubeWatchUrl = (id: string) =>
  id && youtubeVideoId(id) === id ? `https://www.youtube.com/watch?v=${id}` : id;
// Keeps a link name in lowercase-hyphen form while it is typed.
const linkNameInput = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-/, '');

export default function ContentFields({
  collection,
  data,
  onChange,
  base,
  editorIdentity,
  onAppendGalleryImages,
  onUploadPendingChange,
  disabled = false,
  validation,
  validationAttempt,
  onAddUpcomingRelease,
}: {
  collection: ContentSection;
  data: ContentData;
  onChange(data: ContentData): void;
  base: string;
  editorIdentity?: string;
  onAppendGalleryImages?: (request: {
    editorIdentity: string;
    collection: 'releases' | 'distro';
    images: Array<{ image: { id: string }; image_alt: string }>;
  }) => void;
  onUploadPendingChange?: (pending: boolean) => void;
  disabled?: boolean;
  validation: ContentValidation;
  validationAttempt: number;
  onAddUpcomingRelease?: (() => Promise<void>) | undefined;
}) {
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const [openSections, setOpenSections] = useState<string[]>([]);
  useEffect(() => {
    if (validationAttempt > 0) setOpenSections(['music', 'credits', 'text', 'presentation']);
  }, [validationAttempt]);
  function section(id: 'music' | 'credits' | 'text' | 'presentation', label: string, children: React.ReactNode) {
    const Icon = { music: Music2, credits: Users, text: FileText, presentation: LayoutTemplate }[id];
    return (
      <AccordionItem value={id}>
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            {Icon && <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />}
            {label}
          </span>
        </AccordionTrigger>
        <AccordionContent forceMount className="data-[state=closed]:hidden">
          <div className="grid min-w-0 gap-6 @2xl:grid-cols-2">{children}</div>
        </AccordionContent>
      </AccordionItem>
    );
  }
  function touch(path: string) {
    setTouched((current) => (current.has(path) ? current : new Set(current).add(path)));
  }
  function errors(path: string) {
    return validationAttempt > 0 || touched.has(path) ? contentFieldErrors(validation, path) : [];
  }
  function exactErrors(path: string) {
    return validationAttempt > 0 || touched.has(path) ? (validation.byPath[path] ?? []) : [];
  }
  function value(path: string): unknown {
    return path
      .split('.')
      .reduce<unknown>(
        (current, key) => (current && typeof current === 'object' ? (current as ContentData)[key] : undefined),
        data,
      );
  }
  function setFields(changes: Record<string, unknown>) {
    const updated = structuredClone(data);
    for (const [path, next] of Object.entries(changes)) {
      const parts = path.split('.');
      let parent = updated;
      for (const key of parts.slice(0, -1)) {
        if (!parent[key] || typeof parent[key] !== 'object') parent[key] = {};
        parent = parent[key] as ContentData;
      }
      parent[parts.at(-1)!] = next;
    }
    onChange(updated);
  }
  function set(path: string, next: unknown) {
    setFields({ [path]: next });
  }
  const fieldClass = 'min-h-11 w-full min-w-0';
  type FieldOptions = {
    multiline?: boolean;
    prose?: boolean;
    type?: string;
    required?: boolean;
    min?: number;
    max?: number;
    step?: number;
    list?: string;
    normalize?: (input: string) => string;
  };
  function field(path: string, label: string, options: FieldOptions = {}) {
    const required = options.required ?? true;
    if (options.prose || (options.multiline && path !== 'content.seller.address')) {
      const scalarFields: readonly string[] = scalarProseFields[collection as keyof typeof scalarProseFields] ?? [];
      const storagePath = scalarFields.includes(path) ? `${path}_rich` : path;
      const content =
        storagePath === path
          ? (value(path) as Prose | undefined)
          : resolveProse(value(path) as Prose | undefined, value(storagePath) as RichText | null | undefined);
      const id = `content-${path}`;
      const fieldErrors = errors(path);
      return (
        <Field className="col-span-full min-w-0" key={path} data-invalid={fieldErrors.length > 0}>
          <FieldLabel id={`${id}-label`} required={required} icon={FileText}>
            {label}
          </FieldLabel>
          <Suspense fallback={<p role="status">Loading text editor…</p>}>
            <ContentBodyEditor
              aria-labelledby={`${id}-label`}
              aria-describedby={`${id}-error`}
              aria-invalid={fieldErrors.length > 0}
              aria-required={required}
              data-content-path={path}
              editable={!disabled}
              value={proseBlocks(content) as never}
              onBlur={() => touch(path)}
              onChange={(next) => {
                touch(path);
                set(storagePath, next);
              }}
            />
          </Suspense>
          {options.required === false && <FieldDescription>Optional</FieldDescription>}
          <FieldError id={`${id}-error`}>{fieldErrors.join(' ')}</FieldError>
        </Field>
      );
    }
    const id = `content-${path}`;
    const errorId = `${id}-error`;
    const descriptionId = `${id}-description`;
    const fieldErrors = validationAttempt > 0 || touched.has(path) ? (validation.byPath[path] ?? []) : [];
    const describedBy = [options.required === false ? descriptionId : '', fieldErrors.length ? errorId : '']
      .filter(Boolean)
      .join(' ');
    const props = {
      id,
      'data-content-path': path,
      value: String(value(path) ?? ''),
      required,
      'aria-invalid': fieldErrors.length > 0 || undefined,
      'aria-describedby': describedBy || undefined,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const input = options.normalize ? options.normalize(event.target.value) : event.target.value;
        set(
          path,
          options.type === 'number'
            ? input === ''
              ? null
              : Number(input)
            : input || (options.required === false ? (path.includes('.') ? undefined : null) : ''),
        );
      },
      onBlur: () => touch(path),
    };
    return (
      <Field
        className={options.multiline ? 'col-span-full' : 'min-w-0'}
        data-invalid={fieldErrors.length > 0}
        key={path}
      >
        <FieldLabel
          htmlFor={props.id}
          required={required}
          icon={
            options.multiline
              ? FileText
              : options.type === 'url'
                ? Link
                : options.type === 'email'
                  ? Mail
                  : options.type === 'date'
                    ? CalendarDays
                    : options.type === 'number'
                      ? Hash
                      : Type
          }
        >
          {label}
        </FieldLabel>
        {options.multiline ? (
          <Textarea {...props} className={fieldClass} rows={4} />
        ) : (
          <Input
            {...props}
            type={options.type ?? 'text'}
            min={options.min}
            max={options.max}
            step={options.step}
            list={options.list}
          />
        )}
        {options.required === false && <FieldDescription id={descriptionId}>Optional</FieldDescription>}
        <FieldError id={errorId}>{fieldErrors.join(' ')}</FieldError>
      </Field>
    );
  }
  function check(path: string, label: string) {
    const fieldErrors = errors(path);
    const errorId = `content-${path}-error`;
    return (
      <Field orientation="horizontal" className="min-h-11" data-invalid={fieldErrors.length > 0}>
        <Checkbox
          id={`content-${path}`}
          data-content-path={path}
          checked={value(path) === true || value(path) === 1}
          disabled={disabled}
          aria-invalid={fieldErrors.length > 0 || undefined}
          aria-describedby={fieldErrors.length ? errorId : undefined}
          onBlur={() => touch(path)}
          onCheckedChange={(checked) => set(path, checked === true)}
        />
        <FieldLabel htmlFor={`content-${path}`}>{label}</FieldLabel>
        <FieldError id={errorId}>{fieldErrors.join(' ')}</FieldError>
      </Field>
    );
  }
  function choice(path: string, label: string, placeholder: string, options: readonly ChoiceOption[]) {
    const fieldErrors = errors(path);
    const id = `content-${path}`;
    const errorId = `${id}-error`;
    return (
      <Field data-invalid={fieldErrors.length > 0} key={path}>
        <FieldLabel htmlFor={id} required icon={Tag}>
          {label}
        </FieldLabel>
        <NativeSelect
          id={id}
          data-content-path={path}
          className={fieldClass}
          value={String(value(path) ?? '')}
          required
          disabled={disabled}
          aria-invalid={fieldErrors.length > 0 || undefined}
          aria-describedby={fieldErrors.length ? errorId : undefined}
          onBlur={() => touch(path)}
          onChange={(event) => set(path, event.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((option) =>
            typeof option === 'string' ? (
              <option key={option}>{option}</option>
            ) : (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ),
          )}
        </NativeSelect>
        <FieldError id={errorId}>{fieldErrors.join(' ')}</FieldError>
      </Field>
    );
  }
  function image(path: string, alt: string, label: string) {
    const reference = value(path) as { id?: string } | undefined;
    const fieldErrors = exactErrors(path);
    return (
      <FieldSet
        className="col-span-full min-w-0 gap-4 border-y border-border py-6"
        data-invalid={errors(path).length > 0}
      >
        <FieldLegend variant="label" required icon={ImageIcon}>
          {label}
        </FieldLegend>
        <FieldGroup className="gap-4">
          <ContentImagePicker
            cropRatio={collection === 'artists' ? 0.75 : ['releases', 'distro'].includes(collection) ? 1 : undefined}
            base={base}
            label={label}
            value={reference?.id ?? ''}
            disabled={disabled}
            error={fieldErrors.join(' ') || undefined}
            hideLabel
            onBlur={() => touch(path)}
            onSelect={(item) => {
              setFields({ [path]: { id: item.id }, [alt]: item.alt || String(data.title || label) });
            }}
            path={path}
          />
          <details>
            <summary className="cursor-pointer text-sm">Image description for accessibility</summary>
            <p className="my-2 text-sm text-muted-foreground">
              Filled from the image library or entry title. Change it when the image conveys more information.
            </p>
            {field(alt, 'Image description')}
          </details>
        </FieldGroup>
      </FieldSet>
    );
  }
  function rows(
    path: string,
    label: string,
    initial: unknown,
    render: (path: string, index: number) => React.ReactNode,
    { min = 0, max = Infinity }: { min?: number; max?: number } = {},
  ) {
    const items = Array.isArray(value(path)) ? (value(path) as unknown[]) : [];
    const fieldErrors = exactErrors(path);
    return (
      <FieldSet className="col-span-full grid min-w-0 gap-4" data-invalid={errors(path).length > 0}>
        <FieldLegend icon={path === 'gallery' ? ImageIcon : ListOrdered}>{label}</FieldLegend>
        {path === 'gallery' && (
          <FieldDescription>
            The first extra photo different from the main image appears on hover or keyboard focus. All gallery photos
            appear on the item page.
          </FieldDescription>
        )}
        <FieldError>{fieldErrors.join(' ')}</FieldError>
        {path === 'gallery' &&
          editorIdentity &&
          onAppendGalleryImages &&
          (collection === 'releases' || collection === 'distro') && (
            <ContentGalleryUploader
              base={base}
              editorIdentity={editorIdentity}
              disabled={disabled}
              {...(onUploadPendingChange ? { onUploadPendingChange } : {})}
              onUpload={(images) =>
                onAppendGalleryImages({
                  editorIdentity,
                  collection,
                  images: images.map((item) => ({
                    image: { id: item.id },
                    image_alt: item.alt || String(data.title || 'Photos'),
                  })),
                })
              }
            />
          )}
        <FieldGroup className="gap-4">
          {items.map((_, index) => (
            <div className="grid min-w-0 gap-4 border-t border-border pt-4" key={`${path}-${index}`}>
              {render(`${path}.${index}`, index)}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={index === 0}
                  onClick={() => {
                    const next = [...items];
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                    set(path, next);
                  }}
                >
                  <ArrowUp className="size-4" aria-hidden="true" />
                  Move up
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={index === items.length - 1}
                  onClick={() => {
                    const next = [...items];
                    [next[index], next[index + 1]] = [next[index + 1], next[index]];
                    set(path, next);
                  }}
                >
                  <ArrowDown className="size-4" aria-hidden="true" />
                  Move down
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={items.length <= min}
                  onClick={() =>
                    set(
                      path,
                      items.filter((_, i) => i !== index),
                    )
                  }
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remove row {index + 1}
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            disabled={items.length >= max}
            onClick={() => set(path, [...items, structuredClone(initial)])}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add row
          </Button>
        </FieldGroup>
      </FieldSet>
    );
  }
  function youtube(path: string) {
    return (
      <ParsedField
        path={path}
        label="YouTube URL"
        stored={String(value(path) ?? '')}
        parse={youtubeVideoId}
        show={youtubeWatchUrl}
        invalidMessage="Paste a YouTube video URL."
        onChange={(id) => set(path, id)}
        errors={errors(path)}
      />
    );
  }
  const bandcamp = (
    <ParsedField
      path="bandcamp_embed_url"
      label="Bandcamp player"
      stored={String(data.bandcamp_embed_url ?? '')}
      parse={bandcampEmbedSrc}
      invalidMessage="Paste the embed code from Bandcamp's Share/Embed, not the album page address."
      required={false}
      help="Optional. Paste the embed code from Bandcamp's Share/Embed."
      onChange={(next) => set('bandcamp_embed_url', next || null)}
      errors={errors('bandcamp_embed_url')}
    />
  );
  const body = (
    <FieldSet className="col-span-full grid min-w-0 gap-3" data-invalid={errors('body').length > 0}>
      <FieldLegend id="content-body-label" icon={FileText}>
        Full text
      </FieldLegend>
      <FieldGroup className="gap-3">
        <p id="content-body-help" className="text-sm text-muted-foreground">
          Add text, links and images. Tables, galleries and pasted HTML are not supported.
        </p>
        <Suspense fallback={<p>Loading text editor…</p>}>
          <ContentBodyEditor
            aria-labelledby="content-body-label"
            aria-describedby={errors('body').length ? 'content-body-help content-body-error' : 'content-body-help'}
            aria-invalid={errors('body').length > 0}
            data-content-path="body"
            editable={!disabled}
            value={(data.body ?? []) as never}
            onBlur={() => touch('body')}
            onChange={(body) => {
              touch('body');
              set('body', body);
            }}
          />
        </Suspense>
        <FieldError id="content-body-error">{errors('body').join(' ')}</FieldError>
      </FieldGroup>
    </FieldSet>
  );
  const isActiveArtist = data.is_active !== false && data.is_active !== 0;
  if (collection === 'artists')
    return (
      <>
        {field('title', 'Artist name')}
        <Field className="col-span-full" data-invalid={errors('is_active').length > 0}>
          <label className="flex min-h-11 items-center justify-between gap-4" htmlFor="content-is_active">
            <span className="grid gap-1">
              <span id="content-is_active-label" className="font-medium">
                Active artist
              </span>
              <span className="text-sm text-muted-foreground">{isActiveArtist ? 'Active' : 'Inactive'}</span>
            </span>
            <input
              id="content-is_active"
              data-content-path="is_active"
              type="checkbox"
              role="switch"
              className="peer sr-only"
              checked={isActiveArtist}
              disabled={disabled}
              aria-labelledby="content-is_active-label"
              aria-invalid={errors('is_active').length > 0 || undefined}
              aria-describedby={
                errors('is_active').length
                  ? 'content-is_active-description content-is_active-error'
                  : 'content-is_active-description'
              }
              onBlur={() => touch('is_active')}
              onChange={(event) => set('is_active', event.currentTarget.checked)}
            />
            <span
              aria-hidden="true"
              className="relative inline-flex h-6 w-11 shrink-0 rounded-full border border-border bg-muted transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-background after:content-[''] after:transition-transform peer-checked:border-primary peer-checked:bg-primary peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:opacity-50 motion-reduce:transition-none motion-reduce:after:transition-none"
            />
          </label>
          <FieldDescription id="content-is_active-description">
            Inactive artists appear last on the website after you publish changes.
          </FieldDescription>
          <FieldError id="content-is_active-error">{errors('is_active').join(' ')}</FieldError>
        </Field>
        {field('genre', 'Genre', { list: 'artist-genre-suggestions' })}
        <datalist id="artist-genre-suggestions">
          {genreSuggestions.map((genre) => (
            <option key={genre} value={genre} />
          ))}
        </datalist>
        <CountryPicker
          value={String(data.country ?? '')}
          onChange={(country) => set('country', country)}
          error={errors('country').join(' ') || undefined}
        />
        <h2 className="col-span-full text-lg font-semibold">Photography</h2>
        {image('image', 'image_alt', 'Artist image')}
        <p className="col-span-full text-sm text-muted-foreground">
          Artist photos fit inside a 3:4 portrait frame without cutting anyone off; any space left around them shows a
          blurred copy of the photo. Recommended: 1800 × 2400 px; minimum: 1200 × 1600 px. Originals are preserved.
        </p>
        <h2 className="col-span-full text-lg font-semibold">Biography</h2>
        {field('bio', 'Short biography', { multiline: true })}
        {rows('profile_links', 'Artist links', { label: 'Bandcamp', url: '' }, (path) => (
          <>
            <Field>
              <FieldLabel htmlFor={`content-${path}-service`} required icon={Link}>
                Service
              </FieldLabel>
              <NativeSelect
                id={`content-${path}-service`}
                aria-required="true"
                value={
                  artistLinkNames.includes(value(`${path}.label`) as (typeof artistLinkNames)[number])
                    ? String(value(`${path}.label`))
                    : 'Other'
                }
                onChange={(event) => set(`${path}.label`, event.target.value === 'Other' ? '' : event.target.value)}
              >
                {artistLinkNames.map((name) => (
                  <option key={name}>{name}</option>
                ))}
                <option>Other</option>
              </NativeSelect>
            </Field>
            {!artistLinkNames.includes(value(`${path}.label`) as (typeof artistLinkNames)[number]) &&
              field(`${path}.label`, 'Custom link name')}
            {field(`${path}.url`, 'Website address', { type: 'url' })}
          </>
        ))}
        {rows('videos', 'Videos', { title: '', youtube_video_id: '' }, (path) => (
          <>
            {field(`${path}.title`, 'Video title')}
            {youtube(`${path}.youtube_video_id`)}
            {field(`${path}.description`, 'Description', { multiline: true, required: false })}
          </>
        ))}
        <FieldSet className="col-span-full gap-3">
          <FieldLegend icon={Disc3}>Releases</FieldLegend>
          <FieldDescription>
            Create an upcoming release with its own artwork. Keep the same release when it comes out.
          </FieldDescription>
          {!!data.upcoming_release && (
            <p className="text-sm text-muted-foreground">
              Previous announcement: {String(data.upcoming_release)}. Move its details into the release record.
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={disabled || !String(data.title ?? '').trim()}
            onClick={() => void onAddUpcomingRelease?.()}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add upcoming release
          </Button>
          <a href="/content/?collection=releases" className="text-sm underline">
            Manage existing releases
          </a>
        </FieldSet>
        {body}
      </>
    );
  if (collection === 'releases')
    return (
      <>
        {field('title', 'Release title')}
        <EditorialPicker
          base={base}
          collection="artists"
          label="Artist"
          path="artist"
          value={String(data.artist ?? '')}
          error={errors('artist').join(' ') || undefined}
          onBlur={() => touch('artist')}
          onSelect={(item) => set('artist', item.id)}
        />
        <Field>
          <FieldLabel htmlFor="content-release_stage" icon={CalendarDays}>
            Release stage
          </FieldLabel>
          <NativeSelect
            id="content-release_stage"
            data-content-path="release_stage"
            value={String(data.release_stage || 'released')}
            onChange={(event) => set('release_stage', event.target.value)}
          >
            <option value="upcoming">Upcoming</option>
            <option value="released">Released</option>
          </NativeSelect>
          <FieldDescription>
            Upcoming announces a release or physical edition, even if the music is already out digitally. Choose
            Released when the release or edition is no longer forthcoming. Manage physical pre-orders and stock
            separately in Selling.
          </FieldDescription>
        </Field>
        {field('release_date', 'Digital release date', { type: 'date', required: data.release_stage !== 'upcoming' })}
        {field('releases_priority', 'Releases order', { type: 'number', required: false, min: 1, step: 1 })}
        <FieldDescription className="col-span-full">
          Optional. Lower numbers lead on Releases when the physical edition is available to buy. Leave empty for
          automatic order. Publish changes to apply this choice; stock and pre-order remain in Selling.
        </FieldDescription>
        {image('cover_image', 'cover_image_alt', 'Cover image')}
        {rows('gallery', 'Photos', { image: null, image_alt: '' }, (path) =>
          image(`${path}.image`, `${path}.image_alt`, 'Photo'),
        )}
        {field('summary', 'Short description', { multiline: true, required: false })}
        <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="col-span-full">
          {section(
            'music',
            'Music & listening links',
            <>
              {rows('singles', 'Singles', { title: '', url: '' }, (path) => (
                <>
                  {field(`${path}.title`, 'Single title')}
                  {field(`${path}.url`, 'Listening link', { type: 'url' })}
                </>
              ))}
              {rows('partner_links', 'Partner store links', { label: '', url: '' }, (path) => (
                <>
                  {field(`${path}.label`, 'Store name')}
                  {field(`${path}.url`, 'Store link', { type: 'url' })}
                </>
              ))}
              {rows('clips', 'Clips', { title: '', youtube_video_id: '' }, (path) => (
                <>
                  {field(`${path}.title`, 'Clip title')}
                  {youtube(`${path}.youtube_video_id`)}
                </>
              ))}
              <TracklistFields
                disabled={disabled}
                value={(data.tracklist as Tracklist | null) ?? null}
                formatHint={tracklistFormat(
                  (data.formats as string[] | undefined)?.find((format) => tracklistFormat(format)),
                )}
                onChange={(next) => set('tracklist', next)}
                errors={errors('tracklist')}
              />
              {field('merch_url', 'Merchandise link', { required: false })}
              {bandcamp}
              {field('tidal_url', 'Tidal link', { required: false })}
            </>,
          )}
          {section(
            'credits',
            'Formats & credits',
            <>
              {rows('formats', 'Formats', '', (path) => field(path, 'Format'))}
              {rows('credits', 'Credits', { role: '', name: '' }, (path) => (
                <>
                  {field(`${path}.role`, 'Role')}
                  {field(`${path}.name`, 'Name')}
                </>
              ))}
            </>,
          )}
          {section('text', 'Full text', body)}
        </Accordion>
      </>
    );
  if (collection === 'news')
    return (
      <>
        {field('title', 'News title')}
        <EditorialPicker
          base={base}
          collection="artists"
          label="Artist"
          path="artist"
          value={String(data.artist ?? '')}
          required={false}
          error={errors('artist').join(' ') || undefined}
          onBlur={() => touch('artist')}
          onSelect={(item) => set('artist', item.id)}
          onClear={() => set('artist', null)}
        />
        {field('date', 'Date', { type: 'date' })}
        {field('summary', 'Short description', { multiline: true })}
        {image('image', 'image_alt', 'News image')}
        {field('section_label', 'Section label', { required: false })}
        {body}
      </>
    );
  if (collection === 'distro')
    return (
      <>
        {field('title', 'Item title')}
        {field('artist_or_label', 'Artist or label')}
        {choice('group', 'Physical format', 'Choose a physical format', DISTRO_GROUP_VALUES)}
        {image('image', 'image_alt', 'Item image')}
        {field('summary', 'Short description', { multiline: true })}
        {rows('gallery', 'Photos', { image: null, image_alt: '' }, (path) =>
          image(`${path}.image`, `${path}.image_alt`, 'Photo'),
        )}
        <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="col-span-full">
          {section(
            'music',
            'Music & listening links',
            <>
              <TracklistFields
                disabled={disabled}
                value={(data.tracklist as Tracklist | null) ?? null}
                formatHint={tracklistFormat(String(data.format || data.group || ''))}
                onChange={(next) => set('tracklist', next)}
                errors={errors('tracklist')}
              />
              {bandcamp}
              {field('tidal_url', 'Tidal link', { required: false })}
            </>,
          )}
          {section(
            'presentation',
            'More item details',
            <>
              {field('eyebrow', 'Small heading', { required: false })}
              {field('format', 'Format description', { required: false })}
              {field('release_date', 'Release date', { type: 'date', required: false })}
              {field('order', 'Display order', { type: 'number', min: 0, step: 1 })}
            </>,
          )}
        </Accordion>
      </>
    );
  if (collection === 'home')
    return (
      <>
        <h2 className="col-span-full text-lg font-semibold">Opening content</h2>
        {field('hero.tagline', 'Opening text', { multiline: true })}
        {image('hero.image', 'hero.image_alt', 'Home image')}
        {field('hero.scroll_indicator_text', 'Scroll hint')}
        <details className="col-span-full">
          <summary className="min-h-11 cursor-pointer">News — currently hidden on the website</summary>
          <div className="grid gap-6">
            {field('news.title', 'News heading')}
            {field('news.link_text', 'News link text')}
            {choice('news.link_url', 'News link', 'Choose a page', pageOptions)}
          </div>
        </details>
        <h2 className="col-span-full text-lg font-semibold">Artist promotion</h2>
        {field('artists.title', 'Artists heading')}
        {field('artists.button_text', 'Artists button text')}
        {choice('artists.button_link', 'Artists button link', 'Choose a page', pageOptions)}
      </>
    );
  if (collection === 'about')
    return (
      <>
        {field('hero.section_label', 'Section label')}
        {field('hero.title', 'Page title')}
        {image('hero.image', 'hero.image_alt', 'Who we are image')}
        {field('lead.text', 'Opening text', { multiline: true })}
        <h2 className="col-span-full text-lg font-semibold">Our story</h2>
        {field('story.title', 'Story heading')}
        {rows('story.paragraphs', 'Story', '', (path) => field(path, 'Paragraph', { multiline: true }))}
        <h2 className="col-span-full text-lg font-semibold">Quote</h2>
        {data.quote ? (
          <>
            {field('quote.text', 'Quote', { multiline: true })}
            {field('quote.cite', 'Quote author')}
            <Button type="button" variant="outline" onClick={() => set('quote', null)}>
              <Trash2 className="size-4" aria-hidden="true" />
              Remove quote
            </Button>
          </>
        ) : (
          <Button type="button" variant="outline" onClick={() => set('quote', { text: '', cite: '' })}>
            <Plus className="size-4" aria-hidden="true" />
            Add quote
          </Button>
        )}
        <h2 className="col-span-full text-lg font-semibold">Contact</h2>
        {field('contact.title', 'Contact heading')}
        {field('contact.intro', 'Contact introduction', { multiline: true })}
        {rows('contact.items', 'Contact details', { label: '', value: '' }, (path) => (
          <>
            {field(`${path}.label`, 'Label')}
            {field(`${path}.value`, 'Email address', { type: 'email' })}
          </>
        ))}
        {rows('stats.items', 'Label facts', { key: '', label: '' }, (path) => (
          <>
            {choice(
              `${path}.key`,
              'Fact',
              'Choose a fact',
              ABOUT_STAT_KEYS.map((key) => ({ value: key, label: statLabels[key] })),
            )}
            {field(`${path}.label`, 'Description')}
          </>
        ))}
      </>
    );
  if (collection === 'services')
    return (
      <>
        {field('hero.title', 'Page title')}
        {field('hero.intro', 'Introduction', { multiline: true })}
        {field('hero.cta_text', 'Contact button text')}
        {rows(
          'services.items',
          'Services',
          { id: '', title: '', image: null, image_alt: '', summary: '', bullets: ['', ''], contact_note: '' },
          (path) => (
            <>
              {field(`${path}.id`, 'Link name (lowercase words separated by hyphens)', { normalize: linkNameInput })}
              {field(`${path}.title`, 'Service title')}
              {image(`${path}.image`, `${path}.image_alt`, 'Service image')}
              {field(`${path}.summary`, 'Summary', { multiline: true })}
              {rows(`${path}.bullets`, 'Service details', '', (item) => field(item, 'Detail', { prose: true }), {
                min: 2,
                max: 12,
              })}
              {field(`${path}.contact_note`, 'Contact note', { prose: true })}
              {field(`${path}.partner_name`, 'Partner name', { required: false })}
              {field(`${path}.partner_url`, 'Partner website', { type: 'url', required: false })}
            </>
          ),
        )}
        <h2 className="col-span-full text-lg font-semibold">How we work</h2>
        {field('process.title', 'Process heading')}
        {field('process.intro', 'Process introduction', { multiline: true })}
        {rows(
          'process.steps',
          'Process steps',
          { title: '', body: '' },
          (path) => (
            <>
              {field(`${path}.title`, 'Step title')}
              {field(`${path}.body`, 'Step text', { multiline: true })}
            </>
          ),
          { min: 3, max: 12 },
        )}
        <h2 className="col-span-full text-lg font-semibold">Contact form</h2>
        {field('inquiry.title', 'Contact form heading')}
        {field('inquiry.intro', 'Contact form introduction', { multiline: true })}
        {field('inquiry.email', 'Contact email', { type: 'email' })}
        {field('inquiry.submit_text', 'Send button text')}
      </>
    );
  if (collection === 'navigation')
    return (
      <>
        {field('title', 'Link text')}
        {choice('url', 'Page link', 'Choose a page', pageOptions)}
        <p className="col-span-full text-sm text-muted-foreground">
          Use Move up or Move down in the link list to change its position.
        </p>
        {check('show_in_header', 'Show in the main menu (top of the site and the phone Menu)')}
        {check('show_in_footer', 'Show at the bottom of the site')}
      </>
    );
  if (collection === 'socials')
    return (
      <>
        {choice('title', 'Platform', 'Choose a platform', SOCIAL_PLATFORMS)}
        <Field orientation="horizontal" className="min-h-11">
          <Checkbox
            id="content-url-hidden"
            checked={data.url === '#'}
            disabled={disabled}
            onCheckedChange={(checked) => set('url', checked === true ? '#' : '')}
          />
          <FieldLabel htmlFor="content-url-hidden">Hide this link on the website</FieldLabel>
        </Field>
        {data.url !== '#' && field('url', 'Profile link', { type: 'url' })}
        <p className="col-span-full text-sm text-muted-foreground">
          Use Move up or Move down in the link list to change its position.
        </p>
      </>
    );
  if (collection === 'newsletter')
    return (
      <>
        {field('section_label', 'Section label')}
        {field('title', 'Heading')}
        {field('description', 'Description', { multiline: true })}
        {field('placeholder', 'Example email', { type: 'email' })}
        {field('button_label', 'Button text')}
        {field('note', 'Small print', { multiline: true })}
      </>
    );
  if (collection === 'settings')
    return (
      <>
        {field('footer_text', 'Footer text', { required: false })}
        <FieldDescription className="col-span-full">
          The description below the logo at the bottom of every page. Leave blank to use the default label description.
        </FieldDescription>
        {field('label_name', 'Label name')}
        {field('established_year', 'Year established', { type: 'number', min: 1900, max: 2100, step: 1 })}
        <details className="col-span-full">
          <summary className="min-h-11 cursor-pointer">Search engines and label metadata</summary>
          <p className="mb-4 text-sm text-muted-foreground">
            These details describe the label to search engines; they do not change the visible page copy.
          </p>
          <div className="grid gap-6">
            {field('url', 'Label website', { type: 'url' })}
            {field('logo', 'Logo path')}
            {field('location.locality', 'City')}
            <CountryPicker
              single
              path="location.country"
              value={String(value('location.country') ?? '')}
              onChange={(country) => set('location.country', country)}
              error={errors('location.country').join(' ') || undefined}
            />
          </div>
        </details>
      </>
    );
  if (collection === 'distro_page')
    return (
      <>
        {field('hero.title', 'Page title')}
        {field('hero.intro', 'Introduction', { multiline: true })}
        {DISTRO_INTRO_FIELDS.map(({ name, label }) => field(`group_intros.${name}`, label, { multiline: true }))}
        {Object.keys((data.group_intros as object) ?? {})
          .filter((key) => !DISTRO_INTRO_FIELDS.some(({ name }) => name === key))
          .map((key) => field(`group_intros.${key}`, key.replaceAll('_', ' '), { multiline: true }))}
      </>
    );
  return (
    <>
      {choice('publication', 'Public wording approval', 'Choose approval state', [
        { value: 'pending', label: 'Awaiting review' },
        { value: 'approved', label: 'Approved by the label' },
      ])}
      {field('content.revision', 'Date of wording', { type: 'date' })}
      {field('content.seller.name', 'Seller name')}
      {field('content.seller.address', 'Seller address', { multiline: true })}
      {field('content.seller.support_email', 'Support email', { type: 'email' })}
      {(['terms', 'privacy'] as const).map((group) => (
        <section className="col-span-full grid gap-6" key={group}>
          <h2 className="text-2xl font-semibold">{group === 'terms' ? 'Purchase terms' : 'Privacy'}</h2>
          {(group === 'terms'
            ? ['dispatch', 'delivery', 'returns', 'damaged_items', 'uncollected_parcels']
            : ['purposes', 'recipients', 'retention', 'rights', 'contact']
          ).map((section) => (
            <div className="grid gap-4" key={section}>
              {field(`content.${group}.${section}.summary`, section.replaceAll('_', ' ') + ' summary', {
                multiline: true,
              })}
              {rows(
                `content.${group}.${section}.paragraphs`,
                'Full wording',
                '',
                (path) => field(path, 'Paragraph', { multiline: true }),
                { min: 1 },
              )}
            </div>
          ))}
        </section>
      ))}
    </>
  );
}

// Stores the canonical value parsed from pasted input; unparseable text stays so validation can report it.
function ParsedField({
  path,
  label,
  stored,
  parse,
  show = unchanged,
  invalidMessage,
  required = true,
  help,
  onChange,
  errors,
}: {
  path: string;
  label: string;
  stored: string;
  parse(input: string): string | null;
  show?: (stored: string) => string;
  invalidMessage: string;
  required?: boolean;
  help?: string;
  onChange(value: string): void;
  errors: string[];
}) {
  const [text, setText] = useState(() => show(stored));
  useEffect(() => {
    if (stored !== text && stored !== parse(text)) setText(show(stored));
  }, [stored, text, parse, show]);
  const invalid = !!text && !parse(text);
  const id = `content-${path}`;
  return (
    <Field data-invalid={invalid || !!errors.length}>
      <FieldLabel htmlFor={id} required={required} icon={Link}>
        {label}
      </FieldLabel>
      <Input
        id={id}
        data-content-path={path}
        value={text}
        aria-required={required}
        aria-invalid={invalid || !!errors.length}
        aria-describedby={help ? `${id}-help ${id}-error` : `${id}-error`}
        onChange={(event) => {
          setText(event.target.value);
          onChange(parse(event.target.value) ?? event.target.value);
        }}
      />
      {help && <FieldDescription id={`${id}-help`}>{help}</FieldDescription>}
      <FieldError id={`${id}-error`}>{invalid ? invalidMessage : errors.join(' ')}</FieldError>
    </Field>
  );
}
