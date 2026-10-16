export type HomeHeroFilmConditions = {
  /** No reduced-motion preference and no data saving. */
  automaticMotion: boolean;
  inView: boolean;
  documentVisible: boolean;
  musicSession: boolean;
  /** The source failed or the browser refused muted autoplay; the still stays without retries. */
  unavailable: boolean;
};

export function shouldPlayHomeHeroFilm(conditions: HomeHeroFilmConditions) {
  return (
    conditions.automaticMotion &&
    conditions.inView &&
    conditions.documentVisible &&
    !conditions.musicSession &&
    !conditions.unavailable
  );
}

// The ghost reaches its faintest opacity at 42vh, so the film plays only while at least half the hero is in view.
const HOME_HERO_FILM_VISIBLE_RATIO = 0.5;

export function defineHomeHeroFilm() {
  if (customElements.get('home-hero-film')) return;
  customElements.define('home-hero-film', HomeHeroFilm);
}

// Node tests import the pure helper above, where HTMLElement does not exist.
const ElementBase = (globalThis.HTMLElement ?? class {}) as typeof HTMLElement;

/**
 * Plays the hero's silent loop under the approved Home motion rules: muted and inline, only while the hero is in view
 * and the tab is visible, and paused during a shell music session. Reduced motion and data saving keep the still. On a
 * full load HomeHero's inline script has already started the film; shell visits get their source here. The section's
 * [data-still] reveals the still when the film cannot play. The film is in the hero's aria-hidden media layer.
 */
class HomeHeroFilm extends ElementBase {
  #section: HTMLElement | null = null;
  #video: HTMLVideoElement | null = null;
  #observer: IntersectionObserver | null = null;
  #session: MutationObserver | null = null;
  #reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  #portrait = matchMedia('(orientation: portrait)');
  #connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
  #inView = false;
  #unavailable = false;
  #sync = () => this.#apply();
  #ready = () => this.#video?.setAttribute('data-ready', '');
  #fail = () => {
    this.#unavailable = true;
    this.#apply();
  };

  connectedCallback() {
    const section = (this.#section = this.closest('section'));
    const video = (this.#video = section?.querySelector<HTMLVideoElement>('video[data-home-hero-film]') ?? null);
    if (!section || !video) return;

    // A shell snapshot can return the markup as this element last left it; a full load can already show the film.
    section.removeAttribute('data-still');
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) video.removeAttribute('data-ready');
    video.muted = true;
    video.addEventListener('playing', this.#ready);
    video.addEventListener('error', this.#fail);
    if (video.error) this.#unavailable = true;
    // Measured now so a visible hero plays without waiting for the observer's first callback.
    const { top, bottom, height } = section.getBoundingClientRect();
    this.#inView = Math.min(bottom, innerHeight) - Math.max(top, 0) >= height * HOME_HERO_FILM_VISIBLE_RATIO;
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
    this.#video?.removeEventListener('error', this.#fail);
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
    // Without a film frame to keep, a music session shows the still instead of the dark ground.
    if (!automaticMotion || this.#unavailable || (musicSession && !video.hasAttribute('data-ready'))) {
      this.#section?.setAttribute('data-still', '');
    }

    const play = shouldPlayHomeHeroFilm({
      automaticMotion,
      inView: this.#inView,
      documentVisible,
      musicSession,
      unavailable: this.#unavailable,
    });
    if (!play) {
      video.pause();
      return;
    }
    const source = this.#portrait.matches ? video.dataset.portraitSrc : video.dataset.landscapeSrc;
    if (!source) return;
    // An orientation change swaps the crop; [data-ready] stays, so the still never shows in between.
    if (video.getAttribute('src') !== source) video.src = source;
    void video.play().catch((error: unknown) => {
      // A pause racing a pending play rejects with AbortError; only a refused autoplay leaves the still for good.
      if (error instanceof DOMException && error.name === 'NotAllowedError') this.#fail();
    });
  }
}
