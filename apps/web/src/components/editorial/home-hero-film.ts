export type HomeHeroFilmConditions = {
  /** No reduced-motion preference and no data saving. */
  automaticMotion: boolean;
  /** The hero image has loaded, so the film never competes with it for bandwidth. */
  stillLoaded: boolean;
  inView: boolean;
  documentVisible: boolean;
  musicSession: boolean;
  /** The source failed or the browser refused muted autoplay; the still stays without retries. */
  unavailable: boolean;
};

export function shouldPlayHomeHeroFilm(conditions: HomeHeroFilmConditions) {
  return (
    conditions.automaticMotion &&
    conditions.stillLoaded &&
    conditions.inView &&
    conditions.documentVisible &&
    !conditions.musicSession &&
    !conditions.unavailable
  );
}

// The ghost reaches its faintest opacity at 42vh, so the film plays only while at least half the hero is in view.
const HOME_HERO_FILM_VISIBLE_RATIO = 0.5;
// Main profile, level 5.0, 8-bit: covers the 2560 × 1440 landscape file and the 1080 × 1920 portrait file.
const HOME_HERO_FILM_AV1 = 'video/mp4; codecs="av01.0.12M.08"';

export function defineHomeHeroFilm() {
  if (customElements.get('home-hero-film')) return;
  customElements.define('home-hero-film', HomeHeroFilm);
}

// Node tests import the pure helper above, where HTMLElement does not exist.
const ElementBase = (globalThis.HTMLElement ?? class {}) as typeof HTMLElement;

/**
 * Plays the hero's silent loop under the approved Home motion rules: muted and inline, only while the hero is in view
 * and the tab is visible, and paused during a shell music session. Reduced motion and data saving keep the still. The
 * element sits in the hero; the film is in its aria-hidden media layer.
 */
class HomeHeroFilm extends ElementBase {
  #video: HTMLVideoElement | null = null;
  #still: HTMLImageElement | null = null;
  #observer: IntersectionObserver | null = null;
  #session: MutationObserver | null = null;
  #reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  #portrait = matchMedia('(orientation: portrait)');
  #connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
  #inView = false;
  #unavailable = false;
  // AV1 carries the sharper film at about half the H.264 size; H.264 serves browsers that cannot decode AV1.
  #av1 = false;
  #sync = () => this.#apply();
  #ready = () => this.#video?.setAttribute('data-ready', '');
  #fail = () => {
    this.#unavailable = true;
    this.#apply();
  };
  #error = () => {
    // A browser can report AV1 support and still fail to decode it, so the H.264 file gets one try.
    if (!this.#av1) return this.#fail();
    this.#av1 = false;
    this.#apply();
  };

  connectedCallback() {
    const section = this.closest('section');
    this.#video = section?.querySelector<HTMLVideoElement>('video[data-home-hero-film]') ?? null;
    this.#still = section?.querySelector<HTMLImageElement>('.homepage-hero-section__media-image') ?? null;
    if (!section || !this.#video) return;

    // A shell snapshot can return the markup as this element last left it.
    this.#video.removeAttribute('data-ready');
    this.#video.muted = true;
    this.#av1 = this.#video.canPlayType(HOME_HERO_FILM_AV1) !== '';
    this.#video.addEventListener('playing', this.#ready);
    this.#video.addEventListener('error', this.#error);
    this.#still?.addEventListener('load', this.#sync);
    this.#observer = new IntersectionObserver(
      ([entry]) => {
        this.#inView = Boolean(entry && entry.intersectionRatio >= HOME_HERO_FILM_VISIBLE_RATIO);
        this.#apply();
      },
      { threshold: [0, HOME_HERO_FILM_VISIBLE_RATIO] },
    );
    this.#observer.observe(section);
    this.#session = new MutationObserver(this.#sync);
    this.#session.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-music-player-session'],
    });
    document.addEventListener('visibilitychange', this.#sync);
    this.#reducedMotion.addEventListener('change', this.#sync);
    this.#portrait.addEventListener('change', this.#sync);
    this.#connection?.addEventListener('change', this.#sync);
    this.#apply();
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
    this.#session?.disconnect();
    this.#observer = this.#session = null;
    this.#inView = false;
    this.#video?.removeEventListener('playing', this.#ready);
    this.#video?.removeEventListener('error', this.#error);
    this.#still?.removeEventListener('load', this.#sync);
    document.removeEventListener('visibilitychange', this.#sync);
    this.#reducedMotion.removeEventListener('change', this.#sync);
    this.#portrait.removeEventListener('change', this.#sync);
    this.#connection?.removeEventListener('change', this.#sync);
    this.#video?.pause();
  }

  #apply() {
    const video = this.#video;
    if (!video) return;
    const automaticMotion = !this.#reducedMotion.matches && !this.#connection?.saveData;
    const musicSession = document.documentElement.hasAttribute('data-music-player-session');
    const documentVisible = !document.hidden;

    // A paused film keeps its frame; without automatic motion or a playable source the still returns.
    if (!automaticMotion || this.#unavailable) video.removeAttribute('data-ready');

    const play = shouldPlayHomeHeroFilm({
      automaticMotion,
      stillLoaded: this.#still?.complete ?? true,
      inView: this.#inView,
      documentVisible,
      musicSession,
      unavailable: this.#unavailable,
    });
    if (!play) {
      video.pause();
      return;
    }
    const { portraitSrc, portraitAv1Src, landscapeSrc, landscapeAv1Src } = video.dataset;
    const source = this.#portrait.matches
      ? (this.#av1 && portraitAv1Src) || portraitSrc
      : (this.#av1 && landscapeAv1Src) || landscapeSrc;
    if (!source) return;
    if (video.getAttribute('src') !== source) {
      // An orientation change swaps the crop; the still covers the gap until the new file plays.
      video.removeAttribute('data-ready');
      video.src = source;
    }
    void video.play().catch((error: unknown) => {
      // A pause racing a pending play rejects with AbortError; only a refused autoplay leaves the still for good.
      if (error instanceof DOMException && error.name === 'NotAllowedError') this.#fail();
    });
  }
}
