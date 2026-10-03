import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it, vi } from 'vitest';

import {
  connectShellSurfaceIntent,
  createShellSurfaceLoader,
  scheduleShellIdleTask,
  warmShellSurface,
} from './shell-surface-loader';

function readSource(path: string) {
  return readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
}

describe('createShellSurfaceLoader', () => {
  it('imports a surface once and exposes it synchronously after it resolves', async () => {
    const surface = () => null;
    const importSurface = vi.fn(async () => surface);
    const loader = createShellSurfaceLoader(importSurface);

    expect(loader.peek()).toBeUndefined();
    const [first, second] = await Promise.all([loader.load(), loader.load()]);

    expect(first).toBe(surface);
    expect(second).toBe(surface);
    expect(loader.peek()).toBe(surface);
    await loader.load();
    expect(importSurface).toHaveBeenCalledTimes(1);
  });

  it('retries a failed chunk request on the next load', async () => {
    const surface = () => null;
    const importSurface = vi.fn().mockRejectedValueOnce(new Error('chunk failed')).mockResolvedValueOnce(surface);
    const loader = createShellSurfaceLoader<typeof surface>(importSurface);

    await expect(loader.load()).rejects.toThrow('chunk failed');
    expect(loader.peek()).toBeUndefined();
    await expect(loader.load()).resolves.toBe(surface);
    expect(importSurface).toHaveBeenCalledTimes(2);
  });

  it('keeps speculative warm-up failures silent', async () => {
    const loader = createShellSurfaceLoader(() => Promise.reject(new Error('offline')));

    expect(() => warmShellSurface(loader)).not.toThrow();
    await Promise.resolve();
    expect(loader.peek()).toBeUndefined();
  });
});

describe('scheduleShellIdleTask', () => {
  it('uses requestIdleCallback with a deadline and cancels it', () => {
    const task = vi.fn();
    const scheduler = {
      cancelIdleCallback: vi.fn(),
      clearTimeout: vi.fn(),
      requestIdleCallback: vi.fn(() => 7),
      setTimeout: vi.fn(),
    };

    const cancel = scheduleShellIdleTask(scheduler as never, task, 1500);
    cancel();

    expect(scheduler.requestIdleCallback).toHaveBeenCalledWith(task, { timeout: 1500 });
    expect(scheduler.cancelIdleCallback).toHaveBeenCalledWith(7);
    expect(scheduler.setTimeout).not.toHaveBeenCalled();
  });

  it('falls back to a timeout without requestIdleCallback', () => {
    const task = vi.fn();
    const scheduler = { clearTimeout: vi.fn(), setTimeout: vi.fn(() => 3) };

    const cancel = scheduleShellIdleTask(scheduler as never, task);
    cancel();

    expect(scheduler.setTimeout).toHaveBeenCalledWith(task, 200);
    expect(scheduler.clearTimeout).toHaveBeenCalledWith(3);
  });
});

describe('connectShellSurfaceIntent', () => {
  it('warms the surface whose trigger receives pointer or focus intent', () => {
    const listeners = new Map<string, (event: Event) => void>();
    const target = {
      addEventListener: vi.fn((type: string, listener: (event: Event) => void) => listeners.set(type, listener)),
      removeEventListener: vi.fn((type: string) => listeners.delete(type)),
    };
    const warmMenu = vi.fn();
    const warmCart = vi.fn();
    const menuTarget = { closest: (selector: string) => (selector === '[data-menu]' ? {} : null) };

    const disconnect = connectShellSurfaceIntent(target as never, [
      { selector: '[data-menu]', warm: warmMenu },
      { selector: '[data-cart]', warm: warmCart },
    ]);

    expect([...listeners.keys()]).toEqual(['pointerover', 'pointerdown', 'focusin']);
    listeners.get('pointerdown')?.({ target: menuTarget } as unknown as Event);
    listeners.get('focusin')?.({ target: null } as unknown as Event);
    expect(warmMenu).toHaveBeenCalledTimes(1);
    expect(warmCart).not.toHaveBeenCalled();

    disconnect();
    expect(listeners.size).toBe(0);
  });
});

describe('shell surface presentation', () => {
  it('animates the sheet and detail overlay with CSS rather than motion/react', () => {
    for (const path of ['../../ui/sheet.tsx', './ShellOverlayPanel.tsx', './MobileNavigationSheet.tsx']) {
      expect(readSource(path)).not.toContain('motion/react');
    }

    const css = readSource('../../../styles/global.css');
    expect(css).toContain(".ui-sheet-content[data-state='open'] {\n    animation: ui-sheet-slide-in");
    expect(css).toContain(".ui-sheet-content[data-state='closed'] {\n    animation: ui-sheet-slide-out");
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{[^@]*\.ui-sheet-overlay\[data-state\],\s*\.ui-sheet-content\[data-state\] \{\s*animation: none;/,
    );
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{[^@]*\.app-shell-content-overlay__panel \{\s*transition: none;/,
    );
  });
});
