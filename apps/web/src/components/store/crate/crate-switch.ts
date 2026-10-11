/**
 * The Grid | Crate switch, the only Crate code the Store search island loads up front. It enables the switch, shows
 * it only while the Grid holds something with a bin, and imports the Crate view on the first intent: hovering or
 * focusing Crate prefetches it, pressing Crate opens it, and a history entry left by the Crate reopens it on Back.
 */
import type { StoreCrate, StoreCrateHost } from './crate-view';

export interface StoreCrateSwitch {
  /** Routes a format choice to the open Crate. False when the Crate is closed and the Grid should filter. */
  choose(formatKey: string): boolean;
  /** Called after every filter change with the Grid's visible cards and its format. */
  sync(filtered: boolean, visibleCards: ReadonlySet<HTMLElement>, format: string): void;
  dispose(): void;
}

export function connectStoreCrate(searchRoot: HTMLElement, host: StoreCrateHost): StoreCrateSwitch | null {
  const root = searchRoot.querySelector<HTMLElement>('.store-crate[data-store-crate-bins]');
  const gridButton = root?.querySelector<HTMLButtonElement>('[data-store-crate-grid]');
  const crateButton = root?.querySelector<HTMLButtonElement>('[data-store-crate-open]');
  if (!root || !gridButton || !crateButton) return null;
  const crateRoot = root;
  const bins = new Set((root.dataset.storeCrateBins ?? '').split(' '));
  const restore = Boolean((history.state as { storeCrate?: unknown } | null)?.storeCrate);
  let crate: StoreCrate | null = null;
  let loading: Promise<StoreCrate | null> | null = null;
  let disposed = false;

  // One import per page visit; a late import after the shopper has left mounts nothing.
  const load = () =>
    (loading ??= import('./crate-view').then(({ mountStoreCrate }) => {
      if (disposed) return null;
      crate = mountStoreCrate(crateRoot, host, { restore });
      return crate;
    }));
  const onCrate = () => {
    void load().then((loaded) => loaded?.open());
  };
  const onGrid = () => crate?.close();
  const prefetch = () => {
    void load();
  };

  gridButton.addEventListener('click', onGrid);
  crateButton.addEventListener('click', onCrate);
  crateButton.addEventListener('pointerenter', prefetch);
  crateButton.addEventListener('focusin', prefetch);
  gridButton.disabled = false;
  crateButton.disabled = false;
  root.setAttribute('data-store-crate-ready', '');

  return {
    choose(formatKey) {
      if (!crate?.isOpen) return false;
      crate.choose(formatKey);
      return true;
    },
    sync(filtered, visibleCards, format) {
      if (filtered && crate?.isOpen) crate.close();
      // A format chosen outside the Crate, such as Clear filters, walks to its bin or leaves for the Grid.
      else if (host.filterable && crate?.isOpen && format !== crate.formatKey) crate.choose(format);
      let on = Boolean(crate?.isOpen);
      if (!on && !filtered) {
        for (const card of visibleCards) {
          if (bins.has(card.dataset.storeCrateBin ?? '')) {
            on = true;
            break;
          }
        }
      }
      crateRoot.dataset.storeCrateSwitch = on ? 'on' : 'off';
      // The restored Crate mounts after the island's first sync, which still carries its initial All formats. A Crate
      // mounted earlier (the view module is cached after shell navigation) would read that as a choice and close.
      if (restore) prefetch();
    },
    dispose() {
      disposed = true;
      crate?.destroy();
      crate = null;
      gridButton.removeEventListener('click', onGrid);
      crateButton.removeEventListener('click', onCrate);
      crateButton.removeEventListener('pointerenter', prefetch);
      crateButton.removeEventListener('focusin', prefetch);
      gridButton.disabled = true;
      crateButton.disabled = true;
      crateRoot.removeAttribute('data-store-crate-ready');
      crateRoot.removeAttribute('data-store-crate-switch');
    },
  };
}
