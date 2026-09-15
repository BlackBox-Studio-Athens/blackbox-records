import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PublicationStatus from './PublicationStatus';
import type { ContentPublication } from '../../lib/backend/content-publication-api';

it('distinguishes pending, unresolved failure, confirmed live and unavailable history', () => {
  const render = (items: ContentPublication[], message = '') =>
    renderToStaticMarkup(<PublicationStatus items={items} message={message} refresh={async () => {}} />);
  const failed: ContentPublication = { id: 'failed', status: 'failed', requestedAt: 1 };
  expect(render([{ id: 'pending', status: 'pending', requestedAt: 2 }])).toContain('Publishing · 1 pending');
  expect(render([failed])).toContain('Publication failed');
  expect(render([{ id: 'live', status: 'live', requestedAt: 2 }, failed])).toContain('Latest publication live');
  expect(render([], 'Publication status is unavailable.')).toContain('Publication status unavailable');
  expect(render([])).not.toContain('Latest publication live');
});
