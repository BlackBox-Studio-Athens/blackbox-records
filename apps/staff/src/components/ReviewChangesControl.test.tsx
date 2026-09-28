import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import ReviewChangesControl from './ReviewChangesControl';

it('keeps review unavailable until the saved changes check finds an entry', () => {
  const html = renderToStaticMarkup(<ReviewChangesControl />);
  expect(html).toContain('disabled="" aria-label="Checking changes"');
  expect(html).not.toContain('href="/review/"');
});
