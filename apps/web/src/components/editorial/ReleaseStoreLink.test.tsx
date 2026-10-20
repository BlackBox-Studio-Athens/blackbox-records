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
vi.mock('@/platform/config/site', () => ({ createProjectRelativeUrl: (path: string) => `/blackbox-records${path}` }));
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
  className: buttonVariants(),
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
    const className = buttonVariants({ variant });
    expect(renderToStaticMarkup(<ReleaseStoreLink {...props} physicalFormat={null} className={className} />)).toBe(
      renderToStaticMarkup(
        <div className="release-edition-actions">
          <a href={props.href} className={className}>
            Shop release
          </a>
        </div>,
      ),
    );
    expect(read).not.toHaveBeenCalled();
  });

  it('switches a matching ready stocked pre-order after one authoritative listing read', async () => {
    read.mockResolvedValue([ready]);
    const result = await hydrate();
    expect(result.initial).not.toMatch(/View details|In stock|Digital out now|>Out /);
    expect(result.initial).not.toContain('data-availability-state');
    expect(result.rendered).toContain('preorder-action');
    expect(result.rendered).toContain('>Pre-order vinyl</span></a>');
    expect(result.rendered).toContain('Expected to ship around early November 2026');
    expect(result.rendered).toContain(`href="${props.href}"`);
    expect(read).toHaveBeenCalledExactlyOnceWith(expect.any(AbortSignal));
    if (typeof result.cleanup === 'function') result.cleanup();
    expect(read.mock.calls[0]?.[0]?.aborted).toBe(true);
  });

  it('keeps supplied shipping without a duplicate digital badge or date', async () => {
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
    read.mockResolvedValue([ready]);
    const result = await hydrate();
    expect(result.rendered).not.toMatch(/Digital out now|Digital release|<time/);
    expect(result.rendered).toContain('Expected to ship around early November 2026');
  });

  it('retains the Pre-order action without inventing shipping when the estimate is withheld', async () => {
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
    read.mockResolvedValue([{ ...ready, preorder: { shipEstimate: null } }]);
    const rendered = (await hydrate()).rendered;
    expect(rendered).toContain('>Pre-order vinyl</span></a>');
    expect(rendered).not.toContain('Expected to ship');
    expect(rendered).not.toContain('preorder-badge');
  });

  it('renders announced editions as static status without an offer read', async () => {
    const result = await hydrate({ announced: true });
    expect(result.rendered).toContain(
      'class="release-physical-status" data-availability-state="coming_soon">Coming soon</span>',
    );
    expect(result.rendered).not.toMatch(/View details|In stock|Digital out now|Unknown offer/);
    expect(result.rendered).not.toContain('tabindex');
    expect(result.rendered).not.toContain('purchase-action');
    expect(read).not.toHaveBeenCalled();
  });

  it.each([
    ['cd', 'CD', false],
    ['cd', 'CD', true],
    ['cassette', 'cassette', false],
    ['cassette', 'cassette', true],
  ] as const)('uses the %s (%s) icon and label, preorder %s', async (physicalFormat, label, preorder) => {
    read.mockResolvedValue([{ ...ready, preorder: preorder ? ready.preorder : null }]);
    const result = await hydrate({ physicalFormat });
    expect(result.rendered).toContain(`>${preorder ? 'Pre-order' : 'Buy'} ${label}</span></a>`);
    expect(result.rendered).toContain(`/buy-icons/${physicalFormat}-base.svg`);
  });

  it.each([
    ['preorder', ready],
    ['available', { ...ready, preorder: null }],
    ['sold_out', { ...ready, availabilityState: 'sold_out' as const }],
    ['unknown', undefined],
  ] satisfies [string, Listing | undefined][])(
    'keeps Listen beside the %s control in SSR and hydration, with facts below',
    async (_state, record) => {
      read.mockResolvedValue(record ? [record] : []);
      hooks.listing = record;
      const result = await hydrate({ projected: record, children: <button>Listen</button> });
      for (const html of [result.initial, result.rendered]) {
        const actions = /<div class="release-edition-actions">([\s\S]*?)<\/div>/.exec(html)![1]!;
        expect(actions).toContain('<button>Listen</button>');
        expect(actions).not.toMatch(/In stock|Digital out now|Expected to ship|View details|delivery information/);
        expect(html.indexOf('release-edition-facts')).toBeGreaterThan(html.indexOf('<button>Listen</button>'));
      }
    },
  );

  it.each([null, ready.preorder])('uses only the static outline disc for vinyl with preorder %s', async (preorder) => {
    read.mockResolvedValue([{ ...ready, preorder }]);
    const result = await hydrate();
    expect(result.rendered).toContain('release-vinyl-icon');
    expect(result.rendered).not.toMatch(/store-buy-icon|buy-icons\//);
  });

  it.each([
    ['missing', [], null, null],
    ['another item', [{ ...ready, storeItemSlug: 'other-vinyl' }], null, null],
    ['sold out', [{ ...ready, availabilityState: 'sold_out' }], 'Sold out', 'sold_out'],
    ['coming soon', [{ ...ready, availabilityState: 'coming_soon' }], 'Coming soon', 'coming_soon'],
    ['repressing', [{ ...ready, availabilityState: 'repressing' }], 'Repressing', 'repressing'],
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
    'omits buying and duplicate labels for %s',
    async (_name, records, badge, state) => {
      read.mockResolvedValue(records);
      const result = await hydrate();
      expect(result.rendered).not.toMatch(/View details|In stock|Digital out now|Unknown offer/);
      if (badge)
        expect(result.rendered).toContain(
          `class="release-physical-status" data-availability-state="${state}">${badge}</span>`,
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
    expect(result.rendered).toContain('Repressing');
    expect(result.rendered).toContain(
      '<span class="release-edition-fact text-sm text-muted-foreground">Expected January 2027</span>',
    );
  });

  it('reflects the regular buying offer when the preorder has ended', async () => {
    read.mockResolvedValue([{ ...ready, preorder: null }]);
    const result = await hydrate();
    expect(result.rendered).toContain('>Buy vinyl</span></a>');
    expect(result.rendered).toContain('purchase-action');
    expect(result.rendered).not.toContain('In stock');
    expect(result.rendered).not.toContain('coming later');
  });

  it('retains supplied format access through SSR and correction without a generic details link', async () => {
    read.mockResolvedValue([{ ...ready, preorder: null, availabilityState: 'sold_out' }]);
    const formats = (
      <p>
        <a href={props.href}>Vinyl LP</a>
        <span> / CD</span>
      </p>
    );
    const result = await hydrate({ formats });
    for (const html of [result.initial, result.rendered]) {
      expect(html).toContain(`href="${props.href}">Vinyl LP</a>`);
      expect(html).toContain('<span> / CD</span>');
      expect(html).not.toMatch(/View details|In stock|Digital out now|Digital release|<time/);
    }
  });

  it('retains the original link when the read fails', async () => {
    read.mockRejectedValue(new Error('offline'));
    const result = await hydrate();
    expect(result.rendered).toBe(result.initial);
  });

  it('renders a projected pre-order in the server HTML and keeps it when the live read fails', async () => {
    read.mockRejectedValue(new Error('offline'));
    const server = markup({ projected: ready });
    expect(server).toContain('preorder-action');
    expect(server).toContain('>Pre-order vinyl</span></a>');
    expect(server).toContain('Expected to ship around early November 2026');
    hooks.listing = ready;
    const result = await hydrate({ projected: ready });
    expect(result.initial).toBe(server);
    expect(result.rendered).toBe(server);
  });

  it('follows a live offer that differs from the projected pre-order without changing layout', async () => {
    read.mockResolvedValue([{ ...ready, preorder: null }]);
    hooks.listing = ready;
    const result = await hydrate({ projected: ready });
    expect(result.initial).toContain('>Pre-order vinyl</span></a>');
    expect(result.rendered).toContain('purchase-action');
    expect(result.rendered).toContain('>Buy vinyl</span></a>');
    expect(result.rendered).not.toContain('Pre-order ·');
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
