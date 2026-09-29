import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PublicationStatus, { summarizePublicationStatus } from './PublicationStatus';
import type { ContentPublication } from '../../lib/backend/content-publication-api';

const publication = (id: string, status: ContentPublication['status'], requestedAt: number): ContentPublication => ({
  id,
  status,
  requestedAt,
});

describe('summarizePublicationStatus', () => {
  it('lets a newer pending request outrank an older failure', () => {
    expect(
      summarizePublicationStatus([publication('pending', 'pending', 2), publication('failed', 'failed', 1)]),
    ).toMatchObject({ view: 'pending', label: 'Publishing · 1 pending' });
  });

  it('lets a newer live request outrank an older failure', () => {
    expect(
      summarizePublicationStatus([publication('live', 'live', 2), publication('failed', 'failed', 1)]),
    ).toMatchObject({ view: 'live', label: 'Latest publication live' });
  });

  it('reports the newest failure', () => {
    expect(
      summarizePublicationStatus([publication('failed', 'failed', 2), publication('live', 'live', 1)]),
    ).toMatchObject({
      view: 'failed',
      label: 'Publication failed',
    });
  });

  it('keeps a known state stale when status refresh fails', () => {
    expect(
      summarizePublicationStatus([publication('pending', 'pending', 1)], { statusError: 'Status unavailable.' }),
    ).toMatchObject({ view: 'pending', stale: true });
    expect(summarizePublicationStatus([], { statusError: 'Status unavailable.' })).toMatchObject({
      view: 'unavailable',
      label: 'Publication status unavailable',
    });
  });

  it('reports empty history explicitly', () => {
    expect(summarizePublicationStatus([])).toMatchObject({ view: 'empty', label: 'Publication history' });
  });
});

it('renders pending status without a routine refresh action', () => {
  const html = renderToStaticMarkup(
    <PublicationStatus
      items={[publication('pending', 'pending', 2), publication('failed', 'failed', 1)]}
      message="Publication requested. Wait for Live."
      refresh={async () => {}}
    />,
  );
  expect(html).toContain('Publishing · 1 pending');
  expect(html).not.toContain('aria-label="Check publication status"');
});

it('does not let an operation message reclassify history', () => {
  const html = renderToStaticMarkup(
    <PublicationStatus
      items={[publication('live', 'live', 2), publication('failed', 'failed', 1)]}
      message="Publication failed. Select Publish changes to try again."
      refresh={async () => {}}
    />,
  );
  expect(html).toContain('Latest publication live');
});

it('offers a contextual status retry when reads fail', () => {
  const html = renderToStaticMarkup(
    <PublicationStatus items={[]} message="" statusError="Connection lost" refresh={async () => {}} />,
  );
  expect(html).toContain('aria-label="Check publication status"');
});
