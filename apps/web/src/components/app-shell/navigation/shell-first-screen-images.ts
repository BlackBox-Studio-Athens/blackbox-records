const EAGER_IMAGE_SELECTOR = 'img[loading="eager"]';

// Tuning knob: longest a shell transition waits for first-screen images before revealing anyway.
export const SHELL_FIRST_SCREEN_IMAGE_WAIT_MS = 300;

// Warm the HTTP cache for a page's eager images; template content is inert, so parsing fetches nothing.
export function preloadEagerImages(html: string) {
  const template = document.createElement('template');
  template.innerHTML = html;

  for (const source of template.content.querySelectorAll<HTMLImageElement>(EAGER_IMAGE_SELECTOR)) {
    const image = new Image();
    // Order matters: sizes and srcset must be set before src so the same responsive candidate is picked.
    for (const attribute of ['sizes', 'srcset', 'src'] as const) {
      const value = source.getAttribute(attribute);
      if (value !== null) image.setAttribute(attribute, value);
    }
  }
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
