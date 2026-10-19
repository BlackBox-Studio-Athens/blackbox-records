import { lazy, Suspense, useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { DIGITAL_RELEASE_BADGE } from '@blackbox/content-model';

import { buttonVariants } from '@/components/ui/button';
import { cn, publicTitleClass } from '@/components/ui/utils';
import MusicEqualizer from '@/components/music/MusicEqualizer';
import { createProjectRelativeUrl } from '@/platform/config/site';
import { preorderBadges, shipEstimateText, type ShipEstimate } from '@/platform/lib/preorder-estimate';
import { connectSurfaceHistory, readHistoryEntryMarker } from '@/platform/lib/surface-history';

const InternationalOrderNotice = lazy(() => import('./cart/InternationalOrderNotice'));

// Home builds these at render from the accepted snapshot; only Store Items the open pre-order projection lists appear.
export type StorePreorderShowcaseCandidate = {
  slug: string;
  title: string;
  artist: string;
  artistPath?: string | null | undefined;
  option: string;
  storePath: string;
  releaseDate: string | null;
  coverUrl: string;
  coverSrcSet?: string | undefined;
  firstClipId: string | null;
  clips?:
    | {
        id: string;
        title: string;
        posterUrl: string | null;
        backgroundVideoUrl?: string | null | undefined;
        backgroundVideoDesktopUrl?: string | null | undefined;
      }[]
    | undefined;
  artistPhotoUrl: string | null;
  artistPhotoSrcSet?: string | undefined;
  summary?: string | null | undefined;
  trackCount?: number | null | undefined;
  recording?: string | null | undefined;
  listen?: { releaseId: string; bandcampEmbedUrl: string | null; tidalEmbedUrl: string | null } | null | undefined;
};
export type StorePreorderShowcaseItem = StorePreorderShowcaseCandidate & {
  displayPrice: string;
  shipEstimate: ShipEstimate | null;
};
type ShowcaseItem = StorePreorderShowcaseItem;

// The section is in the server HTML or absent; hydration adds media, viewing and decorative press behavior.
export default function StorePreorderShowcase({ items, storeUrl }: { items: ShowcaseItem[]; storeUrl: string }) {
  const [activeScene, setActiveScene] = useState<string | null>(null);
  const [watching, setWatching] = useState<string | null>(null);
  const videoHistory = useRef<ReturnType<typeof connectSurfaceHistory> | null>(null);
  useEffect(() => {
    const savedVideo = readHistoryEntryMarker(window.history.state, '__homePreorderVideo');
    if (typeof savedVideo === 'string') setWatching(savedVideo);
    const history = connectSurfaceHistory('__homePreorderVideo', (slug) =>
      setWatching(typeof slug === 'string' ? slug : null),
    );
    videoHistory.current = history;
    return () => {
      history.dispose();
      videoHistory.current = null;
    };
  }, []);
  const onWatch = (slug: string | null) => {
    if (slug === null) videoHistory.current?.close(() => setWatching(null));
    else {
      videoHistory.current?.push(slug);
      setWatching(slug);
    }
  };
  const [playerSession, setPlayerSession] = useState(false);
  const [automaticMotion, setAutomaticMotion] = useState(false);
  const [desktopVideo, setDesktopVideo] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const section = useRef<HTMLElement>(null);

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

  const ambientAllowed = automaticMotion && documentVisible && !playerSession && watching === null;
  if (items.length === 0) return null;
  return (
    <section ref={section} id="preorders" className="home-preorders" aria-labelledby="home-preorders-title">
      {/* Each chapter's Pre-order action says what these are; the title stays for assistive technology. */}
      <h2 id="home-preorders-title" className="sr-only">
        Pre-orders
      </h2>
      {items.map((item, index) => (
        <PreorderChapter
          key={item.slug}
          item={item}
          next={items[index + 1]}
          active={ambientAllowed && activeScene === item.slug}
          playing={watching === item.slug}
          onWatch={onWatch}
          desktopVideo={desktopVideo}
          playerSession={playerSession}
          automaticMotion={automaticMotion}
        />
      ))}
      <a href={storeUrl.split('#')[0] + '#preorders'} data-astro-prefetch className="home-preorders__all">
        All pre-orders
      </a>
    </section>
  );
}

function HomePreorderAction({ href }: { href: string }) {
  const [pressed, setPressed] = useState(false);
  const [pressInput, setPressInput] = useState(false);
  const pointer = useRef<{ id: number; started: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reset = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    pointer.current = null;
    setPressed(false);
  }, []);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const release = (event: globalThis.PointerEvent) => {
      if (pointer.current?.id !== event.pointerId) return;
      const remaining = motion.matches ? 0 : Math.max(0, 220 - (performance.now() - pointer.current.started));
      pointer.current = null;
      // Only the decoration waits; the native click and shell navigation proceed immediately.
      if (remaining > 0) timer.current = setTimeout(reset, remaining);
      else reset();
    };
    const cancel = (event: globalThis.PointerEvent) => {
      if (pointer.current?.id === event.pointerId) reset();
    };
    const preference = () => {
      if (motion.matches) reset();
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('blur', reset);
    motion.addEventListener('change', preference);
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('blur', reset);
      motion.removeEventListener('change', preference);
    };
  }, [reset]);

  const usesPress = (event: PointerEvent<HTMLAnchorElement>) =>
    event.pointerType === 'touch' || window.matchMedia('(hover: none), (pointer: coarse)').matches;
  return (
    <a
      href={href}
      data-astro-prefetch
      className={buttonVariants({ className: 'preorder-action' })}
      data-press-input={pressInput ? '' : undefined}
      data-pressed={pressed ? '' : undefined}
      onPointerEnter={(event) => {
        if (!pointer.current) setPressInput(usesPress(event));
      }}
      onPointerDown={(event) => {
        if (event.button !== 0 || !event.isPrimary || pointer.current) return;
        reset();
        const press = usesPress(event);
        setPressInput(press);
        if (!press) return;
        pointer.current = { id: event.pointerId, started: performance.now() };
        setPressed(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') reset();
      }}
    >
      <span className="home-preorders__action-motion" aria-hidden="true" />
      <span className="home-preorders__action-label">Pre-order</span>
    </a>
  );
}

