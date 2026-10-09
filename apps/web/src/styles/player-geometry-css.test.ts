import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('./global.css', import.meta.url)), 'utf8');
const card = '.music-streaming-service-embedded-player-modal-card';

describe('player geometry on phones', () => {
  it('reserves the floating player height at the page end while a session exists', () => {
    expect(css).toMatch(
      /html\[data-music-player-session\] body\s*{[^}]*padding-bottom:\s*var\(--music-player-mini-reserve\)/,
    );
    expect(css).toMatch(
      /html\[data-music-player-session\]\s*{[^}]*scroll-padding-bottom:\s*var\(--music-player-mini-reserve\)/,
    );
  });

  it('caps the phone album frame at the embed height', () => {
    const phoneBlock = css.slice(css.indexOf('@media (max-width: 40rem)'));
    const albumRule = phoneBlock.slice(
      phoneBlock.indexOf(`${card}[data-music-streaming-service-embedded-player-embed-layout='bandcamp-album']`),
    );
    expect(albumRule).toMatch(/^[^}]*--music-player-frame-height:\s*min\(\s*calc\(100vw - 1\.7rem \+ 7\.3rem\)/);
  });

  it('fits the embed to short viewports beside the header', () => {
    const shortBlock = css.slice(css.indexOf('@media (max-height: 30rem)'));
    expect(shortBlock).toMatch(/grid-template-columns:\s*minmax\(0, 18rem\) auto/);
    expect(shortBlock).toMatch(/--music-player-frame-height:\s*calc\(\s*100dvh/);
    expect(shortBlock).toMatch(
      /--music-player-frame-width:\s*min\(21\.875rem, calc\(var\(--music-player-frame-height\) - 7\.3rem\)\)/,
    );
  });
});
