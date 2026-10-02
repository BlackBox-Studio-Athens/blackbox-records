const EAGER_IMAGE_SELECTOR = 'img[loading="eager"]';

// Tuning knob: longest a shell transition waits for first-screen images before revealing anyway.
export const SHELL_FIRST_SCREEN_IMAGE_WAIT_MS = 300;

const PRELOAD_ATTRIBUTES = ['sizes', 'srcset', 'src'] as const;

export type EagerImageSource = Partial<Record<(typeof PRELOAD_ATTRIBUTES)[number], string>>;

// Request each image now. Order matters: sizes and srcset must be set before src so the same responsive candidate
// is picked as by the inserted <img>.
export function preloadImageSources(sources: readonly EagerImageSource[]) {
  for (const source of sources) {
    const image = new Image();
    for (const attribute of PRELOAD_ATTRIBUTES) {
      const value = source[attribute];
      if (value !== undefined) image.setAttribute(attribute, value);
    }
  }
}

// Warm the HTTP cache for a page's eager images; template content is inert, so parsing fetches nothing.
// With a limit, only the first `limit` images are requested and the rest are returned for a later warm-up.
export function preloadEagerImages(html: string, limit = Number.POSITIVE_INFINITY): EagerImageSource[] {
  const template = document.createElement('template');
  template.innerHTML = html;

  const sources = Array.from(template.content.querySelectorAll<HTMLImageElement>(EAGER_IMAGE_SELECTOR), (image) => {
    const source: EagerImageSource = {};
    for (const attribute of PRELOAD_ATTRIBUTES) {
      const value = image.getAttribute(attribute);
      if (value !== null) source[attribute] = value;
    }
    return source;
  });

  preloadImageSources(sources.slice(0, limit));
  return sources.slice(limit);
}

export async function waitForEagerImages(
  root: ParentNode | null,
  timeoutMs = SHELL_FIRST_SCREEN_IMAGE_WAIT_MS,
): Promise<void> {
  if (!root) return;

  const decodes = Array.from(root.querySelectorAll<HTMLImageElement>(EAGER_IMAGE_SELECTOR), (image) =>
    image.decode().catch(() => undefined),
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, timeoutMs);
  });

  await Promise.race([Promise.all(decodes), timeout]);
  clearTimeout(timer);
}
