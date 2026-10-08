import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readPublicStoreListingPrices } from '@/components/store/StoreListingPricePresentation';
import { buttonVariants } from '@/components/ui/button';
import ReleaseStoreLink from './ReleaseStoreLink';

type Listing = Awaited<ReturnType<typeof readPublicStoreListingPrices>>[number];
type ReadyListing = Extract<Listing, { presentationState: 'ready' }>;
const hooks = vi.hoisted(() => ({
  active: false,
  listing: undefined as Listing | undefined,
  effect: null as React.EffectCallback | null,
}));

vi.mock('@/components/store/StoreListingPricePresentation', () => ({ readPublicStoreListingPrices: vi.fn() }));
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof React>();
  return {
    ...actual,
    useState: (initial: unknown) =>
      hooks.active
        ? [
            hooks.listing,
            (value: Listing | undefined) => {
              hooks.listing = value;
            },
          ]
        : actual.useState(initial),
    useEffect: (effect: React.EffectCallback, dependencies?: React.DependencyList) => {
      if (hooks.active) hooks.effect = effect;
      else actual.useEffect(effect, dependencies);
    },
  };
});

const props = {
  href: '/blackbox-records/store/disintegration-black-vinyl-lp/',
  className: buttonVariants({ size: 'lg' }),
  releaseDate: '2026-10-16',
  physicalFormat: 'vinyl' as const,
};
const ready: ReadyListing = {
  storeItemSlug: 'disintegration-black-vinyl-lp',
  presentationState: 'ready',
  availabilityState: 'stocked',
  displayPrice: '€28.00',
  preorder: { shipEstimate: { kind: 'month', month: '2026-11', part: 'early' } },
};
const read = vi.mocked(readPublicStoreListingPrices);
const markup = (overrides: Partial<React.ComponentProps<typeof ReleaseStoreLink>> = {}) =>
  renderToStaticMarkup(<ReleaseStoreLink {...props} {...overrides} />);

async function hydrate(overrides: Partial<React.ComponentProps<typeof ReleaseStoreLink>> = {}) {
  hooks.active = true;
  const initial = markup(overrides);
  const cleanup = hooks.effect?.();
  await read.mock.results[0]?.value.catch(() => {});
  return { initial, cleanup, rendered: markup(overrides) };
}

beforeEach(() => {
  hooks.active = false;
  hooks.listing = undefined;
  hooks.effect = null;
  read.mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-03T12:00:00Z'));
});
afterEach(() => vi.useRealTimers());

