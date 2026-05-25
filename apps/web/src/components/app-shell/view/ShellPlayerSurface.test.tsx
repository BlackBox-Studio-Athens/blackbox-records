import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import type { PlayerProvider } from '../player-provider-data';
import ShellPlayerSurface from './ShellPlayerSurface';

const bandcampProvider: PlayerProvider = {
  embedLayout: 'bandcamp-album',
  embedUrl: 'https://bandcamp.test/embed',
  id: 'bandcamp',
};

const tidalProvider: PlayerProvider = {
  embedLayout: 'tidal',
  embedUrl: 'https://tidal.test/embed',
  id: 'tidal',
};

const providers: PlayerProvider[] = [bandcampProvider, tidalProvider];

function renderPlayerSurface(overrides: Partial<React.ComponentProps<typeof ShellPlayerSurface>> = {}) {
  return renderToStaticMarkup(
    <ShellPlayerSurface
      activePlayerEmbedLayout="bandcamp-album"
      activePlayerProviderId="bandcamp"
      activePlayerTitle="Disintegration"
      applyPlayerProvider={vi.fn()}
      iframeFrameHostRef={{ current: null }}
      isMiniPlayerVisible={false}
      isPlayerLoading={false}
      isPlayerModalOpen={false}
      markActivePlayerSurfaceAsInteracted={vi.fn()}
      miniPlayerStatusLabel="Player Ready · Bandcamp"
      modalCloseButtonRef={{ current: null }}
      onModalBackdropClick={vi.fn()}
      playerModalDismissActionLabel="Close"
      playerModalDismissAriaLabel="Close player"
      playerProviders={providers}
      providerLogoUrls={{
        bandcamp: '/assets/images/brand/bandcamp-button-black.png',
        tidal: '/assets/images/brand/tidal-button-black.png',
      }}
      {...overrides}
    />,
  );
}

describe('ShellPlayerSurface', () => {
  it('renders the closed modal and hidden mini player state', () => {
    const html = renderPlayerSurface();

    expect(html).toContain('data-state="closed"');
    expect(html).toContain('aria-busy="false"');
    expect(html).toContain('aria-label="Close player"');
    expect(html).toContain('data-state="active"');
    expect(html).toContain('data-state="inactive"');
  });

  it('renders the minimized player state without changing action labels', () => {
    const html = renderPlayerSurface({
      isMiniPlayerVisible: true,
      playerModalDismissActionLabel: 'Minimize',
      playerModalDismissAriaLabel: 'Minimize player',
    });

    expect(html).toContain('data-state="open"');
    expect(html).toContain('aria-label="Minimize player"');
    expect(html).toContain('Player Ready · Bandcamp');
    expect(html).toContain('Disintegration');
    expect(html).toContain('aria-label="Stop player"');
  });

  it('keeps the provider switcher hidden for single-provider sessions', () => {
    const html = renderPlayerSurface({
      playerProviders: [bandcampProvider],
    });

    expect(html).toContain('hidden=""');
    expect(html).toContain('aria-label="Bandcamp"');
  });

  it('renders player loading as a visible busy status without implying playback started', () => {
    const html = renderPlayerSurface({
      isPlayerLoading: true,
      isPlayerModalOpen: true,
    });

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('role="status"');
    expect(html).toContain('Loading player');
    expect(html).toContain('Playback starts after you interact with the provider frame.');
    expect(html).not.toContain('Playing');
  });
});
