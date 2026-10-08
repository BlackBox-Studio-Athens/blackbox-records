// DOM helpers for the server-rendered Artists checklist, shared by the Store search island and snapshot sanitation.

const optionSelector = '[data-store-artist-option]';

export function normalizeStoreArtist(artist: string) {
  return artist.normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase();
}

function optionIndex(label: HTMLElement) {
  return Number(label.dataset.storeArtistIndex);
}

/**
 * Moves ticked options into the Selected group and the rest back into the list, both in server order. Moving a node
 * drops its focus, so a moved checkbox that had focus gets it back. Returns the number of ticked artists.
 */
export function placeStoreArtistOptions(fieldset: ParentNode) {
  const selectedList = fieldset.querySelector<HTMLElement>('[data-store-artist-selected-list]');
  const list = fieldset.querySelector<HTMLElement>('[data-store-artist-options]');
  if (!selectedList || !list) return 0;
  const labels = [...fieldset.querySelectorAll<HTMLElement>(optionSelector)].sort(
    (a, b) => optionIndex(a) - optionIndex(b),
  );
  const ticked = labels.filter((label) => label.querySelector<HTMLInputElement>('input')?.checked);
  const unticked = labels.filter((label) => !ticked.includes(label));
  const focused = labels.find((label) => label.contains(label.ownerDocument.activeElement));
  const restore = focused?.ownerDocument.activeElement as HTMLElement | undefined;
  let moved = false;
  for (const [target, items] of [
    [selectedList, ticked],
    [list, unticked],
  ] as const) {
    let reference = target.firstElementChild;
    for (const item of items) {
      if (item === reference) {
        reference = reference.nextElementSibling;
      } else {
        target.insertBefore(item, reference);
        if (item === focused) moved = true;
      }
    }
  }
  ticked.forEach((label) => (label.hidden = false));
  const group = fieldset.querySelector<HTMLElement>('[data-store-artist-selected]');
  if (group) group.hidden = ticked.length === 0;
  const summary = fieldset.querySelector<HTMLElement>('[data-store-artist-selected-label]');
  if (summary) summary.textContent = `Selected · ${ticked.length}`;
  if (moved && restore?.isConnected) restore.focus();
  return ticked.length;
}

/** Narrows the unticked list to names containing the query; ticked artists stay in the Selected group. */
export function filterStoreArtistOptions(fieldset: ParentNode, query: string) {
  const list = fieldset.querySelector<HTMLElement>('[data-store-artist-options]');
  if (!list) return;
  const needle = normalizeStoreArtist(query);
  let shown = 0;
  list.querySelectorAll<HTMLElement>(optionSelector).forEach((label) => {
    const match = !needle || (label.dataset.storeArtistName ?? '').includes(needle);
    label.hidden = !match;
    if (match) shown += 1;
  });
  const noMatch = fieldset.querySelector<HTMLElement>('[data-store-artist-no-match]');
  if (noMatch) noMatch.hidden = !needle || shown > 0;
}

/** The phone Artists chip names how many artists are ticked and takes the selected edge while any are. */
export function setStoreArtistsTrigger(trigger: HTMLElement, count: number) {
  const label = trigger.querySelector<HTMLElement>('[data-store-artists-trigger-label]');
  if (label) label.textContent = count > 0 ? `Artists · ${count}` : 'Artists';
  trigger.toggleAttribute('data-store-artists-active', count > 0);
}

/** The chip keeps its server box, disabled, so cached and restored pages do not shift the toolbar row. */
export function resetStoreArtistsTrigger(trigger: HTMLButtonElement) {
  trigger.disabled = true;
  trigger.hidden = false;
  setStoreArtistsTrigger(trigger, 0);
}

/** Returns the checklist to its server state: closed sheet, list in the pane, nothing ticked, no find query. */
export function resetStoreArtistControls(host: ParentNode) {
  const fieldset = host.querySelector<HTMLFieldSetElement>('[data-store-artist-fieldset]');
  const sheet = host.querySelector<HTMLElement>('[data-store-artists-sheet]');
  if (sheet) sheet.removeAttribute('open');
  if (fieldset && sheet?.contains(fieldset)) sheet.before(fieldset);
  host.querySelectorAll<HTMLInputElement>('input[name="store-artist"]').forEach((checkbox) => {
    checkbox.checked = false;
    checkbox.removeAttribute('checked');
  });
  const find = host.querySelector<HTMLInputElement>('[data-store-artist-find]');
  if (find) {
    find.value = '';
    find.removeAttribute('value');
  }
  if (!fieldset) return;
  fieldset.disabled = true;
  placeStoreArtistOptions(fieldset);
  filterStoreArtistOptions(fieldset, '');
}
