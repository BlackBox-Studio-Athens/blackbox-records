import TracklistFields from './TracklistFields';
import LineupFields, { type LineupEntry } from './LineupFields';
import BandcampField from './BandcampField';
import CountryPicker from './CountryPicker';
import { artistLinkNames, genreSuggestions } from '@blackbox/content-model';
import {
  formatArtistCountries,
  parseArtistCountries,
  readDistroTracklist,
  requiresProductCondition,
  slugify,
  tracklistFormat,
  type LinkService,
  type Tracklist,
} from '@blackbox/content-model';
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
  Link,
  ListOrdered,
  Mail,
  Plus,
  Tag,
  Trash2,
  Type,
} from 'lucide-react';
import EditorialPicker from './EditorialPicker';
import ProductSafetyFields from './ProductSafetyFields';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '../ui/field';
import { NativeSelect } from '../ui/native-select';
import { ContentGalleryUploader, ContentImagePicker } from './MediaLibrary';
import { contentFieldErrors, youtubeVideoId, type ContentValidation } from '../publication/content-validation';
import CatalogNumberField from './CatalogNumberField';
import EditorCards from './EditorCards';
import PriceList from './PriceList';
import { showCardSummaries, showCards, type ShowCardId } from './show-cards';
import {
  artistCardSummaries,
  artistCards,
  distroCardSummaries,
  distroCards,
  type DistroCardId,
  type ArtistCardId,
  newsCardSummaries,
  newsCards,
  releaseCardSummaries,
  releaseCards,
  websiteCardSummaries,
  websiteCards,
  type NewsCardId,
  type ReleaseCardId,
  type WebsiteSection,
} from './collection-cards';
import { useCollectionRecords } from './use-collection-records';
import Switch from '../fields/Switch';
import CountStepper from '../fields/CountStepper';
import SegmentedChoice from '../fields/SegmentedChoice';
import ChoiceChips from '../fields/ChoiceChips';
import DateField from '../fields/DateField';
import ProviderUrlField from '../fields/ProviderUrlField';
import TimeOfDayField from '../fields/TimeOfDayField';
import { type ContentData, type ContentSection } from '../../lib/content-sections';

const ContentBodyEditor = lazy(() => import('./ContentBodyEditor'));

