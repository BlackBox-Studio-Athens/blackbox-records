/**
 * Dispatched on the roster root by the filters island after every filter or sort change, so the preview island can
 * drop an active artist that is no longer listed. `detail.visibleIds` is in the order rows are shown.
 */
export const artistRosterVisibleEvent = 'artist-roster:visible';

export type ArtistRosterVisibleDetail = { visibleIds: string[] };

/** Active artist plus the most recently previewed ones, newest first (at most `previewHistoryLimit`). */
export type PreviewState = { active: string | null; history: string[] };

const previewHistoryLimit = 2;

export const initialPreviewState: PreviewState = { active: null, history: [] };

/** Make `id` the top print and push the previous one onto the pile. Re-selecting the active id is a no-op. */
export function nextPreviewState(state: PreviewState, id: string): PreviewState {
  if (state.active === id) return state;
  const history = state.active ? [state.active, ...state.history.filter((entry) => entry !== id)] : [];
  return { active: id, history: history.slice(0, previewHistoryLimit) };
}

/** Keep only listed artists; an unlisted or unset active artist falls back to the first listed row. */
export function reconcilePreviewState(state: PreviewState, visibleIds: string[]): PreviewState {
  const [firstId] = visibleIds;
  if (firstId === undefined) return state;

  const visible = new Set(visibleIds);
  const active = state.active !== null && visible.has(state.active) ? state.active : firstId;
  const history = state.history.filter((id) => id !== active && visible.has(id));
  const unchanged =
    active === state.active &&
    history.length === state.history.length &&
    history.every((id, index) => id === state.history[index]);
  return unchanged ? state : { active, history };
}

export function getPrintDepth(state: PreviewState, id: string): 0 | 1 | 2 | null {
  if (state.active === id) return 0;
  const index = state.history.indexOf(id);
  return index === 0 ? 1 : index === 1 ? 2 : null;
}

type PreviewRoot = Pick<ParentNode, 'querySelectorAll'>;

/**
 * Artist id a delegated event should preview. Pointer events count only on the row link; focus also counts on the
 * roster item itself, which is where the A-Z jump index moves focus.
 */
export function resolvePreviewTargetId(eventType: string, target: Pick<Element, 'closest'> | null) {
  const selector =
    eventType === 'focusin' ? '[data-artist-roster-row], [data-artist-roster-item]' : '[data-artist-roster-row]';
  return target?.closest<HTMLElement>(selector)?.dataset.artistId || null;
}

function idOf(element: HTMLElement) {
  return element.dataset.artistId ?? '';
}

/** Ids of roster rows that are not filtered out, in DOM order. */
export function readListedArtistIds(root: PreviewRoot) {
  return [...root.querySelectorAll<HTMLElement>('[data-artist-roster-item]')].filter((item) => !item.hidden).map(idOf);
}

/**
 * Write a preview state to the server-rendered deck, details, and rows. `null` restores the server default: first
 * print on top, first details visible, no active row.
 */
export function applyPreviewState(root: PreviewRoot, requested: PreviewState | null) {
  const prints = [...root.querySelectorAll<HTMLElement>('[data-artist-preview-print]')];
  const details = [...root.querySelectorAll<HTMLElement>('[data-artist-preview-details]')];
  const rows = [...root.querySelectorAll<HTMLElement>('[data-artist-roster-row]')];
  const state: PreviewState = requested ?? { active: prints[0] ? idOf(prints[0]) : null, history: [] };

  for (const print of prints) {
    const depth = getPrintDepth(state, idOf(print));
    print.hidden = depth === null;
    if (depth === null) print.removeAttribute('data-print-depth');
    else print.setAttribute('data-print-depth', String(depth));
    if (depth === 1 || depth === 2) print.setAttribute('aria-hidden', 'true');
    else print.removeAttribute('aria-hidden');
  }

  for (const block of details) block.hidden = idOf(block) !== state.active;
  for (const row of rows) row.toggleAttribute('data-active', requested !== null && idOf(row) === state.active);
}