function PreorderChapter({
  item,
  next,
  active,
  playing,
  onWatch,
  desktopVideo,
  playerSession,
  automaticMotion,
}: {
  item: ShowcaseItem;
  next?: ShowcaseItem | undefined;
  active: boolean;
  playing: boolean;
  onWatch: (slug: string | null) => void;
  desktopVideo: boolean;
  playerSession: boolean;
  automaticMotion: boolean;
}) {
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [pausedClips, setPausedClips] = useState<string[]>([]);
  const [frameClip, setFrameClip] = useState<string | null>(null);
  const ambientPointer = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const [failedClips, setFailedClips] = useState<string[]>([]);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const fullVideo = useRef<HTMLDivElement>(null);
  const watchButton = useRef<HTMLButtonElement>(null);
  const wasPlaying = useRef(false);
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
  const clip = clips[0];
  const poster = clip?.posterUrl && clip.posterUrl !== item.coverUrl ? clip.posterUrl : item.artistPhotoUrl;
  const failed = clip ? failedClips.includes(clip.id) : false;
  const background = (desktopVideo && clip?.backgroundVideoDesktopUrl) || clip?.backgroundVideoUrl;
  const manuallyPaused = Boolean(clip && pausedClips.includes(clip.id));
  const shouldPlay = Boolean(background && active && !failed && !autoplayBlocked && !manuallyPaused);
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
    if (!media || !shouldPlay || !background) {
      media?.pause();
      return;
    }
    let cancelled = false;
    const play = () => {
      if (cancelled || !media.paused) return;
      void media.play().catch((error: unknown) => {
        if (cancelled || !media.paused) return;
        // A source load or pause can interrupt startup without refusing autoplay.
        if (error instanceof DOMException && error.name === 'NotAllowedError') setAutoplayBlocked(true);
      });
    };
    media.muted = true;
    // Keep the loaded source across ordinary pauses; only eligible scenes start a download.
    media.addEventListener('canplay', play);
    if (media.getAttribute('src') !== background) media.src = background;
    play();
    return () => {
      cancelled = true;
      media.removeEventListener('canplay', play);
      media.pause();
    };
  }, [shouldPlay, clip?.id, background]);

  useEffect(() => {
    if (playing && !playerSession) {
      fullVideo.current?.scrollIntoView({ behavior: 'instant', block: 'center' });
      fullVideo.current?.focus({ preventScroll: true });
    } else if (wasPlaying.current) {
      requestAnimationFrame(() => {
        if (!watchButton.current?.isConnected) return;
        watchButton.current.scrollIntoView({ behavior: 'instant', block: 'center' });
        watchButton.current.focus({ preventScroll: true });
      });
    }
    wasPlaying.current = playing;
  }, [playing, playerSession]);

  const cover = (
    <img
      src={item.coverUrl}
      srcSet={item.coverSrcSet}
      // The still-art slot (global.css): 8rem on phones, 17.5rem on tablets, 21.25rem above.
      sizes={item.coverSrcSet && '(max-width: 50rem) 8rem, (max-width: 62.5rem) 17.5rem, 21.25rem'}
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
  // The shell owns this trigger's session state, label and disabled flag and may set them before hydration.
  const listen = item.listen && (
    <button
      suppressHydrationWarning
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
      <span data-music-listen-label suppressHydrationWarning>
        Listen
      </span>
    </button>
  );
  // Preserve the mobile pair; desktop film/photo chapters expose Listen in their media composition.
  const purchase = (
    <div className="home-preorders__purchase">
      <div className="home-preorders__price-block">
        <span className="home-preorders__option">{item.option}</span>
        <span className="home-preorders__price">{item.displayPrice}</span>
      </div>
      <div className="home-preorders__actions">
        <HomePreorderAction href={item.storePath} />
        {listen}
      </div>
      {!badges.some((badge) => estimate && badge.includes(estimate)) && (
        <p className="home-preorders__shipping">
          {/vinyl|\blp\b/i.test(item.option) ? 'Vinyl ships' : 'Copies ship'} {estimate ?? 'at a date to be confirmed'}
        </p>
      )}
      <Suspense fallback={null}>
        <InternationalOrderNotice variant="line" itemTitles={[item.title]} />
      </Suspense>
    </div>
  );
  const terms = (
    <a href={createProjectRelativeUrl('/terms/')} data-astro-prefetch className="home-preorders__terms">
      Pre-order &amp; delivery information
    </a>
  );

  return (
    <article
      id={chapterId}
      className={
        'home-preorders__chapter' +
        (clip
          ? ' home-preorders__chapter--video'
          : item.artistPhotoUrl
            ? ' home-preorders__chapter--photo'
            : ' home-preorders__chapter--sleeve')
      }
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
                  muted
                  playsInline
                  loop
                  preload="none"
                  aria-hidden="true"
                  data-playing={((ambientPlaying || manuallyPaused) && frameClip === clip.id) || undefined}
                  onPlaying={() => {
                    setAmbientPlaying(true);
                    setFrameClip(clip.id);
                  }}
                  onPause={() => setAmbientPlaying(false)}
                  onEmptied={() => setFrameClip(null)}
                  onError={() => {
                    setAmbientPlaying(false);
                    setFrameClip(null);
                    setFailedClips((previous) => (previous.includes(clip.id) ? previous : [...previous, clip.id]));
                  }}
                />
              )}
              {background && (
                <button
                  type="button"
                  className="home-preorders__ambient-toggle"
                  aria-label={`${manuallyPaused ? 'Resume' : 'Pause'} background video for ${item.title} by ${item.artist}`}
                  disabled={!automaticMotion || failed || autoplayBlocked}
                  onPointerDown={(event) => {
                    ambientPointer.current =
                      event.button === 0 && event.isPrimary
                        ? { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false }
                        : null;
                  }}
                  onPointerMove={(event) => {
                    const pointer = ambientPointer.current;
                    if (
                      pointer?.id === event.pointerId &&
                      Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 8
                    )
                      pointer.moved = true;
                  }}
                  onPointerCancel={() => {
                    ambientPointer.current = null;
                  }}
                  onPointerLeave={(event) => {
                    if (event.pointerType === 'mouse') ambientPointer.current = null;
                  }}
                  onClick={(event) => {
                    const pointer = ambientPointer.current;
                    ambientPointer.current = null;
                    // Native keyboard activation has no pointer; a drag or cancelled touch is never a toggle.
                    if (event.detail !== 0 && (!pointer || pointer.moved)) return;
                    setPausedClips((previous) =>
                      previous.includes(clip.id) ? previous.filter((id) => id !== clip.id) : [...previous, clip.id],
                    );
                  }}
                />
              )}
            </div>
            <div className="home-preorders__film-shade" aria-hidden="true" />
            <div className="home-preorders__film-copy">
              {artist}
              <h3
                ref={filmTitle}
                id={chapterId + '-title'}
                className={cn('home-preorders__film-title', publicTitleClass(item.title))}
              >
                {item.title.split(/\s+/).map((word, index) => (
                  <span key={index}>
                    {index > 0 ? ' ' : ''}
                    <span>{word}</span>
                  </span>
                ))}
              </h3>
              {badgeList}
              {purchase}
              {terms}
              <div className="home-preorders__hero-sleeve">{cover}</div>
            </div>
            <div className="home-preorders__film-tools">
              {listen && <div className="home-preorders__desktop-listen">{listen}</div>}
              <button
                ref={watchButton}
                type="button"
                disabled={playerSession}
                className={buttonVariants({ variant: 'outline' })}
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
            <div className="home-preorders__clips" role="group" aria-label="Official video">
              <span className="home-preorders__clips-label">Official video</span>
              <span className="home-preorders__clip" aria-current="true">
                {clip.title}
              </span>
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
              <button type="button" className={buttonVariants({ variant: 'outline' })} onClick={() => onWatch(null)}>
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
            style={
              item.artistPhotoUrl
                ? ({ '--home-preorders-photo': `url(${JSON.stringify(item.artistPhotoUrl)})` } as CSSProperties)
                : undefined
            }
          >
            {item.artistPhotoUrl && (
              <img
                src={item.artistPhotoUrl}
                srcSet={item.artistPhotoSrcSet}
                sizes={item.artistPhotoSrcSet && '100vw'}
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
                <h3 id={chapterId + '-title'} className={publicTitleClass(item.title)}>
                  {item.title}
                </h3>
                {badgeList}
                {item.artistPhotoUrl && listen && <div className="home-preorders__desktop-listen">{listen}</div>}
              </div>
            </div>
          </div>
          <div className="home-preorders__buy">
            {purchase}
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
            {item.summary && <p className="home-preorders__summary">{item.summary}</p>}
            {terms}
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
