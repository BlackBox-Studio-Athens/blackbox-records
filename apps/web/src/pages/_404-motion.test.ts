import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const script = readFileSync(new URL('../../public/assets/404/404.js', import.meta.url), 'utf8');

function loadMotionGate(hasObserver = true) {
  let onIntersection: (entries: { isIntersecting: boolean }[]) => void = () => {};
  let onVisibility: () => void = () => {};
  let running = false;
  const illustration = {
    toggleAttribute: (_name: string, enabled: boolean) => {
      running = enabled;
    },
  };
  const observe = vi.fn();
  class Observer {
    constructor(callback: typeof onIntersection) {
      onIntersection = callback;
    }
    observe = observe;
  }
  const document = {
    hidden: false,
    querySelector: () => illustration,
    getElementById: () => null,
    addEventListener: (_event: string, callback: () => void) => {
      onVisibility = callback;
    },
  };
  runInNewContext(script, {
    document,
    window: hasObserver ? { IntersectionObserver: Observer } : {},
    IntersectionObserver: Observer,
  });
  return {
    observe,
    illustration,
    isRunning: () => running,
    intersect: (isIntersecting: boolean) => onIntersection([{ isIntersecting }]),
    hide: (hidden: boolean) => {
      document.hidden = hidden;
      onVisibility();
    },
  };
}

describe('404 decorative motion', () => {
  it('runs only while the illustration is in view and the document is visible', () => {
    const gate = loadMotionGate();
    expect(gate.observe).toHaveBeenCalledWith(gate.illustration);
    expect(gate.isRunning()).toBe(false);
    gate.intersect(true);
    expect(gate.isRunning()).toBe(true);
    gate.hide(true);
    expect(gate.isRunning()).toBe(false);
    gate.hide(false);
    expect(gate.isRunning()).toBe(true);
    gate.intersect(false);
    expect(gate.isRunning()).toBe(false);
    gate.hide(true);
    gate.hide(false);
    expect(gate.isRunning()).toBe(false);
  });

  it('keeps the illustration static when intersection observation is unavailable', () => {
    const gate = loadMotionGate(false);
    expect(gate.observe).not.toHaveBeenCalled();
    expect(gate.isRunning()).toBe(false);
  });

  it('pauses by default and disables animations for reduced motion', () => {
    const css = readFileSync(new URL('../../public/assets/404/404.css', import.meta.url), 'utf8');
    expect(css).toContain('animation-play-state: var(--ct-404-animation-state, paused) !important');
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*{[\s\S]*animation: none !important/);
  });
});
