import { useEffect, useState } from 'react';
import { ArrowRight, ClipboardCheck } from 'lucide-react';
import { editorialRequest, type EditorialList, type EditorialRecord } from '../lib/backend/editorial-api';
import { readContentPublications, type ContentPublication } from '../lib/backend/content-publication-api';
import { createInternalOrderApi } from '../lib/backend/internal-order-api';
import { useStaffRead } from '../lib/staff-query';
import { Button } from './ui/button';
import { contentSections, type ContentSection } from './content/ContentFields';

export default function StaffOverview({ base }: { base: string }) {
  const [drafts, setDrafts] = useState<EditorialRecord[]>([]);
  const [publications, setPublications] = useState<ContentPublication[]>([]);
  const [reviewOrders, setReviewOrders] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  async function read() {
    const results = await Promise.allSettled([
      editorialRequest<EditorialList<EditorialRecord>>(base, 'blackbox/workspace').then((page) =>
        setDrafts(page.items),
      ),
      readContentPublications(base).then((page) => setPublications(page.items)),
      createInternalOrderApi(base)
        .search({ status: 'needs_review', limit: 1 })
        .then((page) => setReviewOrders(page.items.length > 0)),
    ]);
    setError(results.some((result) => result.status === 'rejected') ? 'Some recent work could not be loaded.' : '');
    setLoading(false);
  }
  useEffect(() => {
    void read();
  }, [base]);
  useStaffRead(['overview', base], read);
  return (
    <div className="staff-page">
      <h1>Overview</h1>
      <div className="staff-destinations">
        <a href="/content/">
          <div>
            <strong>Edit a page</strong>
            <p>Update the website’s words and images.</p>
          </div>
          <ArrowRight aria-hidden="true" />
        </a>
        <a href="/items/">
          <div>
            <strong>Add to the catalog</strong>
            <p>A release, distro title or merch.</p>
          </div>
          <ArrowRight aria-hidden="true" />
        </a>
        <a href="/stock/">
          <div>
            <strong>Update stock</strong>
            <p>Record a sale, new delivery or count.</p>
          </div>
          <ArrowRight aria-hidden="true" />
        </a>
      </div>
      {(reviewOrders || publications[0]?.status === 'failed') && (
        <section className="mt-8">
          <h2>Needs attention</h2>
          <div className="staff-destinations">
            {reviewOrders && (
              <a href="/orders/?status=needs_review">
                Review orders
                <ArrowRight aria-hidden="true" />
              </a>
            )}
            {publications[0]?.status === 'failed' && (
              <a href="/content/?history=1">
                Website update not confirmed
                <ArrowRight aria-hidden="true" />
              </a>
            )}
          </div>
        </section>
      )}
      <section className="mt-8">
        <h2>Recent drafts</h2>
        <Button asChild className="staff-overview-review">
          <a href="/review/">
            <ClipboardCheck aria-hidden="true" />
            Review changes
          </a>
        </Button>
        {loading ? (
          <p role="status" className="mt-4 text-muted-foreground">
            Loading recent work…
          </p>
        ) : (
          <div className="staff-destinations">
            {drafts.length
              ? drafts.map((draft) => (
                  <a
                    key={`${draft.collection}:${draft.id}`}
                    href={`/content/?${new URLSearchParams({ collection: draft.collection ?? 'artists', id: draft.id })}`}
                  >
                    <div>
                      <strong>
                        {String(
                          draft.data.title ||
                            draft.data.label_name ||
                            contentSections[draft.collection as ContentSection] ||
                            'Untitled',
                        )}
                      </strong>
                      <p>
                        {draft.publicationState === 'pending'
                          ? 'Updating website…'
                          : draft.publicationState === 'changes'
                            ? 'Unpublished changes'
                            : 'Draft'}
                      </p>
                    </div>
                    <ArrowRight aria-hidden="true" />
                  </a>
                ))
              : !error && <p className="mt-4 text-muted-foreground">No recent drafts to finish.</p>}
          </div>
        )}
      </section>
      {error && (
        <div className="mt-4" role="alert">
          <p>{error}</p>
          <Button variant="outline" onClick={() => void read()}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
