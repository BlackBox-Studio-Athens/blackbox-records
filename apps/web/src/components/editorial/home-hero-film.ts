export type HomeHeroFilmConditions = {
  /** No reduced-motion preference and no data saving. */
  automaticMotion: boolean;
  /** The hero image has loaded, so the film never competes with it for bandwidth. */
  stillLoaded: boolean;
  inView: boolean;
  documentVisible: boolean;
  musicSession: boolean;
  manualPause: boolean;
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
    !conditions.manualPause &&
    !conditions.unavailable
  );
}

// The ghost reaches its faintest opacity at 42vh, so the film plays only while at least half the hero is in view.
const HOME_HERO_FILM_VISIBLE_RATIO = 0.5;
const PAUSE_ICON = 'M6 5h4v14H6zM14 5h4v14h-4z';
const RESUME_ICON = 'm8 5 11 7-11 7Z';

export function defineHomeHeroFilm() {
  if (customElements.get('home-hero-film')) return;
  customElements.define('home-hero-film', HomeHeroFilm);
}

// Node tests import the pure helper above, where HTMLElement does not exist.
const ElementBase = (globalThis.HTMLElement ?? class {}) as typeof HTMLElement;

/**
 * Plays the hero's silent loop under the approved Home motion rules: muted and inline, only while the hero is in view
 * and the tab is visible, paused during a shell music session, with a manual pause. Reduced motion and data saving
 * keep the still. The element holds the control; the film sits in the hero's aria-hidden media layer.
 */
class HomeHeroFilm extends ElementBase {
  #video: HTMLVideoElement | null = null;
  #still: HTMLImageElement | null = null;
  #toggle: HTMLButtonElement | null = null;
  #icon: SVGPathElement | null = null;
  #observer: IntersectionObserver | null = null;
  #session: MutationObserver | null = null;
  #reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  #portrait = matchMedia('(orientation: portrait)');
  #connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
  #inView = false;
  #manualPause = false;
  #unavailable = false;
  #sync = () => this.#apply();
  #ready = () => this.#video?.setAttribute('data-ready', '');
  #fail = () => {
    this.#unavailable = true;
    this.#apply();
  };
  #togglePause = () => {
    this.#manualPause = !this.#manualPause;
    this.#apply();
  };

  connectedCallback() {
    const section = this.closest('section');
    this.#video = section?.querySelector<HTMLVideoElement>('video[data-home-hero-film]') ?? null;
    this.#still = section?.querySelector<HTMLImageElement>('.homepage-hero-section__media-image') ?? null;
    this.#toggle = this.querySelector('button');
    this.#icon = this.querySelector('path');
    if (!section || !this.#video || !this.#toggle) return;

    // A shell snapshot can return the markup as this element last left it.
    this.#video.removeAttribute('data-ready');
    this.#video.muted = true;
    this.#video.addEventListener('playing', this.#ready);
    this.#video.addEventListener('error', this.#fail);
    this.#toggle.addEventListener('click', this.#togglePause);
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
    this.#video?.removeEventListener('error', this.#fail);
    this.#toggle?.removeEventListener('click', this.#togglePause);
    this.#still?.removeEventListener('load', this.#sync);
    document.removeEventListener('visibilitychange', this.#sync);
    this.#reducedMotion.removeEventListener('change', this.#sync);
    this.#portrait.removeEventListener('change', this.#sync);
    this.#connection?.removeEventListener('change', this.#sync);
    this.#video?.pause();
  }

  #apply() {
    const video = this.#video;
    const toggle = this.#toggle;
    if (!video || !toggle) return;
    const automaticMotion = !this.#reducedMotion.matches && !this.#connection?.saveData;
    const musicSession = document.documentElement.hasAttribute('data-music-player-session');
    const documentVisible = !document.hidden;

    toggle.hidden = !automaticMotion || this.#unavailable;
    toggle.disabled = !this.#inView || !documentVisible || musicSession;
    toggle.setAttribute('aria-label', this.#manualPause ? 'Resume background motion' : 'Pause background motion');
    this.#icon?.setAttribute('d', this.#manualPause ? RESUME_ICON : PAUSE_ICON);
    // A paused film keeps its frame; without automatic motion or a playable source the still returns.
    if (!automaticMotion || this.#unavailable) video.removeAttribute('data-ready');

    const play = shouldPlayHomeHeroFilm({
      automaticMotion,
      stillLoaded: this.#still?.complete ?? true,
      inView: this.#inView,
      documentVisible,
      musicSession,
      manualPause: this.#manualPause,
      unavailable: this.#unavailable,
    });
    if (!play) {
      video.pause();
      return;
    }
    const source = this.#portrait.matches ? video.dataset.portraitSrc : video.dataset.landscapeSrc;
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
