import { useEffect, useState } from 'react';
import { z } from 'zod';
import type { PublicApiComponents } from '@blackbox/api-client/public';

import { buttonVariants } from '@/components/ui/button';
import MusicEqualizer from '@/components/music/MusicEqualizer';
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
  clips: z
    .array(
      z.object({
        id: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
        title: z.string().min(1),
        posterUrl: imageUrl.nullable(),
      }),
    )
    .optional(),
  artistPhotoUrl: imageUrl.nullable(),
  summary: z.string().nullable().optional(),
  trackCount: z.number().int().positive().nullable().optional(),
  recording: z.string().nullable().optional(),
  listen: z
    .object({
      releaseId: z.string().min(1),
      bandcampEmbedUrl: z.string().url().startsWith('https://bandcamp.com/EmbeddedPlayer/').nullable(),
      tidalEmbedUrl: z.string().url().startsWith('https://embed.tidal.com/').nullable(),
    })
    .nullable()
    .optional(),
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
  const [selectedClip, setSelectedClip] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setItems([]);
    setSelected(0);
    setPlaying(false);
    setSelectedClip(0);
    void loadStorePreorderShowcase(candidatesUrl, controller.signal).then((next) => {
      if (!controller.signal.aborted) setItems(next);
    });
    return () => controller.abort();
  }, [candidatesUrl]);

  const item = items[selected];
  if (!item) return null;
  const clip = item.clips?.[selectedClip];
  const clipId = clip?.id ?? item.firstClipId;
  const clips = item.clips?.length ? item.clips : clipId ? [{ id: clipId, title: item.title, posterUrl: null }] : [];
  const estimate = item.shipEstimate ? shipEstimateText(item.shipEstimate) : null;
  const badges = preorderBadges({ releaseDate: item.releaseDate, shipEstimate: item.shipEstimate, today: new Date() });

  return (
    <section
      id="preorders"
      className={`home-preorders layout-container mt-16${clipId ? ' home-preorders--video' : ''}`}
      aria-labelledby="home-preorders-title"
    >
      <div className="home-section-header home-section-header--split">
        <div className="home-section-header__lead">
          <h2 id="home-preorders-title" className="home-section-header__title">
            Pre-orders
          </h2>
          <span className="home-section-header__rule" aria-hidden="true" />
        </div>
        <a href={`${storeUrl.split('#')[0]}#preorders`} data-astro-prefetch className="home-preorders__all">
          All pre-orders
        </a>
      </div>
      <div className="home-preorders__panel">
        <div className="home-preorders__sidebar">
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
                    setSelectedClip(0);
                  }}
                >
                  <span className="home-preorders__number" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <img
                    src={candidate.coverUrl}
                    alt=""
                    width={64}
                    height={64}
                    loading="lazy"
                    className="home-preorders__art"
                  />
                  <span className="home-preorders__item-body">
                    <span className="home-preorders__item-title">{candidate.title}</span>
                    <span className="home-preorders__meta">
                      {candidate.artist} · {candidate.option} · {candidate.displayPrice}
                    </span>
                    <span className="home-preorders__badges">
                      {preorderBadges({
                        releaseDate: candidate.releaseDate,
                        shipEstimate: candidate.shipEstimate,
                        today: new Date(),
                      }).map((badge) => (
                        <span
                          key={badge}
                          className={badge === 'Out now' ? 'store-item-card__release-status' : 'preorder-badge'}
                        >
                          {badge}
                        </span>
                      ))}
                    </span>
                    {index === selected && <span className="home-preorders__now">Now showing</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="home-preorders__terms">
            Charged at order. Your whole order is sent in one parcel when the record arrives.{' '}
            <a href={`${storeUrl.split('#')[0]}#preorders`} data-astro-prefetch>
              How pre-orders work
            </a>
          </p>
        </div>
        <div className="home-preorders__stage">
          <div className={`home-preorders__poster${clipId ? '' : ' home-preorders__poster--no-video'}`}>
            {playing && clipId ? (
              <iframe
                key={`${item.slug}:${clipId}`}
                className="home-preorders__frame"
                src={`https://www.youtube-nocookie.com/embed/${clipId}?autoplay=1`}
                title={`${item.title} video`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : clipId ? (
              <>
                <img
                  src={clip?.posterUrl ?? item.coverUrl}
                  alt={clip?.posterUrl ? `${clip.title} video poster` : `${item.title} cover`}
                  className="home-preorders__video-poster"
                  loading="lazy"
                />
                <button
                  type="button"
                  className="home-preorders__play"
                  aria-label={`Play ${item.title}`}
                  onClick={() => setPlaying(true)}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                {item.artistPhotoUrl && (
                  <img src={item.artistPhotoUrl} alt="" className="home-preorders__poster-photo" loading="lazy" />
                )}
                <span className="home-preorders__poster-shade" aria-hidden="true" />
                <div className="home-preorders__poster-front">
                  <img
                    src={item.coverUrl}
                    alt={`${item.title} cover`}
                    className="home-preorders__poster-cover"
                    loading="lazy"
                  />
                  <div className="home-preorders__identity">
                    <span className="home-preorders__badges">
                      {badges.map((badge) => (
                        <span
                          key={badge}
                          className={badge === 'Out now' ? 'store-item-card__release-status' : 'preorder-badge'}
                        >
                          {badge}
                        </span>
                      ))}
                    </span>
                    <h3>{item.title}</h3>
                    <p className="home-preorders__artist">{item.artist}</p>
                    {item.listen && (
                      <button
                        key={item.slug}
                        type="button"
                        className="music-listen-trigger release-card-listen-trigger music-listen-trigger--standalone music-listen-trigger--tone-neutral home-preorders__listen"
                        data-music-listen-trigger-variant="standalone"
                        data-music-listen-trigger-tone="neutral"
                        data-music-listen-source-id={item.listen.releaseId}
                        data-music-listen-default-label="Listen"
                        data-music-streaming-service-embedded-player-trigger=""
                        data-music-streaming-service-embedded-player-release-id={item.listen.releaseId}
                        data-music-streaming-service-embedded-player-title={`${item.title} — ${item.artist}`}
                        data-music-streaming-service-embedded-player-bandcamp-embed-url={
                          item.listen.bandcampEmbedUrl ?? undefined
                        }
                        data-music-streaming-service-embedded-player-tidal-embed-url={
                          item.listen.tidalEmbedUrl ?? undefined
                        }
                      >
                        <MusicEqualizer />
                        <span data-music-listen-label>Listen</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          {clipId ? (
            <div className="home-preorders__clips" role="group" aria-label="Official videos">
              <span className="home-preorders__clips-label">Official videos</span>
              {clips.map((choice, index) => (
                <button
                  key={choice.id}
                  type="button"
                  className="home-preorders__clip"
                  aria-pressed={index === selectedClip}
                  onClick={() => {
                    if (index === selectedClip) return;
                    setSelectedClip(index);
                    setPlaying(false);
                  }}
                >
                  {choice.title}
                </button>
              ))}
            </div>
          ) : (
            <dl className="home-preorders__facts">
              <div>
                <dt>Format</dt>
                <dd>{item.option}</dd>
              </div>
              <>
                <div>
                  <dt>Tracks</dt>
                  <dd>
                    {item.trackCount
                      ? (['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'][
                          item.trackCount - 1
                        ] ?? item.trackCount)
                      : 'To be confirmed'}
                  </dd>
                </div>
                <div>
                  <dt>Recorded and mixed</dt>
                  <dd>{item.recording ?? 'To be confirmed'}</dd>
                </div>
              </>
              <div>
                <dt>{/vinyl|\blp\b/i.test(item.option) ? 'Vinyl ships' : 'Copies ship'}</dt>
                <dd>{estimate ? estimate[0]?.toUpperCase() + estimate.slice(1) : 'To be confirmed'}</dd>
              </div>
            </dl>
          )}
          <div className={`home-preorders__buy${clipId ? ' home-preorders__buy--video' : ''}`}>
            {clipId ? (
              <div className="home-preorders__video-identity">
                <span className="home-preorders__badges">
                  {badges.map((badge) => (
                    <span
                      key={badge}
                      className={badge === 'Out now' ? 'store-item-card__release-status' : 'preorder-badge'}
                    >
                      {badge}
                    </span>
                  ))}
                </span>
                <h3>{item.title}</h3>
                <p className="home-preorders__artist">{item.artist}</p>
                {item.summary && <p className="home-preorders__summary">{item.summary}</p>}
              </div>
            ) : item.summary ? (
              <p className="home-preorders__summary">{item.summary}</p>
            ) : null}
            <div className="home-preorders__purchase">
              <p className="home-preorders__option">{item.option}</p>
              <p className="home-preorders__price">{item.displayPrice}</p>
              <a
                href={item.storePath}
                data-astro-prefetch
                className={buttonVariants({ size: 'lg', className: 'preorder-action' })}
              >
                Pre-order
              </a>
              <p className="home-preorders__charge">
                {clipId
                  ? `${estimate ? `Ships ${estimate}` : 'Ships when it arrives'} · charged today`
                  : `Charged today · ${estimate ? `ships ${estimate}` : 'ships when it arrives'}`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
