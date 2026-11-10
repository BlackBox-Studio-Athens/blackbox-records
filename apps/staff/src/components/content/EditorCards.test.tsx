import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import EditorCards, { cardState } from './EditorCards';

test('card state follows the stored values and the validation messages under its paths', () => {
  const none = { byPath: {} };
  expect(cardState(['title'], { title: 'Vol. I' }, none)).toBe('done');
  expect(cardState(['facebook_url'], {}, none)).toBe('optional');
  expect(cardState(['title'], { title: '' }, { byPath: { title: ['Enter a value.'] } })).toBe('missing');
  // A poster without its description is a problem, not merely missing.
  expect(
    cardState(['poster', 'poster_alt'], { poster: { id: 'p' } }, { byPath: { poster_alt: ['Describe it.'] } }),
  ).toBe('problem');
  expect(cardState(['lineup'], { lineup: [{ role: 'opening' }] }, { byPath: { 'lineup.0.artist': ['x'] } })).toBe(
    'problem',
  );
  // Messages for other cards do not leak in, even with a shared prefix.
  expect(cardState(['date'], { date: '2026-12-05' }, { byPath: { dates: ['x'] } })).toBe('done');
});

test('cards render as one exclusive group of headers with state text and summaries', () => {
  const markup = renderToStaticMarkup(
    <EditorCards
      name="show-1"
      data={{ title: 'Vol. I', poster: { id: 'p' } }}
      validation={{ byPath: { poster_alt: ['Describe it.'], date: ['Enter a date.'] } }}
      cards={[
        { id: 'title', title: 'Title', paths: ['title'], summary: 'Vol. I', content: <p>title body</p> },
        { id: 'when', title: 'When', paths: ['date'], summary: 'Date missing', content: <p>when body</p> },
        {
          id: 'poster',
          title: 'Poster',
          paths: ['poster', 'poster_alt'],
          summary: 'Description missing',
          content: null,
        },
        { id: 'links', title: 'Links', paths: ['facebook_url'], summary: 'No Facebook event', content: null },
      ]}
    />,
  );
  expect(markup.match(/<details[^>]*name="show-1"/g)).toHaveLength(4);
  expect(markup).not.toMatch(/<details[^>]* open=/);
  expect(markup.indexOf('Title')).toBeLessThan(markup.indexOf('When'));
  for (const text of [', Done, ', ', Required, missing, ', ', Needs attention, ', ', Optional, '])
    expect(markup).toContain(text);
  expect(markup).toMatch(/data-editor-card="poster" data-state="problem"/);
  expect(markup).toContain('Description missing');
  // Bodies stay mounted so the focus-first-invalid step can reach their fields.
  expect(markup).toContain('when body');
  expect(markup).toContain('min-h-11');
});
