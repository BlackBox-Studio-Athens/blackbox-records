import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const crateSource = read('../components/store/StoreCrate.astro');
const distroSource = read('../components/store/StoreDistroCatalog.astro');
const collectionSource = read('./StoreCollectionPage.astro');
const searchSource = read('../components/store/StoreDistroSearch.tsx');
const switchSource = read('../components/store/crate/crate-switch.ts');
const snapshotSource = read('../components/app-shell/navigation/shell-page-snapshot.ts');
const crateCss = read('../components/store/crate/crate.css');

describe('Store Crate markup', () => {
  it('wraps every Store collection Grid and renders Crate controls only for a collection with a bin', () => {
    expect(distroSource).toContain('<StoreCrate');
    expect(distroSource).toContain('formatGroups={entries.map(getStoreDistroFormatGroup)}');
    expect(collectionSource).toContain('formatGroups={entries.map(getStoreDistroFormatGroup)}');
    expect(crateSource).toContain('const bins = openBinsOf(formatGroups);');
    expect(crateSource).toMatch(/bins\.length === 0 \? \(\s*<slot \/>/);
    // Distro chooses bins through its format links; other collections get the bin row.
    expect(distroSource).toContain('binRow={false}');
    expect(collectionSource).toMatch(/<StoreCrate[\s\S]*?binRow\s/);
  });

  it('starts in the Grid with a disabled switch and no Crate state on the server', () => {
    expect(crateSource).toContain('data-store-crate="grid"');
    expect(crateSource.match(/data-store-crate-(grid|open)\s+disabled/g)).toHaveLength(2);
    expect(crateSource).toMatch(/data-store-crate-desk hidden/);
    expect(crateSource).not.toContain('data-store-crate-hand');
    // The bar keeps its row from the first paint; the switch stays invisible until the island is ready.
    expect(crateCss).toMatch(/\.store-crate:not\(\[data-store-crate-ready\]\) \.store-crate-view-switch/);
  });

  it('loads the Crate view lazily and keeps it out of the shell', () => {
    expect(searchSource).toContain("from './crate/crate-switch'");
    expect(searchSource).not.toContain('crate-view');
    expect(switchSource).toContain("import('./crate-view')");
    expect(snapshotSource).toContain('export function sanitizeStoreCrateSnapshot');
    expect(snapshotSource).not.toContain('crate-view');
  });

  it('retains filter controls and one accessible result count', () => {
    expect(distroSource).toContain('data-distro-search');
    expect(searchSource).toContain('role="status"');
    expect(searchSource).toContain('Clear filters');
    expect(searchSource).toContain('Clear search');
    expect(searchSource).not.toContain('dom.navigation.hidden =');
  });

  it('keeps flip bins for vertical swipes and the rack for sideways slides only', () => {
    expect(crateCss).toMatch(/\.store-crate-stage\[data-mechanic='flip'\] \{\s*touch-action: pinch-zoom;/);
    expect(crateCss).toMatch(/\.store-crate-stage\[data-mechanic='rack'\] \{\s*touch-action: pan-y pinch-zoom;/);
    expect(crateCss).toContain('overscroll-behavior-x: contain');
  });
});