describe('ReleaseStoreLink', () => {
  it.each([undefined, 'outline'] as const)('preserves the server Shop release anchor with %s styling', (variant) => {
    const className = buttonVariants({ variant, size: 'lg' });
    expect(renderToStaticMarkup(<ReleaseStoreLink {...props} physicalFormat={null} className={className} />)).toBe(
      renderToStaticMarkup(
        <a href={props.href} className={className}>
          Shop release
        </a>,
      ),
    );
    expect(read).not.toHaveBeenCalled();
  });

  it('switches a matching ready stocked pre-order after one authoritative listing read', async () => {
    read.mockResolvedValue([ready]);
    const result = await hydrate();
    expect(result.initial).toContain('class="release-detail-link">Vinyl edition</a>');
    expect(result.initial).not.toContain('data-availability-state');
    expect(result.initial).toContain('>Out 16 October 2026</span>');
    expect(result.rendered).toContain('preorder-action');
    expect(result.rendered).toContain('>Pre-order vinyl</a>');
    expect(result.rendered).toContain('Pre-order · out 16 Oct 2026');
    expect(result.rendered).toContain(`href="${props.href}"`);
    expect(read).toHaveBeenCalledExactlyOnceWith(expect.any(AbortSignal));
    if (typeof result.cleanup === 'function') result.cleanup();
    expect(read.mock.calls[0]?.[0]?.aborted).toBe(true);
  });

  it('uses Digital out now and ship-estimate badges after the release date', async () => {
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
    read.mockResolvedValue([ready]);
    const result = await hydrate();
    expect(result.rendered).toContain('class="store-item-card__release-status">Digital out now');
    expect(result.rendered).toContain('Pre-order · ships around early November 2026');
  });

  it('retains a Pre-order badge when the estimate is withheld', async () => {
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
    read.mockResolvedValue([{ ...ready, preorder: { shipEstimate: null } }]);
    expect((await hydrate()).rendered).toContain('class="preorder-badge">Pre-order</span>');
  });

  it.each([
    ['missing', [], null, null],
    ['another item', [{ ...ready, storeItemSlug: 'other-vinyl' }], null, null],
    ['sold out', [{ ...ready, availabilityState: 'sold_out' }], 'Vinyl Sold Out', 'sold_out'],
    ['coming soon', [{ ...ready, availabilityState: 'coming_soon' }], 'Vinyl Coming Soon', 'coming_soon'],
    ['repressing', [{ ...ready, availabilityState: 'repressing' }], 'Vinyl Repressing', 'repressing'],
    ['paused', [{ ...ready, availabilityState: 'unavailable' }], null, null],
    [
      'unavailable price',
      [
        {
          storeItemSlug: ready.storeItemSlug,
          presentationState: 'unavailable',
          availabilityState: 'stocked',
          preorder: ready.preorder,
        },
      ],
      null,
      null,
    ],
  ] satisfies [string, Listing[], string | null, string | null][])(
    'keeps the details text link for %s',
    async (_name, records, badge, state) => {
      read.mockResolvedValue(records);
      const result = await hydrate();
      expect(result.rendered).toContain('class="release-detail-link">Vinyl edition</a>');
      if (badge)
        expect(result.rendered).toContain(
          `class="store-item-card__release-status" data-availability-state="${state}">${badge}</span>`,
        );
      else expect(result.rendered).not.toContain('data-availability-state');
      expect(result.rendered).not.toMatch(/Out of Stock|Currently Unavailable|Unavailable|unconfirmed|coming later/);
      expect(result.rendered).not.toContain('preorder-action');
      expect(result.rendered).not.toContain('purchase-action');
    },
  );

  it('puts the expected month on the shipping line', async () => {
    read.mockResolvedValue([{ ...ready, preorder: null, availabilityState: 'repressing', expectedMonth: '2027-01' }]);
    const result = await hydrate();
    expect(result.rendered).toContain('Vinyl Repressing');
    expect(result.rendered).toContain('<span class="text-sm text-muted-foreground">Expected January 2027</span>');
  });

  it('reflects the regular buying offer when the preorder has ended', async () => {
    read.mockResolvedValue([{ ...ready, preorder: null }]);
    const result = await hydrate();
    expect(result.rendered).toContain('>Buy vinyl</a>');
    expect(result.rendered).toContain('purchase-action');
    expect(result.rendered).toContain('Vinyl available');
    expect(result.rendered).not.toContain('coming later');
  });

  it.each(['2026-06-06', '2026-11-14', undefined])(
    'keeps the digital badge independent of a Coming Soon vinyl for %s',
    async (releaseDate) => {
      read.mockResolvedValue([{ ...ready, preorder: null, availabilityState: 'coming_soon' }]);
      const result = await hydrate({ releaseDate });
      expect(result.initial).not.toContain('Vinyl Coming Soon');
      expect(result.rendered).toContain('Vinyl Coming Soon');
      if (releaseDate)
        expect(result.rendered).toContain(releaseDate === '2026-06-06' ? 'Digital out now' : 'Out 14 November 2026');
      else expect(result.rendered).not.toMatch(/Digital out now|>Out /);
      expect(result.rendered).not.toContain('Album upcoming');
      expect(result.rendered).not.toContain('preorder-action');
      expect(result.rendered).not.toContain('purchase-action');
    },
  );

  it('retains the original link when the read fails', async () => {
    read.mockRejectedValue(new Error('offline'));
    const result = await hydrate();
    expect(result.rendered).toBe(result.initial);
  });

  it('ignores a response arriving after unmount', async () => {
    let resolve!: (records: Listing[]) => void;
    read.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    hooks.active = true;
    const initial = markup();
    const cleanup = hooks.effect?.();
    if (typeof cleanup === 'function') cleanup();
    resolve([ready]);
    await read.mock.results[0]?.value;
    expect(markup()).toBe(initial);
  });
});
