import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({
  country: null as string | null,
  effects: [] as (() => () => void)[],
  setCountry: vi.fn(),
  resolveCountry: vi.fn<() => Promise<string | null>>(),
}));

// Exercise the hydrated branches with the same server renderer used by the shopper tests.
// The real browser pass verifies mounting and hydration with unmocked React.
vi.mock('react', async (original) => ({
  ...(await original<typeof React>()),
  useState: () => [hooks.country, hooks.setCountry],
  useEffect: (effect: () => () => void) => {
    hooks.effects.push(effect);
  },
}));
vi.mock('./shopper-country', () => ({ resolveShopperCountry: hooks.resolveCountry }));

import InternationalOrderNotice, { buildInternationalOrderMailto } from './InternationalOrderNotice';

beforeEach(() => {
  hooks.country = null;
  hooks.effects = [];
  hooks.setCountry.mockClear();
  hooks.resolveCountry.mockReset().mockResolvedValue('US');
});

describe('buildInternationalOrderMailto', () => {
  it.each([
    [undefined, 'Items:\nCountry:\nCity:'],
    [[], 'Items:\nCountry:\nCity:'],
    [['First', 'Second'], 'Items: First, Second\nCountry:\nCity:'],
    [['A & B, why?', 'Αθήνα / Échos 日本語'], 'Items: A & B, why?, Αθήνα / Échos 日本語\nCountry:\nCity:'],
  ] as const)('encodes the complete template for %j', (titles, body) => {
    const href = buildInternationalOrderMailto(titles ? [...titles] : undefined);
    expect(href).toBe(
      `mailto:orders@blackboxrecordsathens.com?subject=Order%20from%20outside%20Greece&body=${encodeURIComponent(body)}`,
    );
    const url = new URL(href);
    expect([...url.searchParams.keys()]).toEqual(['subject', 'body']);
    expect(url.searchParams.get('subject')).toBe('Order from outside Greece');
    expect(url.searchParams.get('body')).toBe(body);
  });
});

describe('InternationalOrderNotice', () => {
  const variants = ['strip', 'line', 'card'] as const;

  it.each(variants)('renders the %s copy with a native mail link and quiet semantics', (variant) => {
    hooks.country = 'US';
    const markup = renderToStaticMarkup(<InternationalOrderNotice variant={variant} itemTitles={['A & B', 'Αθήνα']} />);
    expect(markup).toContain(`international-order-notice--${variant}`);
    expect(markup).toContain(buildInternationalOrderMailto(['A & B', 'Αθήνα']).replaceAll('&', '&amp;'));
    expect(markup).toContain('Email us to order');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toMatch(/aria-live|role="(?:alert|dialog|status)"|<button/);
    if (variant === 'strip') {
      expect(markup).toContain('aria-label="Shipping outside Greece"');
      expect(markup).toContain('Shipping</span>');
      expect(markup).toContain('We ship within Greece only, for now.');
      expect(markup).toContain('Ordering from abroad? Email us and we&#x27;ll arrange it with you.');
    } else if (variant === 'card') {
      expect(markup).toContain('aria-label="Ordering from outside Greece"');
      expect(markup).toContain('Ordering from outside Greece?</h3>');
      expect(markup).toContain(
        'Online checkout ships within Greece only for now. Email us what you&#x27;d like and where it&#x27;s going, and we&#x27;ll confirm shipping and payment with you.',
      );
    } else {
      expect(markup).toMatch(/^<p /);
      expect(markup).toContain('Ships within Greece only. Outside Greece?');
      expect(markup).not.toContain('<aside');
      expect(markup).not.toContain('M3 8h10M9 4l4 4-4 4');
    }
  });

  it.each(variants)('renders no %s markup while unresolved, unknown, failed or Greek', (variant) => {
    for (const country of [null, 'GR']) {
      hooks.country = country;
      expect(renderToStaticMarkup(<InternationalOrderNotice variant={variant} />)).toBe('');
    }
    expect(hooks.resolveCountry).not.toHaveBeenCalled();
  });

  it('has an empty item template on collections and updates titles when the cart changes', () => {
    hooks.country = 'US';
    expect(renderToStaticMarkup(<InternationalOrderNotice variant="strip" />)).toContain(
      'body=Items%3A%0ACountry%3A%0ACity%3A',
    );
    const renderCart = (itemTitles: string[]) =>
      renderToStaticMarkup(<InternationalOrderNotice variant="card" itemTitles={itemTitles} />);
    expect(renderCart(['First'])).toContain('body=Items%3A%20First%0A');
    expect(renderCart(['Second', 'Third'])).toContain('body=Items%3A%20Second%2C%20Third%0A');
  });

  it('defaults to the accent frame and supports the neutral checkout frame', () => {
    hooks.country = 'US';
    expect(renderToStaticMarkup(<InternationalOrderNotice variant="card" />)).toContain('data-border-tone="accent"');
    expect(renderToStaticMarkup(<InternationalOrderNotice variant="card" borderTone="neutral" />)).toContain(
      'data-border-tone="neutral"',
    );
  });

  it.each(['US', 'GR', null])('resolves %j only after mounting', async (country) => {
    hooks.resolveCountry.mockResolvedValue(country);
    expect(renderToStaticMarkup(<InternationalOrderNotice variant="strip" />)).toBe('');
    const cleanup = hooks.effects[0]!();
    await Promise.resolve();
    expect(hooks.resolveCountry).toHaveBeenCalledOnce();
    expect(hooks.setCountry).toHaveBeenCalledExactlyOnceWith(country);
    cleanup();
  });

  it('ignores a country result after unmounting', async () => {
    renderToStaticMarkup(<InternationalOrderNotice variant="card" />);
    hooks.effects[0]!()();
    await Promise.resolve();
    expect(hooks.setCountry).not.toHaveBeenCalled();
  });
});
