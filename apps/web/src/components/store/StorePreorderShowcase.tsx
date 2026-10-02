import { useEffect, useState } from 'react';
import { z } from 'zod';
import type { PublicApiComponents } from '@blackbox/api-client/public';

import { buttonVariants } from '@/components/ui/button';
import { getPublicBackendBaseUrl } from '@/platform/lib/backend/public-backend-config';
import { preorderBadges, shipEstimateText, type ShipEstimate } from '@/platform/lib/preorder-estimate';

const imageUrl = z.string().refine((value) => {
  if (value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')) return true;
  return URL.canParse(value) && new URL(value).protocol === 'https:';
});
const candidateSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  artist: z.string().min(1),
  option: z.string().min(1),
  storePath: z
    .string()
    .startsWith('/')
    .refine((value) => !value.startsWith('//') && !value.startsWith('/\\')),
  releaseDate: z.iso.date().nullable(),
  coverUrl: imageUrl,
  firstClipId: z
    .string()
    .regex(/^[A-Za-z0-9_-]{11}$/)
    .nullable(),
  artistPhotoUrl: imageUrl.nullable(),
});
const estimateSchema = z.union([
  z.object({
    kind: z.literal('month'),
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    part: z.enum(['early', 'mid', 'late']).nullable(),
  }),
  z.object({ kind: z.literal('date'), date: z.iso.date() }),
]);

export type StorePreorderShowcaseCandidate = z.infer<typeof candidateSchema>;
type ListingRecord = PublicApiComponents['schemas']['PublicStoreListingPrice'];
type ShowcaseItem = StorePreorderShowcaseCandidate & { displayPrice: string; shipEstimate: ShipEstimate | null };

export async function loadStorePreorderShowcase(candidatesUrl: string, signal?: AbortSignal): Promise<ShowcaseItem[]> {
  try {
    const listingResponse = await fetch(`${getPublicBackendBaseUrl() ?? ''}/api/store/listing-prices?scope=preorders`, {
      cache: 'no-store',
      headers: { accept: 'application/json' },
      signal: signal ?? null,
    });
    if (!listingResponse.ok) throw new Error('Could not read pre-orders.');
    const records: ListingRecord[] = await listingResponse.json();
    const stocked = records.filter(
      (record) => record.presentationState === 'ready' && record.availabilityState === 'stocked' && record.preorder,
    );
    if (stocked.length === 0 || signal?.aborted) return [];

    const candidatesResponse = await fetch(candidatesUrl, {
      headers: { accept: 'application/json' },
      signal: signal ?? null,
    });
    if (!candidatesResponse.ok) throw new Error('Could not read pre-order candidates.');
    const candidates = z.array(candidateSchema).parse(await candidatesResponse.json());
    if (signal?.aborted) return [];

    return candidates.flatMap((candidate) => {
      const record = stocked.find((item) => item.storeItemSlug === candidate.slug);
      return record?.presentationState === 'ready' && record.preorder
        ? [
            {
              ...candidate,
              displayPrice: z.string().min(1).parse(record.displayPrice),
              shipEstimate: estimateSchema.nullable().parse(record.preorder.shipEstimate),
            },
          ]
        : [];
    });
  } catch {
    return [];
  }
}

export default function StorePreorderShowcase({
  candidatesUrl,
  storeUrl,
}: {
  candidatesUrl: string;
  storeUrl: string;
}) {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setItems([]);
    setSelected(0);
    setPlaying(false);
    void loadStorePreorderShowcase(candidatesUrl, controller.signal).then((next) => {
      if (!controller.signal.aborted) setItems(next);
    });
    return () => controller.abort();
  }, [candidatesUrl]);

  const item = items[selected];
  if (!item) return null;
  const estimate = item.shipEstimate ? shipEstimateText(item.shipEstimate) : null;

  return (
    <section className="home-preorders layout-container mt-16" aria-labelledby="home-preorders-title">
      <div className="home-section-header home-section-header--split mb-6 sm:mb-8">
        <div className="home-section-header__lead">
          <h2 id="home-preorders-title" className="home-section-header__title">
            Pre-orders
          </h2>
          <span className="home-section-header__rule" aria-hidden="true" />
        </div>
        <a
          href={`${storeUrl.split('#')[0]}#preorders`}
          data-astro-prefetch
          className={buttonVariants({ variant: 'ghost' })}
        >
          All pre-orders
        </a>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="min-w-0">
          <ul className="home-preorders__menu" aria-label="Choose a pre-order">
            {items.map((candidate, index) => (
              <li key={candidate.slug}>
                <button
                  type="button"
                  className="home-preorders__item"
                  aria-pressed={index === selected}
                  onClick={() => {
                    setSelected(index);
                    setPlaying(false);
                  }}
                >
                  <img
                    src={candidate.coverUrl}
                    alt=""
                    width={56}
                    height={56}
                    loading="lazy"
                    className="h-14 w-14 shrink-0 object-contain"
                  />
                  <span className="min-w-0 flex-1 break-words">
                    <span className="block font-semibold text-foreground">{candidate.title}</span>
                    <span className="block">
                      {candidate.artist} · {candidate.option}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      {preorderBadges({
                        releaseDate: candidate.releaseDate,
                        shipEstimate: candidate.shipEstimate,
                        today: new Date(),
                      }).map((badge) => (
                        <span key={badge} className="preorder-badge">
                          {badge}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="shrink-0">{candidate.displayPrice}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
            Charged at order. Your whole order is sent in one parcel when the record arrives.
          </p>
        </div>
        <div className="home-preorders__stage">
          <div className="home-preorders__poster">
            {playing && item.firstClipId ? (
              <iframe
                key={item.slug}
                className="home-preorders__frame"
                src={`https://www.youtube-nocookie.com/embed/${item.firstClipId}?autoplay=1`}
                title={`${item.title} video`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <>
                {item.artistPhotoUrl && (
                  <img src={item.artistPhotoUrl} alt="" className="home-preorders__poster-photo" loading="lazy" />
                )}
                <img
                  src={item.coverUrl}
                  alt={`${item.title} cover`}
                  className="home-preorders__poster-cover"
                  loading="lazy"
                />
                {item.firstClipId && (
                  <button
                    type="button"
                    className="home-preorders__play"
                    aria-label={`Play ${item.title}`}
                    onClick={() => setPlaying(true)}
                  >
                    <span aria-hidden="true">▶</span> Play
                  </button>
                )}
              </>
            )}
          </div>
          <dl className="home-preorders__facts">
            <div>
              <dt>Release date</dt>
              <dd>
                {item.releaseDate
                  ? new Date(`${item.releaseDate}T00:00:00Z`).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      timeZone: 'UTC',
                    })
                  : 'To be confirmed'}
              </dd>
            </div>
            <div>
              <dt>Format</dt>
              <dd>{item.option}</dd>
            </div>
            <div>
              <dt>Expected to ship</dt>
              <dd>{estimate ? estimate[0]?.toUpperCase() + estimate.slice(1) : 'To be confirmed'}</dd>
            </div>
          </dl>
          <div className="home-preorders__buy">
            <div>
              <p className="font-display text-2xl text-foreground">{item.displayPrice}</p>
              <p className="text-sm text-muted-foreground">
                Charged today · {estimate ? `ships ${estimate}` : 'ships when it arrives'}
              </p>
            </div>
            <a
              href={item.storePath}
              data-astro-prefetch
              className={buttonVariants({ size: 'lg', className: 'preorder-action w-full sm:w-56' })}
            >
              Pre-order
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
