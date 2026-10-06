import { useEffect, useRef, useState } from 'react';
import type { z as Zod } from 'zod';
import type { PublicApiComponents } from '@blackbox/api-client/public';
import { DIGITAL_RELEASE_BADGE } from '@blackbox/content-model';

import { buttonVariants } from '@/components/ui/button';
import MusicEqualizer from '@/components/music/MusicEqualizer';
import InternationalOrderNotice from './cart/InternationalOrderNotice';
import { getPublicBackendBaseUrl } from '@/platform/lib/backend/public-backend-config';
import { createProjectRelativeUrl } from '@/platform/config/site';
import { preorderBadges, shipEstimateText, type ShipEstimate } from '@/platform/lib/preorder-estimate';

function createShowcaseSchemas(z: typeof Zod) {
  const localPath = z
    .string()
    .startsWith('/')
    .refine((value) => !value.startsWith('//') && !value.startsWith('/\\'));
  const imageUrl = z.string().refine((value) => {
    if (value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')) return true;
    return URL.canParse(value) && new URL(value).protocol === 'https:';
  });
  const candidateSchema = z.object({
    slug: z.string().min(1),
    title: z.string().min(1),
    artist: z.string().min(1),
    artistPath: localPath.nullable().optional(),
    option: z.string().min(1),
    storePath: localPath,
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
          backgroundVideoUrl: imageUrl.nullable().optional(),
          backgroundVideoDesktopUrl: imageUrl.nullable().optional(),
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
  return { candidateSchema, estimateSchema };
}

export type StorePreorderShowcaseCandidate = Zod.infer<ReturnType<typeof createShowcaseSchemas>['candidateSchema']>;
type ListingRecord = PublicApiComponents['schemas']['PublicStoreListingPrice'];
type ShowcaseItem = StorePreorderShowcaseCandidate & { displayPrice: string; shipEstimate: ShipEstimate | null };

export async function loadStorePreorderShowcase(candidatesUrl: string, signal?: AbortSignal): Promise<ShowcaseItem[]> {
  for (let attempt = 0; attempt < 2 && !signal?.aborted; attempt += 1) {
    try {
      const listingResponse = await fetch(
        `${getPublicBackendBaseUrl() ?? ''}/api/store/listing-prices?scope=preorders`,
        {
          cache: 'no-store',
          headers: { accept: 'application/json' },
          signal: signal ?? null,
        },
      );
      if (!listingResponse.ok) throw new Error('Could not read pre-orders.');
      const records: ListingRecord[] = await listingResponse.json();
      const stocked = records.filter(
        (record) => record.presentationState === 'ready' && record.availabilityState === 'stocked' && record.preorder,
      );
      if (stocked.length === 0 || signal?.aborted) return [];

      const { z } = await import('zod');
      const { candidateSchema, estimateSchema } = createShowcaseSchemas(z);
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
      if (attempt === 1 || signal?.aborted) return [];
      await new Promise<void>((resolve) => {
        const timer = setTimeout(finish, 250);
        function finish() {
          clearTimeout(timer);
          signal?.removeEventListener('abort', finish);
          resolve();
        }
        signal?.addEventListener('abort', finish, { once: true });
      });
    }
  }
  return [];
}

export default function StorePreorderShowcase({
  candidatesUrl,
  storeUrl,
}: {
  candidatesUrl: string;
  storeUrl: string;
}) {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [activeScene, setActiveScene] = useState<string | null>(null);
  const [watching, setWatching] = useState<string | null>(null);
  const [playerSession, setPlayerSession] = useState(false);
  const [automaticMotion, setAutomaticMotion] = useState(false);
  const [desktopVideo, setDesktopVideo] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    setItems([]);
    setWatching(null);
    void loadStorePreorderShowcase(candidatesUrl, controller.signal).then((next) => {
      if (!controller.signal.aborted) setItems(next);
    });
    return () => controller.abort();
  }, [candidatesUrl]);

  useEffect(() => {
    const root = document.documentElement;
    const syncSession = () => setPlayerSession(root.hasAttribute('data-music-player-session'));
    const observer = new MutationObserver(syncSession);
    syncSession();
    observer.observe(root, { attributes: true, attributeFilter: ['data-music-player-session'] });

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia('(min-width: 1280px)');
    const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
    const syncPreferences = () => {
      setAutomaticMotion(!motion.matches && !connection?.saveData);
      setDesktopVideo(desktop.matches);
    };
    const syncVisibility = () => setDocumentVisible(!document.hidden);
    syncPreferences();
    syncVisibility();
    motion.addEventListener('change', syncPreferences);
    desktop.addEventListener('change', syncPreferences);
    connection?.addEventListener('change', syncPreferences);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      observer.disconnect();
      motion.removeEventListener('change', syncPreferences);
      desktop.removeEventListener('change', syncPreferences);
      connection?.removeEventListener('change', syncPreferences);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, []);

  useEffect(() => {
    if (playerSession) setWatching(null);
  }, [playerSession]);

  useEffect(() => {
    if (!section.current || typeof IntersectionObserver === 'undefined') return;
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const slug = (entry.target as HTMLElement).dataset.preorderAmbient;
          if (slug) visible.set(slug, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        const next = [...visible].filter(([, ratio]) => ratio >= 0.15).sort((a, b) => b[1] - a[1])[0];
        setActiveScene(next?.[0] ?? null);
      },
      { threshold: [0, 0.15, 0.5, 0.75, 1] },
    );
    section.current.querySelectorAll('[data-preorder-ambient]').forEach((scene) => observer.observe(scene));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;
  const firstHasVideo = Boolean(items[0]?.firstClipId || items[0]?.clips?.length);
  return (
    <section
      ref={section}
      id="preorders"
      className={'home-preorders' + (firstHasVideo ? ' home-preorders--starts-video' : '')}
      aria-labelledby="home-preorders-title"
    >
      <div className="home-preorders__header">
        <h2 id="home-preorders-title" className="home-section-header__title">
          Pre-orders
        </h2>
        <a href={storeUrl.split('#')[0] + '#preorders'} data-astro-prefetch className="home-preorders__all">
          All pre-orders
        </a>
      </div>
      {items.map((item, index) => (
        <PreorderChapter
          key={item.slug}
          item={item}
          next={items[index + 1]}
          active={watching === null && activeScene === item.slug}
          playing={watching === item.slug}
          onWatch={setWatching}
          automaticMotion={automaticMotion}
          desktopVideo={desktopVideo}
          documentVisible={documentVisible}
          playerSession={playerSession}
        />
      ))}
    </section>
  );
}

function PreorderChapter({
  item,
  next,
  active,
  playing,
  onWatch,
  automaticMotion,
  desktopVideo,
  documentVisible,
  playerSession,
}: {
  item: ShowcaseItem;
  next?: ShowcaseItem | undefined;
  active: boolean;
  playing: boolean;
  onWatch: (slug: string | null) => void;
  automaticMotion: boolean;
  desktopVideo: boolean;
  documentVisible: boolean;
  playerSession: boolean;
}) {
  const [selectedClip, setSelectedClip] = useState(0);
  const [manualPause, setManualPause] = useState(false);
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [failedClips, setFailedClips] = useState<string[]>([]);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const fullVideo = useRef<HTMLDivElement>(null);
  const watchButton = useRef<HTMLButtonElement>(null);
  const filmTitle = useRef<HTMLHeadingElement>(null);
  const clips = item.clips?.length
    ? item.clips
    : item.firstClipId
      ? [
          {
            id: item.firstClipId,
            title: item.title,
            posterUrl: null,
            backgroundVideoUrl: null,
            backgroundVideoDesktopUrl: null,
          },
        ]
      : [];
  const clip = clips[selectedClip] ?? clips[0];
  const videoLabel = clips.length === 1 ? 'Official video' : 'Official videos';
  const poster = clip?.posterUrl && clip.posterUrl !== item.coverUrl ? clip.posterUrl : item.artistPhotoUrl;
  const failed = clip ? failedClips.includes(clip.id) : false;
  const background = (desktopVideo && clip?.backgroundVideoDesktopUrl) || clip?.backgroundVideoUrl;
  const shouldPlay = Boolean(
    background &&
    active &&
    documentVisible &&
    !playerSession &&
    !playing &&
    !manualPause &&
    !failed &&
    !autoplayBlocked &&
    automaticMotion,
  );
  const estimate = item.shipEstimate ? shipEstimateText(item.shipEstimate) : null;
  const shipping = estimate ? estimate[0]?.toUpperCase() + estimate.slice(1) : 'To be confirmed';
  const badges = preorderBadges({ releaseDate: item.releaseDate, shipEstimate: item.shipEstimate, today: new Date() });
  const chapterId = 'preorder-' + item.slug;
  const watchId = chapterId + '-video';
  const sessionNoteId = chapterId + '-player-note';

  useEffect(() => {
    let cancelled = false;
    void document.fonts.ready.then(() => {
      const title = filmTitle.current;
      const context = document.createElement('canvas').getContext('2d');
      if (cancelled || !title || !context) return;
      const style = getComputedStyle(title);
      context.font = `${style.fontWeight} 100px ${style.fontFamily}`;
      const spacing = parseFloat(style.letterSpacing) / parseFloat(style.fontSize) || 0;
      const width = Math.max(
        ...item.title
          .toUpperCase()
          .split(/\s+/)
          .map((word) => context.measureText(word).width / 100 + spacing * word.length),
      );
      title.style.setProperty('--home-preorders-title-width', String(width + 0.05));
    });
    return () => {
      cancelled = true;
    };
  }, [item.title]);

  useEffect(() => {
    const media = video.current;
    if (!media || !shouldPlay || !clip) {
      media?.pause();
      return;
    }
    let cancelled = false;
    void media.play().catch(() => {
      if (!cancelled) {
        setAmbientPlaying(false);
        setAutoplayBlocked(true);
      }
    });
    return () => {
      cancelled = true;
      media.pause();
    };
  }, [shouldPlay, clip?.id, background]);

  useEffect(() => {
    if (playing && !playerSession) {
      fullVideo.current?.scrollIntoView({ behavior: 'instant', block: 'center' });
      fullVideo.current?.focus({ preventScroll: true });
    }
  }, [playing, playerSession]);

  const cover = (
    <img
      src={item.coverUrl}
      alt={item.title + ' cover'}
      className="home-preorders__sleeve"
      width={340}
      height={340}
      loading="lazy"
      decoding="async"
    />
  );
  const artist = (
    <p className="home-preorders__artist">
      {item.artistPath ? (
        <a href={item.artistPath} data-astro-prefetch className="home-preorders__artist-link">
          {item.artist}
        </a>
      ) : (
        item.artist
      )}
    </p>
  );
  const badgeList = (
    <div className="home-preorders__badges">
      {badges.map((badge) => (
        <span
          key={badge}
          className={badge === DIGITAL_RELEASE_BADGE ? 'store-item-card__release-status' : 'preorder-badge'}
        >
          {badge}
        </span>
      ))}
    </div>
  );
  const listen = item.listen && (
    <button
      type="button"
      className="music-listen-trigger release-card-listen-trigger music-listen-trigger--standalone music-listen-trigger--tone-neutral home-preorders__listen"
      data-music-listen-trigger-variant="standalone"
      data-music-listen-trigger-tone="neutral"
      data-music-listen-source-id={item.listen.releaseId}
      data-music-listen-default-label="Listen"
      data-music-streaming-service-embedded-player-trigger=""
      data-music-streaming-service-embedded-player-release-id={item.listen.releaseId}
      data-music-streaming-service-embedded-player-title={item.title + ' — ' + item.artist}
      data-music-streaming-service-embedded-player-bandcamp-embed-url={item.listen.bandcampEmbedUrl ?? undefined}
      data-music-streaming-service-embedded-player-tidal-embed-url={item.listen.tidalEmbedUrl ?? undefined}
    >
      <MusicEqualizer />
      <span data-music-listen-label>Listen</span>
    </button>
  );
  const purchase = (
    <div className="home-preorders__purchase">
      <div className="home-preorders__price-block">
        <span className="home-preorders__option">{item.option}</span>
        <span className="home-preorders__price">{item.displayPrice}</span>
      </div>
      <a
        href={item.storePath}
        data-astro-prefetch
        className={buttonVariants({ size: 'lg', className: 'preorder-action' })}
      >
        <span>Pre-order</span>
      </a>
      {clip && !badges.some((badge) => estimate && badge.includes(estimate)) && (
        <p className="home-preorders__shipping">
          {/vinyl|\blp\b/i.test(item.option) ? 'Vinyl ships' : 'Copies ship'} {estimate ?? 'at a date to be confirmed'}
        </p>
      )}
      <InternationalOrderNotice variant="line" itemTitles={[item.title]} />
      <a href={createProjectRelativeUrl('/terms/')} data-astro-prefetch className="home-preorders__terms">
        Pre-order &amp; delivery information
      </a>
    </div>
  );

  return (
    <article
      id={chapterId}
      className={'home-preorders__chapter' + (clip ? ' home-preorders__chapter--video' : '')}
      aria-labelledby={chapterId + '-title'}
    >
      {clip ? (
        <>
          <div className="home-preorders__film-scene">
            <div className="home-preorders__media" data-preorder-ambient={item.slug}>
              {poster && poster !== item.coverUrl && (
                <img src={poster} alt="" className="home-preorders__video-poster" loading="lazy" decoding="async" />
              )}
              {background && (
                <video
                  key={clip.id}
                  ref={video}
                  className="home-preorders__film"
                  src={shouldPlay ? background : undefined}
                  muted
                  playsInline
                  loop
                  preload="none"
                  aria-hidden="true"
                  data-playing={ambientPlaying || undefined}
                  onPlaying={() => setAmbientPlaying(true)}
                  onPause={() => setAmbientPlaying(false)}
                  onError={() => {
                    setAmbientPlaying(false);
                    setFailedClips((previous) => (previous.includes(clip.id) ? previous : [...previous, clip.id]));
                  }}
                />
              )}
            </div>
            <div className="home-preorders__film-shade" aria-hidden="true" />
            <div className="home-preorders__film-copy">
              {artist}
              <h3 ref={filmTitle} id={chapterId + '-title'} className="home-preorders__film-title">
                {item.title.split(/\s+/).map((word, index) => (
                  <span key={index}>
                    {index > 0 ? ' ' : ''}
                    <span>{word}</span>
                  </span>
                ))}
              </h3>
              {badgeList}
              {purchase}
              <div className="home-preorders__hero-sleeve">{cover}</div>
            </div>
            <div className="home-preorders__film-tools">
              {listen}
              {background && automaticMotion && !failed && !autoplayBlocked && (
                <button
                  type="button"
                  className={buttonVariants({ variant: 'outline', size: 'icon-lg' })}
                  disabled={!active || !documentVisible || playerSession || playing}
                  aria-label={manualPause ? 'Resume background motion' : 'Pause background motion'}
                  onClick={() => setManualPause((paused) => !paused)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={manualPause ? 'm8 5 11 7-11 7Z' : 'M6 5h4v14H6zM14 5h4v14h-4z'} />
                  </svg>
                </button>
              )}
              <button
                ref={watchButton}
                type="button"
                disabled={playerSession}
                className={buttonVariants({ variant: 'outline', size: 'lg' })}
                aria-controls={watchId}
                aria-expanded={playing}
                aria-describedby={playerSession ? sessionNoteId : undefined}
                onClick={() => {
                  if (!document.documentElement.hasAttribute('data-music-player-session')) onWatch(item.slug);
                }}
              >
                Watch full video
              </button>
            </div>
            <div className="home-preorders__clips" role="group" aria-label={videoLabel}>
              <span className="home-preorders__clips-label">{videoLabel}</span>
              {clips.map((choice, index) =>
                index === selectedClip ? (
                  <span key={choice.id} className="home-preorders__clip" aria-current="true">
                    {choice.title}
                  </span>
                ) : (
                  <button
                    key={choice.id}
                    type="button"
                    className="home-preorders__clip"
                    onClick={() => {
                      setSelectedClip(index);
                      onWatch(null);
                      setAmbientPlaying(false);
                      setAutoplayBlocked(false);
                    }}
                  >
                    {choice.title}
                  </button>
                ),
              )}
            </div>
            {playerSession && (
              <p id={sessionNoteId} className="home-preorders__media-note" role="status">
                Use Stop in the music player before watching this video.
              </p>
            )}
            {failed && (
              <p className="home-preorders__media-note" role="status">
                The background is unavailable. You can still watch the full video.
              </p>
            )}
          </div>
          {playing && !playerSession && (
            <div id={watchId} ref={fullVideo} className="home-preorders__watch-area" tabIndex={-1}>
              <button
                type="button"
                className={buttonVariants({ variant: 'outline', size: 'lg' })}
                onClick={() => {
                  onWatch(null);
                  watchButton.current?.scrollIntoView({ behavior: 'instant', block: 'center' });
                  watchButton.current?.focus({ preventScroll: true });
                }}
              >
                Close video
              </button>
              <iframe
                key={clip.id}
                className="home-preorders__frame"
                src={
                  'https://www.youtube-nocookie.com/embed/' +
                  clip.id +
                  '?autoplay=1&playsinline=1&rel=0&color=white&controls=1&fs=1'
                }
                title={clip.title + ' video'}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </>
      ) : (
        <>
          <div
            className={
              'home-preorders__still-scene' + (!item.artistPhotoUrl ? ' home-preorders__still-scene--cover-only' : '')
            }
          >
            {item.artistPhotoUrl && (
              <img
                src={item.artistPhotoUrl}
                alt={item.artist}
                className="home-preorders__band-photo"
                loading="lazy"
                decoding="async"
              />
            )}
            <div className="home-preorders__still-shade" aria-hidden="true" />
            <div className="home-preorders__still-grid">
              <figure className="home-preorders__still-art">{cover}</figure>
              <div className="home-preorders__identity">
                {artist}
                <h3 id={chapterId + '-title'}>{item.title}</h3>
                {badgeList}
                {listen}
              </div>
            </div>
          </div>
          <dl className="home-preorders__facts home-preorders__facts--still">
            <div>
              <dt>Format</dt>
              <dd>{item.option}</dd>
            </div>
            <div>
              <dt>Tracks</dt>
              <dd>{item.trackCount ?? 'To be confirmed'}</dd>
            </div>
            <div>
              <dt>Recorded and mixed</dt>
              <dd>{item.recording ?? 'To be confirmed'}</dd>
            </div>
            <div>
              <dt>{/vinyl|\blp\b/i.test(item.option) ? 'Vinyl ships' : 'Copies ship'}</dt>
              <dd>{shipping}</dd>
            </div>
          </dl>
          <div className="home-preorders__buy">
            {item.summary && <p className="home-preorders__summary">{item.summary}</p>}
            {purchase}
          </div>
        </>
      )}
      {next && (
        <a
          className="home-preorders__next"
          href={'#preorder-' + next.slug}
          aria-label={'Go to ' + next.title + ' by ' + next.artist}
        >
          <span aria-hidden="true">↓</span>
        </a>
      )}
    </article>
  );
}
