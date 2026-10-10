import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type CategoryOutputExpectation = {
  cardClass: string | null;
  count: number;
  /** Whether the collection holds a format with a bin, so the Store Crate wraps its Grid. */
  crate: boolean;
  path: string;
  title: string;
};

const expectations: CategoryOutputExpectation[] = [
  { cardClass: 'store-item-card--listing', count: 104, crate: true, path: '/store/', title: 'Store' },
  {
    cardClass: 'store-item-card--listing',
    count: 3,
    crate: false,
    path: '/store/blackbox-releases/',
    title: 'BlackBox Releases',
  },
  { cardClass: 'store-item-card--listing', count: 101, crate: true, path: '/store/distro/', title: 'Distro' },
];

const outputRoot = resolve(process.cwd(), 'apps/web/dist');

function outputFileFor(path: string) {
  return resolve(outputRoot, path.replace(/^\//, ''), 'index.html');
}

function countOccurrences(source: string, needle: string) {
  return source.split(needle).length - 1;
}

function readCanonicalHref(source: string) {
  return /<link rel="canonical" href="([^"]+)"/i.exec(source)?.[1] || '';
}

async function run() {
  for (const expectation of expectations) {
    const source = await readFile(outputFileFor(expectation.path), 'utf8');
    const canonicalHref = readCanonicalHref(source);

    if (!canonicalHref.endsWith(expectation.path)) {
      throw new Error(
        `Expected ${expectation.path} to emit a self-canonical URL, received ${canonicalHref || 'none'}.`,
      );
    }
    if (!source.includes(`<title>${expectation.title}`)) {
      throw new Error(`Expected ${expectation.path} to render the ${expectation.title} title.`);
    }
    if (!source.includes('aria-current="page"')) {
      throw new Error(`Expected ${expectation.path} to mark its Store category link as current.`);
    }

    const renderedCount = expectation.cardClass ? countOccurrences(source, expectation.cardClass) : 0;
    if (renderedCount !== expectation.count) {
      throw new Error(
        `Expected ${expectation.path} to render ${expectation.count} Store cards, received ${renderedCount}.`,
      );
    }

    if (countOccurrences(source, 'data-store-result-total') !== 1 || !source.includes(renderedCount + ' items')) {
      throw new Error('Expected one source-derived collection total on ' + expectation.path);
    }
    if (!source.includes('data-store-artists')) {
      throw new Error('Expected one shared Browse panel on ' + expectation.path);
    }
    // The Store Crate only ever opens in the browser: the server renders the Grid with no Crate state.
    if (source.includes('class="store-crate"') !== expectation.crate) {
      throw new Error(
        `Expected ${expectation.path} ${expectation.crate ? 'to offer' : 'not to offer'} the Store Crate.`,
      );
    }
    if (source.includes('data-store-crate="open"') || source.includes('data-store-crate-hand')) {
      throw new Error('Expected the Store Crate to start in the Grid on ' + expectation.path);
    }
  }

  const allStoreSource = await readFile(outputFileFor('/store/'), 'utf8');
  if (!allStoreSource.includes('aria-label="Browse Distro formats"')) {
    throw new Error('Expected All Store to expose Distro format discovery.');
  }
  if (!allStoreSource.includes('/store/distro/#distro-group-')) {
    throw new Error('Expected All Store Distro discovery to target canonical Distro fragments.');
  }
  const formatTargets = [...allStoreSource.matchAll(/href="[^"]*\/store\/distro\/#(distro-group-[^"]+)"/g)].map(
    (match) => match[1],
  );
  if (formatTargets.length === 0 || new Set(formatTargets).size !== formatTargets.length) {
    throw new Error('Expected All Store Distro format targets to render once each.');
  }

  const merchSource = await readFile(outputFileFor('/store/merch/'), 'utf8');
  const merchCanonical = readCanonicalHref(merchSource);
  if (!merchCanonical.endsWith('/store/')) {
    throw new Error(`Expected empty Merch to redirect to Store, received ${merchCanonical || 'none'}.`);
  }
  if (!merchSource.includes('window.location.replace') || !merchSource.includes('Browse Store')) {
    throw new Error('Expected empty Merch to retain script and visible fallback redirects to Store.');
  }

  const legacyDistroSource = await readFile(outputFileFor('/distro/'), 'utf8');
  const legacyDistroCanonical = readCanonicalHref(legacyDistroSource);
  if (!legacyDistroCanonical.endsWith('/store/distro/')) {
    throw new Error(
      `Expected the legacy Distro redirect canonical to target Store Distro, received ${legacyDistroCanonical || 'none'}.`,
    );
  }
  if (!legacyDistroSource.includes('window.location.hash')) {
    throw new Error('Expected the legacy Distro redirect to preserve browser fragments with JavaScript.');
  }
  if (!legacyDistroSource.includes('Browse Distro')) {
    throw new Error('Expected the legacy Distro redirect to retain a visible no-JavaScript fallback link.');
  }

  console.log(
    'Store category static output checks passed: All 104, BlackBox Releases 3, Distro 101, empty Merch redirect.',
  );
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
