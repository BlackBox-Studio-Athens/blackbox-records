import { scrollElementWithLenis, scrollWithLenis } from './lenis-scroll';

type Preview = { context: string; generation: number; parentOrigin: string; release?: string };
let loaded: Preview | undefined;

export function privatePreview(): Preview | undefined {
  if (typeof document === 'undefined') return;
  if (loaded) return loaded;
  const value = document.querySelector<HTMLMetaElement>('meta[name="blackbox-preview"]')?.content;
  if (!value) return;
  try {
    const parsed = JSON.parse(value) as Preview;
    if (
      /^[a-f0-9-]{36}$/.test(parsed.context) &&
      Number.isSafeInteger(parsed.generation) &&
      new URL(parsed.parentOrigin).origin === parsed.parentOrigin
    )
      return (loaded = parsed);
  } catch {
    /* An invalid bridge configuration must never grant preview authority. */
  }
  return undefined;
}

export function previewUrl(href: string) {
  const preview = privatePreview();
  if (!preview) return href;
  const url = new URL(href, window.location.href);
  if (url.origin === window.location.origin) url.searchParams.set('__preview', preview.context);
  return url.href;
}

export function previewAction(message: string) {
  const preview = privatePreview();
  if (preview) window.parent.postMessage({ ...preview, type: 'action', message }, preview.parentOrigin);
}

export function connectPrivatePreview() {
  const preview = privatePreview();
  if (!preview) return;
  let active = false;
  const send = (type: string, extra: Record<string, unknown> = {}) =>
    window.parent.postMessage({ ...preview, type, ...extra }, preview.parentOrigin);
  send('readiness', { readinessStage: 'script' });
  window.addEventListener('message', (event) => {
    if (
      event.origin !== preview.parentOrigin ||
      event.source !== window.parent ||
      event.data?.context !== preview.context ||
      event.data?.generation !== preview.generation
    )
      return;
    if (event.data.type === 'activate') {
      active = true;
      if (Number.isFinite(event.data.x) && Number.isFinite(event.data.y)) {
        const left = event.data.x as number;
        const top = event.data.y as number;
        if (left === 0) scrollWithLenis(null, top, { immediate: true });
        else window.scrollTo(left, top);
      }
      if (event.data.target === 'footer' || event.data.target === 'newsletter') {
        const target = document.querySelector<HTMLElement>(
          event.data.target === 'footer' ? 'footer' : '#newsletter-signup-area',
        );
        if (target) scrollElementWithLenis(target, { block: 'start' });
      }
    }
    if (event.data.type === 'focus' && typeof event.data.text === 'string') {
      const target = event.data.image
        ? document.querySelector<HTMLElement>('main img')
        : [...document.querySelectorAll<HTMLElement>('.editorial-prose,h1,h2,h3,p,figcaption,a')].find(
            (item) => item.textContent?.replace(/\s/g, '') === event.data.text.replace(/\s/g, ''),
          );
      if (target) scrollElementWithLenis(target, { block: 'center' });
    }
  });
  window.addEventListener(
    'scroll',
    () => {
      if (active) send('scroll', { x: scrollX, y: scrollY });
    },
    { passive: true },
  );
  document.addEventListener(
    'click',
    (event) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!active) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (!link) return;
      const url = new URL(link.getAttribute('href')!, location.href);
      if (
        url.origin !== location.origin ||
        /\/(?:checkout|_emdash|api|content|stock)(?:\/|$)/.test(url.pathname) ||
        link.hasAttribute('download')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        previewAction('This action is unavailable in private preview.');
      } else {
        link.setAttribute('href', previewUrl(url.href));
        link.removeAttribute('target');
      }
    },
    true,
  );
  document.addEventListener(
    'submit',
    (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      previewAction('Forms are not delivered from private preview.');
    },
    true,
  );
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') send('escape');
  });
  const ready = async () => {
    let stage: 'style' | 'image' | 'font' = 'style';
    try {
      send('readiness', { readinessStage: 'hydration' });
      await Promise.all(
        [...document.querySelectorAll('astro-island[client="load"][ssr]')].map(
          (island) =>
            new Promise<void>((resolve) => {
              island.addEventListener('astro:hydrate', () => resolve(), { once: true });
              if (!island.hasAttribute('ssr')) resolve();
            }),
        ),
      );
      send('readiness', { readinessStage: 'styles' });
      for (const link of document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')) {
        if (!link.sheet) throw new Error('Preview styles could not load.');
        // Chromium may attach an empty sheet after a failed stylesheet request.
        let empty = false;
        try {
          empty = link.sheet.cssRules.length === 0;
        } catch {
          /* Cross-origin approved font CSS. */
        }
        if (empty) throw new Error('Preview styles could not load.');
      }
      stage = 'image';
      send('readiness', { readinessStage: 'images' });
      await Promise.all(
        [...document.images]
          .filter((image) => {
            const box = image.getBoundingClientRect();
            return (
              image.loading !== 'lazy' ||
              (box.top < innerHeight && box.bottom > 0 && box.left < innerWidth && box.right > 0)
            );
          })
          .map(async (image) => {
            // A pending preview is hidden until ready; lazy images must start before that reveal.
            image.loading = 'eager';
            // Responsive source selection can change while loading (including iframe resizing).
            // decode() rejects the superseded request even when its replacement is valid.
            if (!image.complete)
              await new Promise<void>((resolve, reject) => {
                const cleanup = () => {
                  image.removeEventListener('load', onLoad);
                  image.removeEventListener('error', onError);
                };
                const onLoad = () => {
                  cleanup();
                  resolve();
                };
                const onError = () => {
                  cleanup();
                  reject(new Error('Preview image could not load.'));
                };
                image.addEventListener('load', onLoad, { once: true });
                image.addEventListener('error', onError, { once: true });
              });
            await image.decode();
          }),
      );
      stage = 'font';
      send('readiness', { readinessStage: 'fonts' });
      await document.fonts.ready;
      if ([...document.fonts].some((font) => font.status === 'error' && font.display !== 'optional'))
        throw new Error('Preview fonts could not load.');
      send('ready');
    } catch {
      send('failed', { stage });
    }
  };
  if (document.readyState === 'complete') void ready();
  else
    window.addEventListener(
      'load',
      () => {
        void ready();
      },
      { once: true },
    );
}
