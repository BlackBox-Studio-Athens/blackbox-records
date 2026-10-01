const COPIED_FEEDBACK_MS = 2_000;

type CopyButtonScheduler = Pick<Window, 'clearTimeout' | 'setTimeout'>;

/**
 * One document listener serves every `[data-copy-value]` button (ui/copy-button.astro), including buttons in
 * swapped or cached page content. A copied button shows its check mark and announces through the next
 * `[data-copy-status]` sibling for two seconds.
 */
export function connectCopyButtons(
  documentTarget: Pick<Document, 'addEventListener' | 'removeEventListener'>,
  {
    scheduler = window,
    writeText = (text: string) => navigator.clipboard.writeText(text),
  }: { scheduler?: CopyButtonScheduler; writeText?: (text: string) => Promise<void> } = {},
) {
  const resetTimers = new Map<HTMLElement, number>();

  async function copy(button: HTMLElement) {
    const status = button.nextElementSibling?.matches('[data-copy-status]') ? button.nextElementSibling : null;
    scheduler.clearTimeout(resetTimers.get(button));
    try {
      // Outside a secure context navigator.clipboard is undefined; the throw lands in the same fallback.
      await writeText(button.dataset.copyValue ?? '');
    } catch {
      button.removeAttribute('data-copied');
      if (status) status.textContent = 'Select the address to copy';
      return;
    }
    button.setAttribute('data-copied', '');
    if (status) status.textContent = 'Copied';
    resetTimers.set(
      button,
      scheduler.setTimeout(() => {
        resetTimers.delete(button);
        button.removeAttribute('data-copied');
        if (status) status.textContent = '';
      }, COPIED_FEEDBACK_MS),
    );
  }

  const onClick = (event: Event) => {
    const button = (event.target as Element | null)?.closest?.<HTMLElement>('[data-copy-value]');
    if (button) void copy(button);
  };
  documentTarget.addEventListener('click', onClick);

  return () => {
    documentTarget.removeEventListener('click', onClick);
    resetTimers.forEach((timer) => scheduler.clearTimeout(timer));
    resetTimers.clear();
  };
}
