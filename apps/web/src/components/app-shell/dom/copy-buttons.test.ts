import { describe, expect, it, vi } from 'vitest';

import { connectCopyButtons } from './copy-buttons';

class CopyButton {
  copied = false;
  dataset = { copyValue: 'touring@blackboxrecordsathens.com' };
  nextElementSibling = { textContent: '', matches: (selector: string) => selector === '[data-copy-status]' };

  closest(selector: string) {
    return selector === '[data-copy-value]' ? this : null;
  }

  setAttribute(name: string) {
    if (name === 'data-copied') this.copied = true;
  }

  removeAttribute(name: string) {
    if (name === 'data-copied') this.copied = false;
  }
}

function connect(writeText: (text: string) => Promise<void>) {
  const documentTarget = new EventTarget();
  let resetCopied: (() => void) | undefined;
  const scheduler = {
    clearTimeout: vi.fn(),
    setTimeout: (callback: () => void) => {
      resetCopied = callback;
      return 1;
    },
  } as unknown as Pick<Window, 'clearTimeout' | 'setTimeout'>;
  const disconnect = connectCopyButtons(documentTarget, { scheduler, writeText });
  const click = async (target: unknown) => {
    const event = new Event('click');
    Object.defineProperty(event, 'target', { value: target });
    documentTarget.dispatchEvent(event);
    await new Promise((resolve) => setTimeout(resolve, 0));
  };
  return { click, disconnect, resetCopied: () => resetCopied?.() };
}

describe('copy buttons', () => {
  it('copies the button value, shows and announces success, then resets after the feedback window', async () => {
    const writeText = vi.fn(async () => undefined);
    const button = new CopyButton();
    const { click, resetCopied } = connect(writeText);

    await click(button);
    expect(writeText).toHaveBeenCalledWith('touring@blackboxrecordsathens.com');
    expect(button.copied).toBe(true);
    expect(button.nextElementSibling.textContent).toBe('Copied');

    resetCopied();
    expect(button.copied).toBe(false);
    expect(button.nextElementSibling.textContent).toBe('');
  });

  it('announces the manual fallback when the clipboard rejects', async () => {
    const button = new CopyButton();
    const { click } = connect(() => Promise.reject(new Error('denied')));

    await click(button);
    expect(button.copied).toBe(false);
    expect(button.nextElementSibling.textContent).toBe('Select the address to copy');
  });

  it('ignores other clicks and stops listening once disconnected', async () => {
    const writeText = vi.fn(async () => undefined);
    const { click, disconnect } = connect(writeText);

    await click({ closest: () => null });
    disconnect();
    await click(new CopyButton());
    expect(writeText).not.toHaveBeenCalled();
  });
});
