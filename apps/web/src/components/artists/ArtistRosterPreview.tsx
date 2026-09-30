import { useEffect, useReducer, useRef } from 'react';

import {
  applyPreviewState,
  artistRosterVisibleEvent,
  initialPreviewState,
  nextPreviewState,
  readListedArtistIds,
  reconcilePreviewState,
  resolvePreviewTargetId,
  type ArtistRosterVisibleDetail,
  type PreviewState,
} from './artist-roster-preview-state';

type PreviewAction = { type: 'hover'; id: string } | { type: 'listed'; ids: string[] };

function previewReducer(state: PreviewState, action: PreviewAction) {
  return action.type === 'hover' ? nextPreviewState(state, action.id) : reconcilePreviewState(state, action.ids);
}

/**
 * Behaviour-only island: the print deck, details, and rows are server-rendered. It delegates hover and focus from the
 * roster rows, and follows filter/sort changes through `artistRosterVisibleEvent`.
 */
export default function ArtistRosterPreview() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [state, dispatch] = useReducer(previewReducer, initialPreviewState);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-artists-roster-root]');
    if (!root) return;
    rootRef.current = root;

    const select = (event: Event) => {
      const id = resolvePreviewTargetId(event.type, event.target instanceof Element ? event.target : null);
      if (id) dispatch({ type: 'hover', id });
    };
    const follow = (event: Event) => {
      dispatch({ type: 'listed', ids: (event as CustomEvent<ArtistRosterVisibleDetail>).detail.visibleIds });
    };

    root.addEventListener('pointerover', select);
    root.addEventListener('focusin', select);
    root.addEventListener(artistRosterVisibleEvent, follow);
    dispatch({ type: 'listed', ids: readListedArtistIds(root) });

    return () => {
      root.removeEventListener('pointerover', select);
      root.removeEventListener('focusin', select);
      root.removeEventListener(artistRosterVisibleEvent, follow);
      applyPreviewState(root, null);
      rootRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (rootRef.current && state.active) applyPreviewState(rootRef.current, state);
  }, [state]);

  return null;
}
