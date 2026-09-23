import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useDraftAutosave } from '../../hooks/use-draft-autosave';
import StaffBack from '../StaffBack';
import { returnStaffTask, staffLink } from '../../lib/staff-navigation';
import { Progress } from 'radix-ui';
import {
  DISTRO_GROUP_VALUES,
  proseBlocks,
  proseText,
  resolveProse,
  type Prose,
  type RichText,
} from '@blackbox/content-model';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import EditorialPicker from './EditorialPicker';
import NewArtistFields from './NewArtistFields';
import { euroMinor } from '../stock/ItemPriceEditor';
import { createInternalStockApi, type CatalogSetupCommand } from '../../lib/backend/internal-stock-api';
import {
  createEditorialDraft,
  editorialRequest,
  editorialSlug,
  type EditorialRecord,
} from '../../lib/backend/editorial-api';

const ContentBodyEditor = lazy(() => import('../content/ContentBodyEditor'));

function descriptionFields(summary: Prose) {
  return Array.isArray(summary) ? { summary_rich: summary } : { summary: summary.trim() };
}

export function releaseDetails(input: {
  title: string;
  artist: string;
  date: string;
  summary: Prose;
  image: string;
  alt: string;
  format: string;
}) {
  if (!input.title.trim() || !input.artist || !input.date || !input.image || !input.alt.trim())
    throw new Error('Complete the title, artist, date and artwork.');
  return {
    title: input.title.trim(),
    artist: input.artist,
    release_date: input.date,
    ...descriptionFields(input.summary),
    cover_image: { id: input.image },
    cover_image_alt: input.alt.trim(),
    formats: [input.format],
  };
}

export function setupCommand(input: {
  identity: string;
  kind: 'release' | 'distro' | 'merch';
  existing: EditorialRecord | null;
  title: string;
  artist: string;
  artistOrLabel: string;
  date: string;
  summary: Prose;
  image: string;
  alt: string;
  format: CatalogSetupCommand['itemType'];
  amount: string;
  minimum: string;
  maximum: string;
  custom: boolean;
  quantity: string;
}): CatalogSetupCommand {
  const openingQuantity = Number(input.quantity);
  if (!/^\d+$/.test(input.quantity) || !Number.isSafeInteger(openingQuantity) || openingQuantity > 2_147_483_647)
    throw new Error('Enter a whole number of copies, starting from zero.');
  const price: CatalogSetupCommand['price'] = input.custom
    ? {
        kind: 'pay_what_you_want',
        currencyCode: 'EUR',
        minimumAmountMinor: euroMinor(input.minimum),
        presetAmountMinor: euroMinor(input.amount),
        maximumAmountMinor: euroMinor(input.maximum),
      }
    : { kind: 'fixed', currencyCode: 'EUR', amountMinor: euroMinor(input.amount) };
  if (
    price.kind === 'pay_what_you_want' &&
    (price.minimumAmountMinor > price.presetAmountMinor || price.presetAmountMinor > price.maximumAmountMinor)
  )
    throw new Error('Suggested price must be between the minimum and maximum.');
  const sourceKind = input.kind === 'release' ? 'release' : 'distro';
  const title = input.existing ? String(input.existing.data.title) : input.title.trim();
  if (!title) throw new Error('Enter an item title.');
  const itemType =
    sourceKind === 'distro' && input.existing
      ? (input.existing.data.group as CatalogSetupCommand['itemType'])
      : input.format;
  if (!DISTRO_GROUP_VALUES.includes(itemType)) throw new Error('Choose a supported format.');
  if (input.kind === 'merch' && itemType !== 'Clothes') throw new Error('Choose clothing for Merch.');
  if (!input.existing && (!input.image || !input.alt.trim())) throw new Error('Choose artwork and describe the image.');
  if (!input.existing && sourceKind === 'release' && (!input.artist || !input.date))
    throw new Error('Choose an artist and release date.');
  return {
    operationId: input.identity,
    storeItemSlug: editorialSlug(`${title}-${itemType}`, input.identity),
    source: input.existing
      ? { mode: 'existing', sourceKind, id: input.existing.id }
      : {
          mode: 'create',
          sourceKind,
          slug: editorialSlug(title, input.identity),
          data:
            sourceKind === 'release'
              ? releaseDetails(input)
              : {
                  title,
                  artist_or_label: input.artistOrLabel.trim(),
                  ...descriptionFields(input.summary),
                  image: { id: input.image },
                  image_alt: input.alt.trim(),
                  group: itemType,
                  format: itemType,
                  order: 0,
                },
        },
    itemType,
    price,
    openingQuantity,
    confirmLiveSetup: true,
  };
}

