import type * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { BandcampPage, BandcampRecording, buildBandcampEmbedUrl } from '@blackbox/content-model';
import BandcampField, { bandcampInput, bandcampInputPending, type BandcampInput } from './BandcampField';

// The lookup runs in an effect, which static rendering skips, so the test seeds the field state.
const seeded = vi.hoisted(() => ({ input: undefined as unknown }));
vi.mock('react', async (importOriginal) => {
  const react = await importOriginal<typeof React>();
  return { ...react, useState: (initial: unknown) => react.useState(seeded.input ?? initial) };
});

const ethos = 'https://mistyroute.bandcamp.com/album/ethos';
test('validates immutable page values and strips harmless query and fragment parts', () => {
  const page = BandcampPage.parse(' ' + ethos + '/?from=share#music ');
  expect(page?.url).toBe(ethos);
  expect(page?.kind).toBe('album');
  expect(Object.isFrozen(page)).toBe(true);
  for (const url of [
    'http://mistyroute.bandcamp.com/album/ethos',
    'https://mistyroute.bandcamp.com.evil.test/album/ethos',
    'https://user@mistyroute.bandcamp.com/album/ethos',
    'https://mistyroute.bandcamp.com:444/album/ethos',
    'https://music.example/album/ethos',
    'https://mistyroute.bandcamp.com/',
    'https://mistyroute.bandcamp.com/album/ethos/extra',
  ])
    expect(BandcampPage.parse(url)).toBeNull();
});

test('only positive decimal recording IDs cross the API boundary and player layout follows identity', () => {
  for (const id of [0, '0', '-1', '1.5', '1e3', '01', '1'.repeat(21), null])
    expect(BandcampRecording.parse({ kind: 'album', id })).toBeNull();
  expect(BandcampRecording.parse({ kind: 'artist', id: '123' })).toBeNull();
  const recording = BandcampRecording.parse({ kind: 'track', id: '1718987398' })!;
  expect(Object.isFrozen(recording)).toBe(true);
  expect(recording.player.embedLayout).toBe('bandcamp-track');
  expect(recording.player.embedUrl).toContain('/track=1718987398/');
});

test('legacy, versioned and quoted iframe embeds resolve locally with track precedence', () => {
  for (const text of [
    'https://bandcamp.com/EmbeddedPlayer/album=2345223781/',
    'https://bandcamp.com/EmbeddedPlayer/v=2/album=2345223781/size=large/',
    `<iframe src='https://bandcamp.com/EmbeddedPlayer/v=2/album=2345223781/'></iframe>`,
    `<iframe src="https://bandcamp.com/EmbeddedPlayer/album=2345223781/"></iframe>`,
  ]) {
    const input = bandcampInput(text);
    expect(input.status).toBe('resolved');
    expect(bandcampInputPending(input)).toBe(false);
    if (input.status === 'resolved') expect(input.recording.id).toBe('2345223781');
  }
  expect(buildBandcampEmbedUrl('https://bandcamp.com/EmbeddedPlayer/album=2345223781/track=1718987398/')).toContain(
    '/track=1718987398/',
  );
  for (const path of ['album=0', 'v=3/album=123', 'album=123/album=456', 'album=123/unknown=true'])
    expect(buildBandcampEmbedUrl('https://bandcamp.com/EmbeddedPlayer/' + path + '/')).toBe('');
});

test('unresolved pages and malformed text block saving while empty and official embeds do not', () => {
  expect(bandcampInput(ethos).status).toBe('editing');
  expect(bandcampInputPending(bandcampInput(ethos))).toBe(true);
  expect(bandcampInputPending(bandcampInput('invalid'))).toBe(true);
  expect(bandcampInputPending(bandcampInput(''))).toBe(false);
  expect(bandcampInput('https://mistyroute.bandcamp.com/track/hail').status).toBe('editing');
});

test('a failed page lookup links to the Bandcamp page with one recovery instruction', () => {
  const url = 'https://thebruce.bandcamp.com/album/resurrection';
  seeded.input = {
    status: 'failed',
    text: url,
    message: 'Bandcamp is blocking automatic lookup.',
  } satisfies BandcampInput;
  const html = renderToStaticMarkup(
    <BandcampField stored="" base="" disabled={false} errors={[]} onChange={() => undefined} />,
  );
  seeded.input = undefined;
  expect(html).toContain(`href="${url}" target="_blank" rel="noopener noreferrer"`);
  expect(html).toContain('Open on Bandcamp');
  expect(html).toContain('id="content-bandcamp_embed_url-recovery"');
  expect(html).toContain('content-bandcamp_embed_url-error content-bandcamp_embed_url-recovery"');
  expect(html).not.toContain('Resolve, revert or clear');
});

test('a page Bandcamp does not have offers the suggested address as one action', () => {
  const suggestion = BandcampPage.parse('https://jointhebruce.bandcamp.com/album/resurrection')!;
  seeded.input = {
    status: 'failed',
    text: 'https://thebruce.bandcamp.com/album/resurrection',
    message: 'Bandcamp has no album or track at this link.',
    suggestion,
  } satisfies BandcampInput;
  const html = renderToStaticMarkup(
    <BandcampField stored="" base="" disabled={false} errors={[]} onChange={() => undefined} />,
  );
  seeded.input = undefined;
  expect(html.replaceAll('<wbr/>', '')).toContain('Use jointhebruce.bandcamp.com/album/resurrection');
  expect(html).toContain('Bandcamp has no album or track at this link.');
});
