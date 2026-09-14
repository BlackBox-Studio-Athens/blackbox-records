import { useEffect, useState } from 'react';
import { DISTRO_GROUP_VALUES } from '@blackbox/content-model';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import EditorialPicker from './EditorialPicker';
import NewArtistFields from './NewArtistFields';
import { euroMinor } from '../stock/ItemPriceEditor';
import { createInternalStockApi, type CatalogSetupCommand } from '../../lib/backend/internal-stock-api';
import { createEditorialDraft, editorialSlug, type EditorialRecord } from '../../lib/backend/editorial-api';

export function releaseDetails(input: {
  title: string;
  artist: string;
  date: string;
  summary: string;
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
    summary: input.summary.trim(),
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
  summary: string;
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
  if (input.kind === 'merch' && itemType !== 'Clothes') throw new Error('Choose a clothes record for Merch.');
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
                  summary: input.summary.trim(),
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
  const [ready, setReady] = useState(false);
  const [kind, setKind] = useState<'release' | 'distro' | 'merch'>('release');
  const [mode, setMode] = useState('new');
  const [existing, setExisting] = useState<EditorialRecord | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [artistName, setArtistName] = useState('');
  const [artistOrLabel, setArtistOrLabel] = useState('');
  const [date, setDate] = useState('');
  const [summary, setSummary] = useState('');
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
  const [draftSaved, setDraftSaved] = useState(false);
  const storageKey = `blackbox-item-setup:${backendBaseUrl}`;
  const draftKey = `blackbox-release-draft:${backendBaseUrl}`;
  const sell = kind !== 'release' || mode === 'existing' || sellRelease;
  const locked = !ready || busy || !!pending || !!draftPending || needsReview || !!completed || draftSaved;
  useEffect(() => {
    setReady(true);
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
    setBusy(true);
    setMessage('');
    try {
      if (!sell) {
        const command = draftPending ?? {
          slug: editorialSlug(title, crypto.randomUUID()),
          data: releaseDetails({ title, artist, date, summary, image, alt, format }),
        };
        sessionStorage.setItem(draftKey, JSON.stringify(command));
        setDraftPending(command);
        await createEditorialDraft(backendBaseUrl, 'releases', command);
        sessionStorage.removeItem(draftKey);
        setDraftSaved(true);
        setMessage('Release draft saved. No price or stock was created. It is not published yet.');
        return;
      }
      const command =
        pending ??
        setupCommand({
          identity: crypto.randomUUID(),
          kind,
          existing: mode === 'existing' ? existing : null,
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
      if (mode === 'existing' && !existing && !pending) throw new Error('Choose an existing record.');
      sessionStorage.setItem(storageKey, JSON.stringify(command));
      setPending(command);
      const result = await createInternalStockApi({ backendBaseUrl }).setupItem(command);
      if (result.status === 'completed') {
        sessionStorage.removeItem(storageKey);
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
    <div className="mx-auto grid max-w-3xl gap-8 px-4 py-8 sm:px-8">
      <header className="grid gap-3">
        <a href="/items/" className="underline">
          Back to items
        </a>
        <h1 className="font-display text-4xl">Create an item</h1>
        <p>Choose the record, price and starting stock. Publishing is a separate step.</p>
      </header>
      <form onSubmit={submit} className="grid gap-8">
        <fieldset disabled={locked} className="grid min-w-0 gap-5">
          <legend className="mb-4 text-xl font-semibold">1. Item details</legend>
          <label className="grid gap-2">
            What are you adding?
            <select
              className={inputClass}
              value={kind}
              onChange={(event) => {
                const selected = event.target.value as typeof kind;
                setKind(selected);
                setExisting(null);
                setFormat(selected === 'merch' ? 'Clothes' : 'Vinyl 12-inch');
              }}
            >
              <option value="release">Label release</option>
              <option value="distro">Distro</option>
              <option value="merch">Merch</option>
            </select>
          </label>
          <label className="grid gap-2">
            Record
            <select
              className={inputClass}
              value={mode}
              onChange={(event) => {
                setMode(event.target.value);
                setExisting(null);
              }}
            >
              <option value="new">Create a new record</option>
              <option value="existing">Use an existing record</option>
            </select>
          </label>
          {mode === 'existing' ? (
            <EditorialPicker
              key={kind}
              base={backendBaseUrl}
              collection={kind === 'release' ? 'releases' : 'distro'}
              label="Existing record"
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
              <label className="grid gap-2">
                Short description
                <textarea
                  className={inputClass}
                  rows={4}
                  required
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                />
              </label>
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
          <fieldset disabled={locked} className="grid min-w-0 gap-5">
            <legend className="mb-4 text-xl font-semibold">2. Price and starting stock</legend>
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
              How many copies do you have?
              <Input
                required
                type="number"
                min={0}
                step={1}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
              <span className="text-sm text-muted-foreground">
                These copies will also be available online when the item is published.
              </span>
            </label>
            <label className="flex min-h-11 items-center gap-3">
              <input type="checkbox" required />I confirm this price and starting stock
            </label>
          </fieldset>
        )}
        {!completed && !draftSaved && (
          <Button type="submit" disabled={!ready || busy || needsReview}>
            {busy
              ? 'Checking item…'
              : pending || draftPending
                ? 'Check again'
                : sell
                  ? 'Create item'
                  : 'Save release draft'}
          </Button>
        )}
        {message && <p role="status">{message}</p>}
        {completed && (
          <a className="min-h-11 underline" href={`/items/?variantId=${encodeURIComponent(completed)}`}>
            Open item price and stock
          </a>
        )}
      </form>
    </div>
  );
}
