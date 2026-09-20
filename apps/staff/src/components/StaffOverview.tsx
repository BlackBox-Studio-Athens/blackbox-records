import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ClipboardCheck } from 'lucide-react';
import { editorialRequest, type EditorialList, type EditorialRecord } from '../lib/backend/editorial-api';
import { readContentPublications, type ContentPublication } from '../lib/backend/content-publication-api';
import { createInternalOrderApi } from '../lib/backend/internal-order-api';
import { useStaffRead } from '../lib/staff-query';
import { Button } from './ui/button';
import { contentSections, type ContentSection } from '../lib/content-sections';

type PanelState = { status: 'loading' | 'ready' | 'error'; error: string };

const loadingPanel = (): PanelState => ({ status: 'loading', error: '' });

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function StaffOverview({ base }: { base: string }) {
  const [drafts, setDrafts] = useState<EditorialRecord[]>([]);
  const [publications, setPublications] = useState<ContentPublication[]>([]);
  const [reviewOrders, setReviewOrders] = useState(false);
  const [draftsState, setDraftsState] = useState<PanelState>(loadingPanel);
  const [publicationsState, setPublicationsState] = useState<PanelState>(loadingPanel);
  const [ordersState, setOrdersState] = useState<PanelState>(loadingPanel);
  const generation = useRef(0);
  const mounted = useRef(false);
  const draftsRequest = useRef(0);
  const publicationsRequest = useRef(0);
  const ordersRequest = useRef(0);

  function isCurrent(id: number) {
    return mounted.current && generation.current === id;
  }

  async function readDrafts(id: number) {
    const request = ++draftsRequest.current;
    try {
      const page = await editorialRequest<EditorialList<EditorialRecord>>(base, 'blackbox/workspace');
      if (!isCurrent(id) || draftsRequest.current !== request) return;
      setDrafts(page.items);
      setDraftsState({ status: 'ready', error: '' });
    } catch (error) {
      if (isCurrent(id) && draftsRequest.current === request)
        setDraftsState({ status: 'error', error: errorMessage(error, 'Recent drafts unavailable.') });
    }
  }

  async function readPublications(id: number) {
    const request = ++publicationsRequest.current;
    try {
      const page = await readContentPublications(base);
      if (!isCurrent(id) || publicationsRequest.current !== request) return;
      setPublications(page.items);
      setPublicationsState({ status: 'ready', error: '' });
    } catch (error) {
      if (isCurrent(id) && publicationsRequest.current === request)
        setPublicationsState({ status: 'error', error: errorMessage(error, 'Publication status unavailable.') });
    }
  }

  async function readOrders(id: number) {
    const request = ++ordersRequest.current;
    try {
      const page = await createInternalOrderApi(base).search({ status: 'needs_review', limit: 1 });
      if (!isCurrent(id) || ordersRequest.current !== request) return;
      setReviewOrders(page.items.length > 0);
      setOrdersState({ status: 'ready', error: '' });
    } catch (error) {
      if (isCurrent(id) && ordersRequest.current === request)
        setOrdersState({ status: 'error', error: errorMessage(error, 'Order review status unavailable.') });
    }
  }

  async function read() {
    const id = ++generation.current;
    setDraftsState(loadingPanel());
    setPublicationsState(loadingPanel());
    setOrdersState(loadingPanel());
    await Promise.all([readDrafts(id), readPublications(id), readOrders(id)]);
  }

  function retryDrafts() {
    setDraftsState(loadingPanel());
    void readDrafts(generation.current);
  }

  function retryPublications() {
    setPublicationsState(loadingPanel());
    void readPublications(generation.current);
  }

  function retryOrders() {
    setOrdersState(loadingPanel());
    void readOrders(generation.current);
  }

  useEffect(() => {
    mounted.current = true;
    void read();
    return () => {
      mounted.current = false;
      generation.current++;
    };
  }, [base]);
  useStaffRead(['overview', base], read);
  const publicationFailed = publications[0]?.status === 'failed';
  const showAttention =
    reviewOrders || publicationFailed || publicationsState.status === 'error' || ordersState.status === 'error';
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
      {showAttention && (
        <section className="mt-8">
          <h2>Needs attention</h2>
          <div className="staff-destinations">
            {reviewOrders && (
              <a href="/orders/?status=needs_review">
                Review orders
                <ArrowRight aria-hidden="true" />
              </a>
            )}
            {publicationFailed && (
              <a href="/content/?history=1">
                Website update not confirmed
                <ArrowRight aria-hidden="true" />
              </a>
            )}
          </div>
          {publicationsState.status === 'error' && (
            <div className="mt-4" role="alert">
              <p>{publicationsState.error}</p>
              <Button variant="outline" onClick={retryPublications}>
                Retry publication status
              </Button>
            </div>
          )}
          {ordersState.status === 'error' && (
            <div className="mt-4" role="alert">
              <p>{ordersState.error}</p>
              <Button variant="outline" onClick={retryOrders}>
                Retry order status
              </Button>
            </div>
          )}
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
        {draftsState.status === 'loading' && !drafts.length ? (
          <p role="status" className="mt-4 text-muted-foreground">
            Loading recent work…
          </p>
        ) : draftsState.status === 'error' ? (
          <div className="mt-4" role="alert">
            <p>{draftsState.error}</p>
            <Button variant="outline" onClick={retryDrafts}>
              Retry recent drafts
            </Button>
          </div>
        ) : (
          <div className="staff-destinations">
            {drafts.length ? (
              drafts.map((draft) => (
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
            ) : (
              <p className="mt-4 text-muted-foreground">No recent drafts to finish.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