type ChoiceOption = string | { value: string; label: string };
const conditionOptions: { value: 'new' | 'used'; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
];
const pageOptions = SITE_PAGES.map(({ path, label }) => ({ value: path, label: `${label} (${path})` }));
const statLabels: Record<AboutStatKey, string> = {
  artists: 'Number of artists',
  releases: 'Number of releases',
  countries: 'Number of artist countries',
  year: 'Years active',
};
const unchanged = (text: string) => text;
const defaultFormats = ['Vinyl', 'CD', 'Cassette', 'Digital'];
const defaultContactLabels = ['General', 'Demo Submissions', 'Press', 'Tour Booking'];
const artistLinkService: Record<string, LinkService> = {
  Bandcamp: 'bandcamp',
  Tidal: 'tidal',
  Instagram: 'instagram',
  Facebook: 'facebook',
  YouTube: 'youtube',
  SoundCloud: 'soundcloud',
};
const socialService: Record<string, LinkService> = {
  Instagram: 'instagram',
  Facebook: 'facebook',
  Bandcamp: 'bandcamp',
  Tidal: 'tidal',
};
const textList = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && !!item.trim()) : [];
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
  recordId,
  openPreorder = false,
  onAppendGalleryImages,
  onUploadPendingChange,
  onBandcampPendingChange,
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
  /** The saved record being edited, so its own catalog number reads as current rather than taken. */
  recordId?: string;
  /** The release's Store Item is an open pre-order, so Home shows it whatever Show on Home says. */
  openPreorder?: boolean;
  onAppendGalleryImages?: (request: {
    editorIdentity: string;
    collection: 'releases' | 'distro';
    images: Array<{ image: { id: string }; image_alt: string }>;
  }) => void;
  onUploadPendingChange?: (pending: boolean) => void;
  onBandcampPendingChange?: (pending: boolean) => void;
  disabled?: boolean;
  validation: ContentValidation;
  validationAttempt: number;
  onAddUpcomingRelease?: (() => Promise<void>) | undefined;
}) {
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  // Cards read artist names for summaries, and earlier records for the choices used before.
  const artistRecords = useCollectionRecords(
    base,
    ['shows', 'releases', 'news'].includes(collection) ? 'artists' : null,
  );
  const showRecords = useCollectionRecords(base, collection === 'shows' ? 'shows' : null);
  const releaseRecords = useCollectionRecords(base, collection === 'releases' ? 'releases' : null);
  const newsRecords = useCollectionRecords(base, collection === 'news' ? 'news' : null);
  const distroRecords = useCollectionRecords(base, collection === 'distro' ? 'distro' : null);
  const artistNames = new Map(artistRecords.map((record) => [record.id, String(record.data.title ?? record.slug)]));
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
  /** `clearToNull` stores an explicit blank choice as null, so saving clears the stored enum value. */
  function choice(
    path: string,
    label: string,
    placeholder: string,
    options: readonly ChoiceOption[],
    { required = true, clearToNull = false }: { required?: boolean; clearToNull?: boolean } = {},
  ) {
    const fieldErrors = errors(path);
    const id = `content-${path}`;
    const errorId = `${id}-error`;
    const descriptionId = `${id}-description`;
    const describedBy = [required ? '' : descriptionId, fieldErrors.length ? errorId : ''].filter(Boolean).join(' ');
    return (
      <Field data-invalid={fieldErrors.length > 0} key={path}>
        <FieldLabel htmlFor={id} required={required} icon={Tag}>
          {label}
        </FieldLabel>
        <NativeSelect
          id={id}
          data-content-path={path}
          className={fieldClass}
          value={String(value(path) ?? '')}
          required={required}
          disabled={disabled}
          aria-invalid={fieldErrors.length > 0 || undefined}
          aria-describedby={describedBy || undefined}
          onBlur={() => touch(path)}
          onChange={(event) => set(path, event.target.value || (clearToNull ? null : ''))}
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
        {!required && <FieldDescription id={descriptionId}>Optional</FieldDescription>}
        <FieldError id={errorId}>{fieldErrors.join(' ')}</FieldError>
      </Field>
    );
  }
  function edit(path: string) {
    return (next: unknown) => {
      touch(path);
      set(path, next);
    };
  }
  /** A link checked against its service; optional top-level links store null when cleared. */
  function linkField(path: string, label: string, service: LinkService | 'any', required = false) {
    return (
      <ProviderUrlField
        key={path}
        path={path}
        label={label}
        service={service}
        value={value(path)}
        required={required}
        anyMessage="Paste the full page address, starting with https://"
        errors={errors(path)}
        disabled={disabled}
        onChange={(next) => edit(path)(next ?? (required || path.includes('.') ? '' : null))}
        onBlur={() => touch(path)}
      />
    );
  }
  function conditionChoice() {
    const fieldErrors = errors('product_condition');
    const required = requiresProductCondition(collection, data);
    return (
      <Field className="min-w-0" data-invalid={fieldErrors.length > 0}>
        <SegmentedChoice
          label={required ? 'Physical condition' : 'Physical condition (optional)'}
          path="product_condition"
          value={
            data.product_condition === 'new' || data.product_condition === 'used' ? data.product_condition : undefined
          }
          options={conditionOptions}
          disabled={disabled}
          onChange={edit('product_condition')}
        />
        <FieldError>{fieldErrors.join(' ')}</FieldError>
      </Field>
    );
  }
  function websiteEditor(section: WebsiteSection, bodies: Record<string, React.ReactNode>) {
    const summaries = websiteCardSummaries(section, data);
    return (
      <EditorCards
        name={`${section}-${recordId ?? 'page'}`}
        data={data}
        validation={validation}
        cards={websiteCards[section].map((card) => ({
          ...card,
          summary: summaries[card.id] ?? '',
          content: bodies[card.id],
        }))}
      />
    );
  }
  /** `inCard` drops the section rule and shows the description field openly, for use inside an editor card. */
  function image(path: string, alt: string, label: string, { inCard = false }: { inCard?: boolean } = {}) {
    const reference = value(path) as { id?: string } | undefined;
    const fieldErrors = exactErrors(path);
    return (
      <FieldSet
        className={inCard ? 'col-span-full min-w-0 gap-4' : 'col-span-full min-w-0 gap-4 border-y border-border py-6'}
        data-invalid={errors(path).length > 0}
      >
        <FieldLegend variant="label" required icon={ImageIcon}>
          {label}
        </FieldLegend>
        <FieldGroup className="gap-4">
          <ContentImagePicker
            editorIdentity={editorIdentity}
            onUploadPendingChange={onUploadPendingChange}
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
          {inCard ? (
            <>
              {field(alt, 'Image description')}
              <p className="-mt-2 text-sm text-muted-foreground">
                Describe what the image shows for people who cannot see it, including any text on it.
              </p>
            </>
          ) : (
            <details>
              <summary className="cursor-pointer text-sm">Image description for accessibility</summary>
              <p className="my-2 text-sm text-muted-foreground">
                Filled from the image library or entry title. Change it when the image conveys more information.
              </p>
              {field(alt, 'Image description')}
            </details>
          )}
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
    <BandcampField
      key={editorIdentity}
      base={base}
      disabled={disabled}
      stored={String(data.bandcamp_embed_url ?? '')}
      onPendingChange={onBandcampPendingChange}
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
          Add text, links, images with captions, and YouTube or Vimeo videos. Tables, galleries and pasted HTML are not
          supported.
        </p>
        <Suspense fallback={<p>Loading text editor…</p>}>
          <ContentBodyEditor
            aria-labelledby="content-body-label"
            key={editorIdentity}
            base={base}
            fullText
            onUploadPendingChange={onUploadPendingChange}
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
  if (collection === 'artists') {
    const isActiveArtist = data.is_active !== false && data.is_active !== 0;
    const genre = typeof data.genre === 'string' ? data.genre : '';
    const bodies: Record<ArtistCardId, React.ReactNode> = {
      basics: (
        <>
          {field('title', 'Artist name')}
          <div className="col-span-full">
            <Switch
              id="content-is_active"
              path="is_active"
              label="Active artist"
              onLabel="Active"
              offLabel="Inactive"
              description="Inactive artists appear last on the website after you publish changes."
              checked={isActiveArtist}
              disabled={disabled}
              onChange={edit('is_active')}
            />
          </div>
          <div className="col-span-full min-w-0">
            <ChoiceChips
              path="genre"
              label="Genre"
              single
              required
              options={[...genreSuggestions]}
              value={genre ? [genre] : []}
              otherLabel="Other genre"
              maxLength={100}
              errors={errors('genre')}
              disabled={disabled}
              onChange={(next) => edit('genre')(next[0] ?? '')}
            />
          </div>
          <CountryPicker
            value={Array.isArray(data.country) ? formatArtistCountries(data.country) : String(data.country ?? '')}
            onChange={(country) => set('country', parseArtistCountries(country) ?? [])}
            error={errors('country').join(' ') || undefined}
          />
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
              className="w-fit"
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
        </>
      ),
      photo: (
        <>
          {image('image', 'image_alt', 'Artist image', { inCard: true })}
          <p className="col-span-full text-sm text-muted-foreground">
            Artist photos fit inside a 3:4 portrait frame without cutting anyone off; any space left around them shows a
            blurred copy of the photo. Recommended: 1800 × 2400 px; minimum: 1200 × 1600 px.
          </p>
        </>
      ),
      links: rows('profile_links', 'Artist links', { label: 'Bandcamp', url: '' }, (path) => {
        const label = String(value(`${path}.label`) ?? '');
        return (
          <>
            <div className="col-span-full min-w-0">
              <ChoiceChips
                path={`${path}.label`}
                label="Service"
                single
                required
                options={[...artistLinkNames]}
                value={label ? [label] : []}
                otherLabel="Other"
                maxLength={60}
                errors={exactErrors(`${path}.label`)}
                disabled={disabled}
                onChange={(next) => edit(`${path}.label`)(next[0] ?? '')}
              />
            </div>
            {linkField(
              `${path}.url`,
              label ? `${label} address` : 'Website address',
              artistLinkService[label] ?? 'any',
              true,
            )}
          </>
        );
      }),
      videos: rows('videos', 'Videos', { title: '', youtube_video_id: '' }, (path) => {
        const id = String(value(`${path}.youtube_video_id`) ?? '');
        return (
          <>
            {field(`${path}.title`, 'Video title')}
            {youtube(`${path}.youtube_video_id`)}
            {id && youtubeVideoId(id) === id && (
              <img
                src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`}
                alt=""
                loading="lazy"
                width={320}
                height={180}
                className="aspect-video w-full max-w-80 rounded-md border border-border object-cover"
              />
            )}
            {field(`${path}.description`, 'Description', { multiline: true, required: false })}
          </>
        );
      }),
      story: (
        <>
          {field('bio', 'Short biography', { multiline: true })}
          {body}
        </>
      ),
    };
    const summaries = artistCardSummaries(data);
    return (
      <EditorCards
        name={`artist-${recordId ?? 'new'}`}
        data={data}
        validation={validation}
        cards={artistCards.map((card) => ({ ...card, summary: summaries[card.id], content: bodies[card.id] }))}
      />
    );
  }
  if (collection === 'releases') {
    const usedFormats = [
      ...new Set([...defaultFormats, ...releaseRecords.flatMap((record) => textList(record.data.formats))]),
    ];
    const roleCounts = new Map<string, number>();
    for (const record of releaseRecords)
      for (const credit of Array.isArray(record.data.credits) ? record.data.credits : []) {
        const role = typeof credit?.role === 'string' ? credit.role.trim() : '';
        if (role) roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
      }
    const usedRoles = [...roleCounts]
      .sort((a, b) => b[1] - a[1])
      .map(([role]) => role)
      .slice(0, 12);
    const priority = typeof data.releases_priority === 'number' ? data.releases_priority : null;
    const bodies: Record<ReleaseCardId, React.ReactNode> = {
      basics: (
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
          <CatalogNumberField
            base={base}
            value={data.catalog_number}
            recordId={recordId}
            errors={errors('catalog_number')}
            disabled={disabled}
            onChange={(next) => set('catalog_number', next)}
            onBlur={() => touch('catalog_number')}
          />
          <Field>
            <SegmentedChoice
              label="Release stage"
              path="release_stage"
              value={data.release_stage === 'upcoming' ? 'upcoming' : 'released'}
              options={[
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'released', label: 'Released' },
              ]}
              disabled={disabled}
              onChange={edit('release_stage')}
            />
            <FieldDescription>
              Upcoming means the music is not out yet. Physical copies are managed in Selling.
            </FieldDescription>
          </Field>
          <DateField
            path="release_date"
            label="Digital release date"
            value={data.release_date}
            required={data.release_stage !== 'upcoming'}
            errors={errors('release_date')}
            disabled={disabled}
            onChange={edit('release_date')}
            onBlur={() => touch('release_date')}
          />
        </>
      ),
      artwork: (
        <>
          {image('cover_image', 'cover_image_alt', 'Cover image', { inCard: true })}
          {rows('gallery', 'Photos', { image: null, image_alt: '' }, (path) =>
            image(`${path}.image`, `${path}.image_alt`, 'Photo', { inCard: true }),
          )}
        </>
      ),
      formats: (
        <>
          <div className="col-span-full min-w-0">
            <ChoiceChips
              path="formats"
              label="Formats"
              options={usedFormats}
              value={textList(data.formats)}
              maxLength={100}
              description="Choose every edition of this release, or add another under Other."
              errors={exactErrors('formats')}
              disabled={disabled}
              onChange={edit('formats')}
            />
          </div>
          {conditionChoice()}
        </>
      ),
      listening: (
        <>
          {bandcamp}
          {linkField('tidal_url', 'Tidal link', 'tidal')}
          {rows('singles', 'Singles', { title: '', url: '' }, (path) => (
            <>
              {field(`${path}.title`, 'Single title')}
              {linkField(`${path}.url`, 'Listening link', 'any', true)}
            </>
          ))}
          {rows('clips', 'Clips', { title: '', youtube_video_id: '' }, (path) => (
            <>
              {field(`${path}.title`, 'Clip title')}
              {youtube(`${path}.youtube_video_id`)}
            </>
          ))}
          {rows('partner_links', 'Partner store links', { label: '', url: '' }, (path) => (
            <>
              {field(`${path}.label`, 'Store name')}
              {linkField(`${path}.url`, 'Store link', 'any', true)}
            </>
          ))}
          {linkField('merch_url', 'Merchandise link', 'any')}
        </>
      ),
      tracklist: (
        <TracklistFields
          disabled={disabled}
          value={(data.tracklist as Tracklist | null) ?? null}
          formatHint={tracklistFormat(textList(data.formats).find((format) => tracklistFormat(format)))}
          onChange={(next) => set('tracklist', next)}
          errors={errors('tracklist')}
        />
      ),
      credits: rows('credits', 'Credits', { role: '', name: '' }, (path) => {
        const role = value(`${path}.role`);
        return (
          <>
            <div className="col-span-full min-w-0">
              <ChoiceChips
                path={`${path}.role`}
                label="Role"
                single
                required
                options={usedRoles}
                value={typeof role === 'string' && role ? [role] : []}
                otherLabel="Other role"
                maxLength={200}
                errors={exactErrors(`${path}.role`)}
                disabled={disabled}
                onChange={(next) => edit(`${path}.role`)(next[0] ?? '')}
              />
            </div>
            {field(`${path}.name`, 'Name')}
          </>
        );
      }),
      text: (
        <>
          {field('summary', 'Short description', { multiline: true, required: false })}
          {body}
        </>
      ),
      home: (
        <>
          <div className="col-span-full">
            <Switch
              id="content-show_on_home"
              path="show_on_home"
              label="Show on Home"
              // EmDash returns its native boolean as 1 once saved.
              checked={openPreorder || data.show_on_home === true || data.show_on_home === 1}
              disabled={disabled || openPreorder}
              description={
                openPreorder
                  ? 'This release is on an open pre-order, so Home shows it automatically. This switch takes over when the pre-order closes.'
                  : 'Keeps this release as a full-width chapter on Home, with its video when one is prepared. A chapter shows only while the item is in stock or sold out.'
              }
              onChange={edit('show_on_home')}
            />
          </div>
          <FieldSet className="col-span-full min-w-0 gap-3" data-invalid={errors('releases_priority').length > 0}>
            <FieldLegend variant="label">Releases order</FieldLegend>
            <FieldDescription id="content-releases_priority-help">
              Lower numbers lead on Releases while the physical edition is available to buy.
            </FieldDescription>
            <SegmentedChoice
              label="Order"
              value={priority === null ? 'automatic' : 'fixed'}
              options={[
                { value: 'automatic', label: 'Automatic' },
                { value: 'fixed', label: 'Fixed position' },
              ]}
              disabled={disabled}
              onChange={(next) => edit('releases_priority')(next === 'automatic' ? null : (priority ?? 1))}
            />
            {priority !== null && (
              <CountStepper
                id="content-releases_priority"
                path="releases_priority"
                label="position"
                value={priority}
                min={1}
                max={99}
                disabled={disabled}
                invalid={errors('releases_priority').length > 0}
                describedBy="content-releases_priority-help"
                onChange={edit('releases_priority')}
              />
            )}
            <FieldError>{errors('releases_priority').join(' ')}</FieldError>
          </FieldSet>
        </>
      ),
      safety: (
        <ProductSafetyFields
          key={editorIdentity}
          inCard
          value={data.product_safety}
          disabled={disabled}
          validationAttempt={validationAttempt}
          onChange={(next) => set('product_safety', next)}
        />
      ),
    };
    const summaries = releaseCardSummaries(data, artistNames);
    return (
      <EditorCards
        name={`release-${recordId ?? 'new'}`}
        data={data}
        validation={validation}
        cards={releaseCards.map((card) => ({ ...card, summary: summaries[card.id], content: bodies[card.id] }))}
      />
    );
  }
  if (collection === 'news') {
    const sectionLabels = [
      ...new Set(
        newsRecords
          .map((record) => record.data.section_label)
          .filter((label): label is string => typeof label === 'string' && !!label.trim()),
      ),
    ];
    const sectionLabel = typeof data.section_label === 'string' ? data.section_label : '';
    const bodies: Record<NewsCardId, React.ReactNode> = {
      basics: (
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
          <DateField
            path="date"
            label="Date"
            value={data.date}
            errors={errors('date')}
            disabled={disabled}
            onChange={edit('date')}
            onBlur={() => touch('date')}
          />
          <div className="col-span-full min-w-0">
            <ChoiceChips
              path="section_label"
              label="Section label"
              single
              options={sectionLabels}
              value={sectionLabel ? [sectionLabel] : []}
              otherLabel="New label"
              maxLength={100}
              description="Optional small heading above the title. Choose one used before, or add a new one."
              errors={errors('section_label')}
              disabled={disabled}
              onChange={(next) => edit('section_label')(next[0] ?? null)}
            />
          </div>
        </>
      ),
      image: image('image', 'image_alt', 'News image', { inCard: true }),
      text: (
        <>
          {field('summary', 'Short description', { multiline: true })}
          {body}
        </>
      ),
    };
    const summaries = newsCardSummaries(data, artistNames);
    return (
      <EditorCards
        name={`news-${recordId ?? 'new'}`}
        data={data}
        validation={validation}
        cards={newsCards.map((card) => ({ ...card, summary: summaries[card.id], content: bodies[card.id] }))}
      />
    );
  }
  if (collection === 'shows') {
    const prices = Array.isArray(data.prices) ? data.prices.filter((price) => typeof price === 'number') : [];
    const venue = typeof data.venue === 'string' ? data.venue : '';
    const venues = [
      ...new Set(
        showRecords
          .map((record) => record.data.venue)
          .filter((used): used is string => typeof used === 'string' && !!used),
      ),
    ];
    const bodies: Record<ShowCardId, React.ReactNode> = {
      title: (
        <>
          {field('title', 'Show title')}
          {field('billing', 'Billing line', { required: false })}
        </>
      ),
      when: (
        <>
          <DateField
            path="date"
            label="Show date"
            value={data.date}
            errors={errors('date')}
            disabled={disabled}
            onChange={edit('date')}
            onBlur={() => touch('date')}
          />
          <TimeOfDayField
            path="doors"
            label="Doors open"
            value={data.doors}
            errors={errors('doors')}
            disabled={disabled}
            onChange={edit('doors')}
          />
        </>
      ),
      where: (
        <ChoiceChips
          path="venue"
          label="Venue"
          single
          required
          options={venues}
          value={venue ? [venue] : []}
          otherLabel="New venue"
          maxLength={200}
          description={venues.length ? 'Choose a venue used before, or add a new one.' : 'Add the venue name and city.'}
          errors={errors('venue')}
          disabled={disabled}
          onChange={(next) => edit('venue')(next[0] ?? '')}
        />
      ),
      tickets: (
        <>
          <PriceList
            path="prices"
            label="Ticket prices"
            value={prices}
            errors={exactErrors('prices')}
            disabled={disabled}
            onChange={edit('prices')}
          />
          <ProviderUrlField
            path="ticket_url"
            label="Ticket link"
            service="any"
            value={data.ticket_url}
            anyMessage="Paste the full ticket page address, starting with https://"
            errors={errors('ticket_url')}
            disabled={disabled}
            onChange={(next) => edit('ticket_url')(next ?? '')}
            onBlur={() => touch('ticket_url')}
          />
        </>
      ),
      lineup: (
        <LineupFields
          base={base}
          disabled={disabled}
          value={(Array.isArray(data.lineup) ? data.lineup : []) as LineupEntry[]}
          onChange={edit('lineup')}
          errorsFor={(path) => (validationAttempt > 0 || touched.has('lineup') ? (validation.byPath[path] ?? []) : [])}
        />
      ),
      poster: image('poster', 'poster_alt', 'Poster', { inCard: true }),
      links: (
        <ProviderUrlField
          path="facebook_url"
          label="Facebook event"
          service="facebook"
          value={data.facebook_url}
          required={false}
          errors={errors('facebook_url')}
          disabled={disabled}
          onChange={edit('facebook_url')}
          onBlur={() => touch('facebook_url')}
        />
      ),
    };
    const summaries = showCardSummaries(data, artistNames);
    return (
      <EditorCards
        name={`show-${recordId ?? 'new'}`}
        data={data}
        validation={validation}
        cards={showCards.map((card) => ({ ...card, summary: summaries[card.id], content: bodies[card.id] }))}
      />
    );
  }
  if (collection === 'distro') {
    const format = typeof data.format === 'string' ? data.format : '';
    const eyebrow = typeof data.eyebrow === 'string' ? data.eyebrow : '';
    const eyebrows = [
      ...new Set(
        distroRecords
          .map((record) => record.data.eyebrow)
          .filter((used): used is string => typeof used === 'string' && !!used.trim()),
      ),
    ];
    const order = typeof data.order === 'number' ? data.order : null;
    const bodies: Record<DistroCardId, React.ReactNode> = {
      basics: (
        <>
          {field('title', 'Item title')}
          {field('artist_or_label', 'Artist or label')}
          <div className="col-span-full min-w-0">
            <ChoiceChips
              path="format"
              label="Physical format"
              single
              required
              allowOther={false}
              options={[...DISTRO_GROUP_VALUES]}
              value={format ? [format] : []}
              errors={errors('format')}
              disabled={disabled}
              onChange={(next) => edit('format')(next[0] ?? '')}
            />
          </div>
          {conditionChoice()}
        </>
      ),
      image: (
        <>
          {image('image', 'image_alt', 'Item image', { inCard: true })}
          {rows('gallery', 'Photos', { image: null, image_alt: '' }, (path) =>
            image(`${path}.image`, `${path}.image_alt`, 'Photo', { inCard: true }),
          )}
        </>
      ),
      listening: (
        <>
          {bandcamp}
          {linkField('tidal_url', 'Tidal link', 'tidal')}
        </>
      ),
      tracklist: (
        <TracklistFields
          disabled={disabled}
          lockFormat
          value={readDistroTracklist(data.tracklist, format)}
          formatHint={tracklistFormat(format)}
          onChange={(next) => {
            // Distro stores only sides or discs; the item format gives the tracklist format.
            if (!next) return set('tracklist', null);
            const { format: _format, ...stored } = next;
            set('tracklist', stored);
          }}
          errors={errors('tracklist')}
        />
      ),
      text: field('summary', 'Short description', { multiline: true }),
      display: (
        <>
          <div className="col-span-full min-w-0">
            <ChoiceChips
              path="eyebrow"
              label="Small heading"
              single
              options={eyebrows}
              value={eyebrow ? [eyebrow] : []}
              otherLabel="New heading"
              maxLength={80}
              description="Optional. Choose one used before, or add a new one."
              errors={errors('eyebrow')}
              disabled={disabled}
              onChange={(next) => edit('eyebrow')(next[0] ?? null)}
            />
          </div>
          {field('format_override', 'Format shown instead', { required: false })}
          <DateField
            path="release_date"
            label="Release date"
            value={data.release_date}
            required={false}
            errors={errors('release_date')}
            disabled={disabled}
            onChange={edit('release_date')}
            onBlur={() => touch('release_date')}
          />
          <Field className="min-w-0" data-invalid={errors('order').length > 0}>
            <FieldLabel htmlFor="content-order" required icon={ListOrdered}>
              Display order
            </FieldLabel>
            <CountStepper
              id="content-order"
              path="order"
              label="position"
              value={order}
              min={0}
              disabled={disabled}
              invalid={errors('order').length > 0}
              onChange={edit('order')}
            />
            <FieldError>{errors('order').join(' ')}</FieldError>
          </Field>
        </>
      ),
      safety: (
        <ProductSafetyFields
          key={editorIdentity}
          inCard
          value={data.product_safety}
          disabled={disabled}
          validationAttempt={validationAttempt}
          onChange={(next) => set('product_safety', next)}
        />
      ),
    };
    const summaries = distroCardSummaries(data);
    return (
      <EditorCards
        name={`distro-${recordId ?? 'new'}`}
        data={data}
        validation={validation}
        cards={distroCards.map((card) => ({ ...card, summary: summaries[card.id], content: bodies[card.id] }))}
      />
    );
  }
  if (collection === 'home')
    return websiteEditor('home', {
      opening: (
        <>
          {field('hero.tagline', 'Opening text', { multiline: true })}
          {image('hero.image', 'hero.image_alt', 'Home image', { inCard: true })}
        </>
      ),
      artists: (
        <>
          {field('artists.title', 'Artists heading')}
          {field('artists.button_text', 'Artists button text')}
          {choice('artists.button_link', 'Artists button link', 'Choose a page', pageOptions)}
        </>
      ),
      news: (
        <>
          {field('news.title', 'News heading')}
          {field('news.link_text', 'News link text')}
          {choice('news.link_url', 'News link', 'Choose a page', pageOptions)}
        </>
      ),
    });
  if (collection === 'about') {
    const contactItems = Array.isArray(value('contact.items')) ? (value('contact.items') as ContentData[]) : [];
    const contactLabels = [
      ...new Set([
        ...defaultContactLabels,
        ...contactItems.map((item) => (typeof item.label === 'string' ? item.label.trim() : '')).filter(Boolean),
      ]),
    ];
    const facts = Array.isArray(value('stats.items')) ? (value('stats.items') as ContentData[]) : [];
    return websiteEditor('about', {
      opening: (
        <>
          {field('hero.section_label', 'Section label')}
          {field('hero.title', 'Page title')}
          {image('hero.image', 'hero.image_alt', 'Who we are image', { inCard: true })}
          {field('lead.text', 'Opening text', { multiline: true })}
        </>
      ),
      story: (
        <>
          {field('story.title', 'Story heading')}
          {rows('story.paragraphs', 'Story', '', (path) => field(path, 'Paragraph', { multiline: true }))}
        </>
      ),
      quote: data.quote ? (
        <>
          {field('quote.text', 'Quote', { multiline: true })}
          {field('quote.cite', 'Quote author')}
          <Button type="button" variant="outline" className="w-fit" onClick={() => set('quote', null)}>
            <Trash2 className="size-4" aria-hidden="true" />
            Remove quote
          </Button>
        </>
      ) : (
        <Button type="button" variant="outline" className="w-fit" onClick={() => set('quote', { text: '', cite: '' })}>
          <Plus className="size-4" aria-hidden="true" />
          Add quote
        </Button>
      ),
      contact: (
        <>
          {field('contact.title', 'Contact heading')}
          {field('contact.intro', 'Contact introduction', { multiline: true })}
          {rows('contact.items', 'Contact details', { label: '', value: '' }, (path) => {
            const label = value(`${path}.label`);
            return (
              <>
                <div className="col-span-full min-w-0">
                  <ChoiceChips
                    path={`${path}.label`}
                    label="What it is for"
                    single
                    required
                    options={contactLabels}
                    value={typeof label === 'string' && label ? [label] : []}
                    otherLabel="Other"
                    maxLength={80}
                    errors={exactErrors(`${path}.label`)}
                    disabled={disabled}
                    onChange={(next) => edit(`${path}.label`)(next[0] ?? '')}
                  />
                </div>
                {field(`${path}.value`, 'Email address', { type: 'email' })}
              </>
            );
          })}
        </>
      ),
      facts: rows(
        'stats.items',
        'Label facts',
        { key: ABOUT_STAT_KEYS.find((key) => !facts.some((fact) => fact.key === key)) ?? '', label: '' },
        (path, index) => (
          <>
            {choice(
              `${path}.key`,
              'Fact',
              'Choose a fact',
              ABOUT_STAT_KEYS.filter(
                (key) => key === facts[index]?.key || !facts.some((fact, other) => other !== index && fact.key === key),
              ).map((key) => ({ value: key, label: statLabels[key] })),
            )}
            {field(`${path}.label`, 'Description')}
          </>
        ),
        { max: ABOUT_STAT_KEYS.length },
      ),
    });
  }
  if (collection === 'navigation')
    return websiteEditor('navigation', {
      link: (
        <>
          {field('title', 'Link text')}
          {choice('url', 'Page link', 'Choose a page', pageOptions)}
          <p className="col-span-full text-sm text-muted-foreground">
            Use Move up or Move down in the link list to change its position.
          </p>
        </>
      ),
      placement: (
        <>
          <Switch
            id="content-show_in_header"
            path="show_in_header"
            label="Main menu"
            onLabel="Shown"
            offLabel="Hidden"
            description="The top of the site and the phone Menu."
            checked={value('show_in_header') === true || value('show_in_header') === 1}
            disabled={disabled}
            onChange={edit('show_in_header')}
          />
          <Switch
            id="content-show_in_footer"
            path="show_in_footer"
            label="Bottom of the site"
            onLabel="Shown"
            offLabel="Hidden"
            checked={value('show_in_footer') === true || value('show_in_footer') === 1}
            disabled={disabled}
            onChange={edit('show_in_footer')}
          />
        </>
      ),
    });
  if (collection === 'newsletter')
    return websiteEditor('newsletter', {
      text: (
        <>
          {field('section_label', 'Section label')}
          {field('title', 'Heading')}
          {field('description', 'Description', { multiline: true })}
        </>
      ),
      form: (
        <>
          {field('placeholder', 'Example email', { type: 'email' })}
          {field('button_label', 'Button text')}
          {field('note', 'Small print', { multiline: true })}
        </>
      ),
    });
  if (collection === 'settings') {
    const year = typeof data.established_year === 'number' ? data.established_year : null;
    return websiteEditor('settings', {
      label: (
        <>
          {field('label_name', 'Label name')}
          <Field className="min-w-0" data-invalid={errors('established_year').length > 0}>
            <FieldLabel htmlFor="content-established_year" required icon={CalendarDays}>
              Year established
            </FieldLabel>
            <CountStepper
              id="content-established_year"
              path="established_year"
              label="year"
              value={year}
              min={1900}
              max={new Date().getFullYear()}
              limitMessage="The year cannot be in the future."
              disabled={disabled}
              invalid={errors('established_year').length > 0}
              onChange={edit('established_year')}
            />
            <FieldError>{errors('established_year').join(' ')}</FieldError>
          </Field>
          {field('footer_text', 'Footer text', { required: false })}
          <FieldDescription className="col-span-full">
            The description below the logo at the bottom of every page. Leave blank to use the default label
            description.
          </FieldDescription>
        </>
      ),
      search: (
        <>
          <p className="col-span-full text-sm text-muted-foreground">
            These details describe the label to search engines; they do not change the visible page copy.
          </p>
          {linkField('url', 'Label website', 'any', true)}
          {field('logo', 'Logo path')}
          {field('location.locality', 'City')}
          <CountryPicker
            single
            path="location.country"
            value={String(value('location.country') ?? '')}
            onChange={(country) => set('location.country', country)}
            error={errors('location.country').join(' ') || undefined}
          />
        </>
      ),
    });
  }
  if (collection === 'distro_page')
    return websiteEditor('distro_page', {
      opening: (
        <>
          {field('hero.title', 'Page title')}
          {field('hero.intro', 'Introduction', { multiline: true })}
        </>
      ),
      groups: (
        <>
          {DISTRO_INTRO_FIELDS.map(({ name, label }) => field(`group_intros.${name}`, label, { multiline: true }))}
          {Object.keys((data.group_intros as object) ?? {})
            .filter((key) => !DISTRO_INTRO_FIELDS.some(({ name }) => name === key))
            .map((key) => field(`group_intros.${key}`, key.replaceAll('_', ' '), { multiline: true }))}
        </>
      ),
    });
  if (collection === 'purchase_information') {
    const wording = (group: 'terms' | 'privacy') =>
      (group === 'terms'
        ? ['dispatch', 'delivery', 'returns', 'damaged_items', 'uncollected_parcels']
        : ['purposes', 'recipients', 'retention', 'rights', 'contact']
      ).map((section) => (
        <div className="col-span-full grid gap-4" key={section}>
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
      ));
    return websiteEditor('purchase_information', {
      approval: (
        <>
          <Field className="min-w-0" data-invalid={errors('publication').length > 0}>
            <SegmentedChoice
              label="Public wording approval"
              path="publication"
              value={data.publication === 'approved' ? 'approved' : 'pending'}
              options={[
                { value: 'pending', label: 'Awaiting review' },
                { value: 'approved', label: 'Approved' },
              ]}
              disabled={disabled}
              onChange={edit('publication')}
            />
            <FieldError>{errors('publication').join(' ')}</FieldError>
          </Field>
          <DateField
            path="content.revision"
            label="Date of wording"
            value={value('content.revision')}
            errors={errors('content.revision')}
            disabled={disabled}
            onChange={edit('content.revision')}
            onBlur={() => touch('content.revision')}
          />
        </>
      ),
      seller: (
        <>
          {field('content.seller.name', 'Seller name')}
          {field('content.seller.support_email', 'Support email', { type: 'email' })}
          {field('content.seller.address', 'Seller address', { multiline: true })}
        </>
      ),
      terms: wording('terms'),
      privacy: wording('privacy'),
    });
  }
  if (collection === 'services')
    return websiteEditor('services', {
      opening: (
        <>
          {field('hero.title', 'Page title')}
          {field('hero.cta_text', 'Contact button text')}
          {field('hero.intro', 'Introduction', { multiline: true })}
        </>
      ),
      services: rows(
        'services.items',
        'Services',
        { id: '', title: '', image: null, image_alt: '', summary: '', bullets: ['', ''], contact_note: '' },
        (path) => (
          <>
            <Field className="min-w-0" data-invalid={exactErrors(`${path}.title`).length > 0}>
              <FieldLabel htmlFor={`content-${path}.title`} required icon={Type}>
                Service title
              </FieldLabel>
              <Input
                id={`content-${path}.title`}
                data-content-path={`${path}.title`}
                value={String(value(`${path}.title`) ?? '')}
                disabled={disabled}
                aria-invalid={exactErrors(`${path}.title`).length > 0 || undefined}
                onBlur={() => touch(`${path}.title`)}
                onChange={(event) => {
                  const previous = String(value(`${path}.title`) ?? '');
                  const id = String(value(`${path}.id`) ?? '');
                  // The link name follows the title until staff change it themselves.
                  const follows = !id || id === slugify(previous);
                  setFields({
                    [`${path}.title`]: event.target.value,
                    ...(follows ? { [`${path}.id`]: slugify(event.target.value) } : {}),
                  });
                }}
              />
              <FieldError>{exactErrors(`${path}.title`).join(' ')}</FieldError>
            </Field>
            <ServiceLinkName
              path={`${path}.id`}
              stored={String(value(`${path}.id`) ?? '')}
              errors={exactErrors(`${path}.id`)}
              disabled={disabled}
              onChange={(next) => edit(`${path}.id`)(linkNameInput(next))}
            />
            {image(`${path}.image`, `${path}.image_alt`, 'Service image', { inCard: true })}
            {field(`${path}.summary`, 'Summary', { multiline: true })}
            {rows(`${path}.bullets`, 'Service details', '', (item) => field(item, 'Detail', { prose: true }), {
              min: 2,
              max: 12,
            })}
            {field(`${path}.contact_note`, 'Contact note', { prose: true })}
            {field(`${path}.partner_name`, 'Partner name', { required: false })}
            {linkField(`${path}.partner_url`, 'Partner website', 'any')}
          </>
        ),
      ),
      process: (
        <>
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
        </>
      ),
      inquiry: (
        <>
          {field('inquiry.title', 'Contact form heading')}
          {field('inquiry.email', 'Contact email', { type: 'email' })}
          {field('inquiry.intro', 'Contact form introduction', { multiline: true })}
          {field('inquiry.submit_text', 'Send button text')}
        </>
      ),
    });
  if (collection === 'socials') {
    // Transition read: a stored "#" means hidden.
    const visible = data.visible === undefined ? data.url !== '#' : data.visible === true || data.visible === 1;
    const platform = typeof data.title === 'string' ? data.title : '';
    return websiteEditor('socials', {
      platform: (
        <div className="col-span-full min-w-0">
          <ChoiceChips
            path="title"
            label="Platform"
            single
            required
            allowOther={false}
            options={[...SOCIAL_PLATFORMS]}
            value={platform ? [platform] : []}
            errors={errors('title')}
            disabled={disabled}
            onChange={(next) => edit('title')(next[0] ?? '')}
          />
        </div>
      ),
      link: (
        <>
          <div className="col-span-full">
            <Switch
              id="content-visible"
              path="visible"
              label="Show on the website"
              onLabel="Shown"
              offLabel="Hidden"
              description="Use Move up or Move down in the link list to change its position."
              checked={visible}
              disabled={disabled}
              onChange={(checked) => setFields({ visible: checked, ...(data.url === '#' ? { url: '' } : {}) })}
            />
          </div>
          {linkField('url', 'Profile link', socialService[platform] ?? 'any', visible)}
        </>
      ),
    });
  }
  return null;
}

/** The service's link name: shown as the page address, editable only after Change. */
function ServiceLinkName({
  path,
  stored,
  errors,
  disabled,
  onChange,
}: {
  path: string;
  stored: string;
  errors: string[];
  disabled: boolean;
  onChange(value: string): void;
}) {
  const [editing, setEditing] = useState(false);
  const id = `content-${path}`;
  return (
    <Field className="min-w-0" data-invalid={errors.length > 0}>
      <FieldLabel htmlFor={editing ? id : undefined} icon={Link}>
        Link name
      </FieldLabel>
      {editing ? (
        <Input
          id={id}
          data-content-path={path}
          value={stored}
          disabled={disabled}
          aria-describedby={`${id}-help`}
          aria-invalid={errors.length > 0 || undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <div className="flex min-h-11 flex-wrap items-center gap-2">
          <code className="text-sm">/services#{stored || '…'}</code>
          <Button type="button" variant="ghost" disabled={disabled} onClick={() => setEditing(true)}>
            Change
          </Button>
        </div>
      )}
      <FieldDescription id={`${id}-help`}>
        Made from the service title. Changing it breaks links that people already shared.
      </FieldDescription>
      <FieldError>{errors.join(' ')}</FieldError>
    </Field>
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