export default function ItemSetupApp({ backendBaseUrl }: { backendBaseUrl: string }) {
  const [step, setStep] = useState(0);
  const draftDocument = useRef<{ item: EditorialRecord; _rev: string } | null>(null);
  const leaving = useRef(false);
  const [savedData, setSavedData] = useState('');
  const draftSlug = useRef('');
  const [ready, setReady] = useState(false);
  const [kind, setKind] = useState<'release' | 'distro' | 'merch'>('release');
  const [mode, setMode] = useState('new');
  const [existing, setExisting] = useState<EditorialRecord | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [artistName, setArtistName] = useState('');
  const [artistOrLabel, setArtistOrLabel] = useState('');
  const [date, setDate] = useState('');
  const [summary, setSummary] = useState<Prose>('');
  const [image, setImage] = useState('');
  const [alt, setAlt] = useState('');
  const [format, setFormat] = useState<CatalogSetupCommand['itemType']>('Vinyl 12-inch');
  const [amount, setAmount] = useState('');
  const [minimum, setMinimum] = useState('');
  const [maximum, setMaximum] = useState('');
  const [custom, setCustom] = useState(false);
  const [quantity, setQuantity] = useState('0');
  const [pending, setPending] = useState<CatalogSetupCommand | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [needsReview, setNeedsReview] = useState(false);
  const [completed, setCompleted] = useState('');
  const [sellRelease, setSellRelease] = useState(true);
  const [draftPending, setDraftPending] = useState<Parameters<typeof createEditorialDraft>[2] | null>(null);
  const [draftSaved, setDraftSaved] = useState('');
  const storageKey = `blackbox-item-setup:${backendBaseUrl}`;
  const draftKey = `blackbox-release-draft:${backendBaseUrl}`;
  const sell = kind !== 'release' || mode === 'existing' || sellRelease;
  const locked = !ready || busy || !!pending || !!draftPending || needsReview || !!completed || !!draftSaved;
  const setupReadiness = [
    {
      label: 'Details',
      ready:
        mode === 'existing'
          ? !!existing
          : !!title.trim() && !!proseText(summary).trim() && (kind !== 'release' || (!!artist && !!date)),
    },
    { label: 'Artwork', ready: mode === 'existing' || (!!image && !!alt.trim()) },
    {
      label: sell ? 'Price' : 'Shop setup skipped',
      ready: !sell || (!!amount.trim() && (!custom || (!!minimum.trim() && !!maximum.trim()))),
    },
    { label: sell ? 'Starting stock' : 'Release draft', ready: !sell || /^\d+$/.test(quantity) },
  ];
  const editorialData =
    kind === 'release'
      ? {
          title,
          artist,
          release_date: date,
          ...descriptionFields(summary),
          cover_image: image ? { id: image } : null,
          cover_image_alt: alt,
          formats: [format],
        }
      : {
          title,
          artist_or_label: artistOrLabel,
          ...descriptionFields(summary),
          image: image ? { id: image } : null,
          image_alt: alt,
          group: format,
          format,
          order: 0,
        };
  const editorialJson = JSON.stringify(editorialData);
  const autosave = useDraftAutosave({
    identity: kind,
    value: editorialData,
    dirty: mode === 'new' && !!title.trim() && editorialJson !== savedData,
    enabled: ready && !busy && !pending && !draftPending && !completed && !draftSaved,
    save: async (data) => {
      const collection = kind === 'release' ? 'releases' : 'distro';
      if (!draftSlug.current) draftSlug.current = editorialSlug(title, crypto.randomUUID());
      sessionStorage.setItem(
        `blackbox-catalog-draft:${backendBaseUrl}`,
        JSON.stringify({ collection, slug: draftSlug.current }),
      );
      const current = draftDocument.current;
      const result = current
        ? await editorialRequest<{ item: EditorialRecord; _rev: string }>(
            backendBaseUrl,
            `content/${collection}/${current.item.id}`,
            { _rev: current._rev, data },
            'PUT',
          )
        : await createEditorialDraft(backendBaseUrl, collection, { slug: draftSlug.current, data });
      draftDocument.current = result;
      if (!current) {
        draftDocument.current = await editorialRequest(
          backendBaseUrl,
          `content/${collection}/${result.item.id}`,
          { _rev: result._rev, data },
          'PUT',
        );
      }
    },
    saved: (data) => setSavedData(JSON.stringify(data)),
  });
  const unsaved = useRef(false);
  unsaved.current = mode === 'new' && !!title && savedData !== editorialJson;
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (unsaved.current) event.preventDefault();
    };
    const leave = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest<HTMLAnchorElement>('a[href]');
      if (
        !link ||
        link.origin !== location.origin ||
        link.target ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.button !== 0 ||
        !unsaved.current
      )
        return;
      event.preventDefault();
      if (leaving.current) return;
      leaving.current = true;
      void autosave.flush().then((saved) => {
        if (saved) {
          if (link.hasAttribute('data-staff-back')) returnStaffTask();
          else location.assign(staffLink(link.href));
        }
        leaving.current = false;
      });
    };
    window.addEventListener('beforeunload', warn);
    document.addEventListener('click', leave, true);
    return () => {
      window.removeEventListener('beforeunload', warn);
      document.removeEventListener('click', leave, true);
    };
  }, [autosave.flush]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedKind = params.get('kind');
    if (requestedKind === 'release' || requestedKind === 'distro' || requestedKind === 'merch') {
      setKind(requestedKind);
      setFormat(requestedKind === 'merch' ? 'Clothes' : 'Vinyl 12-inch');
    }
    const selectedCollection = params.get('collection');
    const selectedId = params.get('id');
    if (selectedId && (selectedCollection === 'releases' || selectedCollection === 'distro')) {
      setMode('existing');
      setKind(selectedCollection === 'releases' ? 'release' : 'distro');
      void editorialRequest<{ item: EditorialRecord }>(
        backendBaseUrl,
        `content/${selectedCollection}/${encodeURIComponent(selectedId)}`,
      )
        .then(({ item }) => {
          setExisting(item);
          setTitle(String(item.data.title));
          setReady(true);
        })
        .catch(() => setMessage('This title could not be loaded. Return to the catalog and try again.'));
    } else {
      const retained = sessionStorage.getItem(`blackbox-catalog-draft:${backendBaseUrl}`);
      if (retained) {
        try {
          const saved = JSON.parse(retained) as { collection: string; slug: string };
          if (!['releases', 'distro'].includes(saved.collection) || !/^[a-z0-9-]+$/.test(saved.slug))
            throw new Error('Invalid draft');
          if (requestedKind && (requestedKind === 'release') !== (saved.collection === 'releases')) {
            setReady(true);
          } else {
            draftSlug.current = saved.slug;
            void editorialRequest<{ item: EditorialRecord; _rev: string }>(
              backendBaseUrl,
              `content/${saved.collection}/${saved.slug}`,
            )
              .then((result) => {
                draftDocument.current = result;
                const data = result.item.data;
                setKind(saved.collection === 'releases' ? 'release' : data.group === 'Clothes' ? 'merch' : 'distro');
                setTitle(String(data.title ?? ''));
                setArtist(String(data.artist ?? ''));
                setArtistOrLabel(String(data.artist_or_label ?? ''));
                setDate(String(data.release_date ?? ''));
                setSummary(
                  resolveProse(data.summary as string | undefined, data.summary_rich as RichText | null | undefined),
                );
                const artwork = (data.cover_image ?? data.image) as { id?: string } | null;
                setImage(artwork?.id ?? '');
                setAlt(String(data.cover_image_alt ?? data.image_alt ?? ''));
                setFormat((Array.isArray(data.formats) ? data.formats[0] : data.group) as typeof format);
                setMessage('Your private draft has been restored.');
                setReady(true);
              })
              .catch(() => {
                setNeedsReview(true);
                setMessage('The last draft could not be checked. Return to the catalog before starting another.');
              });
          }
        } catch {
          setNeedsReview(true);
          setMessage('The last draft could not be restored. Return to the catalog.');
        }
      } else setReady(true);
    }
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      try {
        setPending(JSON.parse(saved) as CatalogSetupCommand);
        setMessage('Your last item is not confirmed. Select Check again.');
      } catch {
        setNeedsReview(true);
        setMessage('The saved item could not be read. Ask a label administrator for help.');
      }
    }
    const draft = sessionStorage.getItem(draftKey);
    if (draft && !saved) {
      try {
        setDraftPending(JSON.parse(draft));
        setSellRelease(false);
        setMessage('The last release draft is not confirmed. Select Check again.');
      } catch {
        setNeedsReview(true);
        setMessage('The saved release could not be read. Ask a label administrator for help.');
      }
    }
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || needsReview || completed || draftSaved) return;
    if (!pending && !draftPending && step < 2) {
      if (step === 0 && !setupReadiness.slice(0, 2).every((item) => item.ready)) {
        setMessage('Complete the title, description, artist, date and artwork before continuing.');
        return;
      }
      if (mode === 'new' && !(await autosave.flush())) return;
      setMessage('');
      setStep(step === 0 && !sell ? 2 : step + 1);
      return;
    }
    if (mode === 'new' && !pending && !draftPending && !(await autosave.flush())) return;
    setBusy(true);
    setMessage('');
    try {
      if (!sell) {
        if (draftDocument.current) {
          setDraftSaved(draftDocument.current.item.id);
          setMessage('Your release draft is ready to preview and publish.');
          sessionStorage.removeItem(`blackbox-catalog-draft:${backendBaseUrl}`);
          return;
        }
        const command = draftPending ?? {
          slug: editorialSlug(title, crypto.randomUUID()),
          data: releaseDetails({ title, artist, date, summary, image, alt, format }),
        };
        sessionStorage.setItem(draftKey, JSON.stringify(command));
        setDraftPending(command);
        const saved = await createEditorialDraft(backendBaseUrl, 'releases', command);
        sessionStorage.removeItem(draftKey);
        setDraftSaved(saved.item.id);
        setMessage('Release draft saved. No price or stock was created. It is not published yet.');
        return;
      }
      const command =
        pending ??
        setupCommand({
          identity: crypto.randomUUID(),
          kind,
          existing: mode === 'existing' ? existing : (draftDocument.current?.item ?? null),
          title,
          artist,
          artistOrLabel,
          date,
          summary,
          image,
          alt,
          format,
          amount,
          minimum,
          maximum,
          custom,
          quantity,
        });
      if (mode === 'existing' && !existing && !pending) throw new Error('Choose an existing title.');
      sessionStorage.setItem(storageKey, JSON.stringify(command));
      setPending(command);
      const result = await createInternalStockApi({ backendBaseUrl }).setupItem(command);
      if (result.status === 'completed') {
        sessionStorage.removeItem(storageKey);
        sessionStorage.removeItem(`blackbox-catalog-draft:${backendBaseUrl}`);
        setCompleted(result.variantId);
        setMessage('Item created. It is not published in the shop yet.');
      } else if (result.status === 'needs_review') {
        setNeedsReview(true);
        setMessage('We cannot finish this item. Ask a label administrator for help.');
      } else setMessage('The item is not finished. Select Check again.');
    } catch (error) {
      setMessage(
        error instanceof Error && !pending && !(error.name === 'InternalStockApiError')
          ? error.message
          : 'We could not confirm the item. Select Check again.',
      );
    } finally {
      setBusy(false);
    }
  }
  const inputClass = 'min-h-11 w-full min-w-0 border border-border bg-background p-2';
  return (
    <div className="staff-workspace staff-item-setup mx-auto grid max-w-3xl gap-8 px-4 py-8 sm:px-8">
      <header className="staff-workspace-hero grid gap-3">
        <StaffBack />
        <h1 className="text-3xl font-semibold tracking-tight">
          Add {kind === 'release' ? 'release' : kind === 'merch' ? 'merch' : 'distro'}
        </h1>
        <p>Website details stay private until you publish them.</p>
      </header>
      <Progress.Root
        value={step + 1}
        max={3}
        aria-label={`Step ${step + 1} of 3`}
        className="h-1 overflow-hidden bg-muted"
      >
        <Progress.Indicator className="h-full bg-primary" style={{ width: `${((step + 1) / 3) * 100}%` }} />
      </Progress.Root>
      <ol className="flex gap-4 text-sm" aria-label="Add to catalog">
        {['Details', 'Price & starting stock', 'Review'].map((label, index) => (
          <li key={label} aria-current={step === index ? 'step' : undefined}>
            {index + 1}. {label}
          </li>
        ))}
      </ol>
      <p role="status">
        {autosave.saving
          ? 'Saving…'
          : autosave.error
            ? `Not saved · ${autosave.error}`
            : savedData
              ? 'Changes saved privately'
              : ''}
      </p>
      {autosave.error && (
        <Button variant="outline" onClick={() => void autosave.flush()}>
          Retry save
        </Button>
      )}
      <form onSubmit={submit} className="staff-form grid gap-8">
        <fieldset hidden={step !== 0} disabled={locked || step !== 0} className="staff-form-section grid min-w-0 gap-5">
          <legend className="staff-section-title mb-4 text-xl font-semibold">Details</legend>
          {mode === 'existing' ? (
            <EditorialPicker
              key={kind}
              base={backendBaseUrl}
              collection={kind === 'release' ? 'releases' : 'distro'}
              label="Selected title"
              value={existing?.id ?? ''}
              onSelect={(item) => {
                if ('data' in item) setExisting(item);
              }}
            />
          ) : (
            <>
              <label className="grid gap-2">
                Title
                <Input required maxLength={250} value={title} onChange={(event) => setTitle(event.target.value)} />
              </label>
              {kind === 'release' ? (
                <>
                  <EditorialPicker
                    base={backendBaseUrl}
                    collection="artists"
                    label="Artist"
                    value={artist}
                    selectedLabel={artistName}
                    onSelect={(item) => setArtist(item.id)}
                  />
                  <NewArtistFields
                    base={backendBaseUrl}
                    onCreated={(item) => {
                      setArtist(item.id);
                      setArtistName(String(item.data.title));
                    }}
                  />
                  <label className="grid gap-2">
                    Release date
                    <Input required type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                  </label>
                </>
              ) : (
                <label className="grid gap-2">
                  Artist or label
                  <Input required value={artistOrLabel} onChange={(event) => setArtistOrLabel(event.target.value)} />
                </label>
              )}
              <div className="grid gap-2">
                <span id="item-summary-label">Short description</span>
                <Suspense fallback={<p role="status">Loading text editor…</p>}>
                  <ContentBodyEditor
                    aria-labelledby="item-summary-label"
                    editable={!locked}
                    value={proseBlocks(summary) as never}
                    onChange={(value) => setSummary(value as RichText)}
                  />
                </Suspense>
              </div>
              <EditorialPicker
                base={backendBaseUrl}
                collection="media"
                label="Artwork"
                value={image}
                onSelect={(item) => {
                  setImage(item.id);
                  if ('alt' in item && item.alt) setAlt(item.alt);
                }}
              />
              <label className="grid gap-2">
                Describe the artwork
                <Input required value={alt} onChange={(event) => setAlt(event.target.value)} />
                <span className="text-sm text-muted-foreground">
                  Describe what is visible for people who cannot see the image.
                </span>
              </label>
            </>
          )}
          {!(mode === 'existing' && kind !== 'release') && (
            <label className="grid gap-2">
              Format
              <select
                className={inputClass}
                value={format}
                onChange={(event) => setFormat(event.target.value as typeof format)}
              >
                {DISTRO_GROUP_VALUES.filter((item) => kind !== 'merch' || item === 'Clothes').map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          )}
          {existing && kind !== 'release' && <p>Format: {String(existing.data.group)}</p>}
          {kind === 'release' && mode === 'new' && (
            <label className="flex min-h-11 items-center gap-3">
              <input type="checkbox" checked={sellRelease} onChange={(event) => setSellRelease(event.target.checked)} />
              Sell this release in the shop
            </label>
          )}
        </fieldset>
        {sell && (
          <fieldset
            hidden={step !== 1}
            disabled={locked || step !== 1}
            className="staff-form-section grid min-w-0 gap-5"
          >
            <legend className="staff-section-title mb-4 text-xl font-semibold">Price & starting stock</legend>
            <label className="flex min-h-11 items-center gap-3">
              <input type="checkbox" checked={custom} onChange={(event) => setCustom(event.target.checked)} />
              Let buyers choose what to pay
            </label>
            {custom && (
              <label className="grid gap-2">
                Minimum price (EUR)
                <Input
                  required
                  inputMode="decimal"
                  value={minimum}
                  onChange={(event) => setMinimum(event.target.value)}
                />
              </label>
            )}
            <label className="grid gap-2">
              {custom ? 'Suggested price (EUR)' : 'Price (EUR)'}
              <Input
                required
                inputMode="decimal"
                placeholder="e.g. 25,00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
            {custom && (
              <label className="grid gap-2">
                Maximum price (EUR)
                <Input
                  required
                  inputMode="decimal"
                  value={maximum}
                  onChange={(event) => setMaximum(event.target.value)}
                />
              </label>
            )}
            <label className="grid gap-2">
              How many {kind === 'merch' ? 'units' : 'copies'} do you have?
              <Input
                required
                type="number"
                min={0}
                step={1}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
              <span className="text-sm text-muted-foreground">
                These {kind === 'merch' ? 'units' : 'copies'} will also be available to buy online when the item is
                published.
              </span>
            </label>
          </fieldset>
        )}
        {step === 2 && (
          <section className="staff-readiness" aria-label="Item setup readiness">
            <div>
              <p className="staff-section-title">Ready to continue</p>
              <p className="text-sm text-muted-foreground">Complete the required steps before checking the item.</p>
            </div>
            <div className="staff-readiness-items">
              {setupReadiness.map((item) => (
                <div key={item.label} className={item.ready ? 'staff-readiness-item is-ready' : 'staff-readiness-item'}>
                  {item.ready ? <CheckCircle2 aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
                  <span>{item.label}</span>
                  <span className="sr-only">{item.ready ? 'ready' : 'needs attention'}</span>
                </div>
              ))}
            </div>
            <p>
              {title || String(existing?.data.title ?? '')}
              {sell
                ? ` · ${format} · EUR ${amount} · ${quantity} ${kind === 'merch' ? 'units' : 'copies'} available to buy online`
                : ' · Website only'}
            </p>
            {sell && !pending && (
              <label className="flex min-h-11 items-center gap-3">
                <input type="checkbox" required />I confirm this price and starting stock
              </label>
            )}
          </section>
        )}
        {step > 0 && !pending && !draftPending && !completed && !draftSaved && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => setStep(step === 2 && !sell ? 0 : step - 1)}
          >
            {step === 1 || !sell ? 'Back to details' : 'Back to price & starting stock'}
          </Button>
        )}
        {!completed && !draftSaved && (
          <Button type="submit" disabled={!ready || busy || needsReview}>
            {busy
              ? 'Checking item…'
              : pending || draftPending
                ? 'Check again'
                : step < 2
                  ? 'Continue'
                  : sell
                    ? 'Confirm price and starting stock'
                    : 'Save release draft'}
          </Button>
        )}
        {message && <p role="status">{message}</p>}
        {draftSaved && (
          <a className="min-h-11 underline" href={`/content/?collection=releases&id=${encodeURIComponent(draftSaved)}`}>
            Open release draft
          </a>
        )}
        {completed && (
          <a className="min-h-11 underline" href={`/items/?variantId=${encodeURIComponent(completed)}`}>
            Open item price and stock
          </a>
        )}
      </form>
    </div>
  );
}
