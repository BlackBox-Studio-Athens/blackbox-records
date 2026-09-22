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
      if (Number.isFinite(event.data.x) && Number.isFinite(event.data.y)) window.scrollTo(event.data.x, event.data.y);
      if (event.data.target === 'footer' || event.data.target === 'newsletter')
        document
          .querySelector(event.data.target === 'footer' ? 'footer' : '#newsletter-signup-area')
          ?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
    if (event.data.type === 'focus' && typeof event.data.text === 'string') {
      const target = event.data.image
        ? document.querySelector('main img')
        : [...document.querySelectorAll('h1,h2,h3,p,figcaption,a')].find(
            (item) => item.textContent?.trim() === event.data.text,
          );
      target?.scrollIntoView({ block: 'center', behavior: 'instant' });
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
      await Promise.all(
        [...document.querySelectorAll('astro-island[client="load"][ssr]')].map(
          (island) =>
            new Promise<void>((resolve) => {
              island.addEventListener('astro:hydrate', () => resolve(), { once: true });
              if (!island.hasAttribute('ssr')) resolve();
            }),
        ),
      );
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
      await Promise.all(
        [...document.images]
          .filter((image) => {
            const box = image.getBoundingClientRect();
            return (
              image.loading !== 'lazy' ||
              (box.top < innerHeight && box.bottom > 0 && box.left < innerWidth && box.right > 0)
            );
          })
          .map((image) => image.decode()),
      );
      stage = 'font';
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
